/* globals
canvas,
CONFIG,
CONST,
foundry,
game,
PIXI,
Ruler,
ui
*/
/* eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */

// Patches for the Ruler class
export const PATCHES = {};
PATCHES.BASIC = {};
PATCHES.SPEED_HIGHLIGHTING = {};

import { SPEED, MODULE_ID, OTHER_MODULES, MOVEMENT_TYPES } from "./const.js";
import { Settings } from "./settings.js";
import { Ray3d } from "./geometry/3d/Ray3d.js";
import {
  elevationFromWaypoint,
  originElevation,
  destinationElevation,
  terrainElevationAtLocation,
  terrainElevationForMovement,
  terrainPathForMovement,
  userElevationChangeAtWaypoint } from "./terrain_elevation.js";
import {
  elevateSegments,
  calculatePathPointsForSegment,
  constructPathfindingSegments } from "./segments.js";
import { movementTypeForTokenAt } from "./token_hud.js";
import {
  highlightLineRectangle,
  basicTextLabel,
  customizedTextLabel } from "./segment_labels_highlighting.js";
import { tokenSpeedSegmentSplitter } from "./token_speed.js";
import { log, roundMultiple } from "./util.js";
import { MovePenalty } from "./measurement/MovePenalty.js";
import { GridCoordinates3d } from "./geometry/3d/GridCoordinates3d.js";
import { RegionMovementWaypoint3d } from "./geometry/3d/RegionMovementWaypoint3d.js";

/**
 * Modified Ruler
 * Measure elevation change at each waypoint and destination.
 * Modify distance calculation accordingly.
 * Display current elevation change and change at each waypoint.
 */

/**
 * Typical Ruler workflow:
 * - clear when drag starts
 * - create initial waypoint
 * - measure (likely multiple)
 * - add'l waypoints (optional)
 * - possible token movement
 * - clear when drag abandoned
 */

/* Ruler measure workflow
- Update destination
- _getMeasurementSegments
  --> Create new array of segments
  * ER assigns elevation value to each segment based on user increments: `elevateSegments`
  * ER either uses pathfinding or TM's region path to expand the segments

- _computeDistance
  --> iterates over each segment
  --> calculates totalDistance and totalCost by iterating over segments.
  --> uses `canvas.grid.measurePath` for each with the _getCostFunction
  --> calculates distance, cost, cumulative distance, and cumulative cost for each segment
  * ER uses `_computeSegmentDistances` to calculate 3d distance with move penalty
  * ER adds segment properties used for labeling
- _broadcastMeasurement
- _drawMeasuredPath
  --> Iterates over each segment, assigning a label to each using _getSegmentLabel
    * ER adds elevation and move penalty label information
- _highlightMeasurementSegments
  * ER splits the highlighting at move breaks if speed highlighting is set
*/

/* Elevation measurement

Each waypoint has added properties:
- _userElevationIncrements: Elevation shifts up or down at this point due to user input
- _terrainElevation: Ground/terrain elevation at this location, calculated as needed
- elevation: The calculated elevation of this waypoint, which is the previous waypoint elevation
  plus changes due to user increments, terrain

*/

// ----- NOTE: Ruler broadcasting ----- //

/**
 * Wrap Ruler.prototype._getMeasurementData
 * Store the current userElevationIncrements for the destination.
 * Store segment information, possibly including pathfinding.
 */
function _getMeasurementData(wrapper) {
  const obj = wrapper();
  const myObj = obj[MODULE_ID] = {};

  // Segment information
  // Simplify the ray.
  if ( this.segments ) {myObj._segments = this.segments.map(segment => {
    const newObj = { ...segment };
    newObj.ray = {
      A: segment.ray.A,
      B: segment.ray.B
    };
    newObj.label = Boolean(segment.label);
    if ( segment.speed ) {newObj.speed = segment.speed.name;}
    return newObj;
  });}

  myObj.totalDistance = this.totalDistance;
  myObj.totalOffsetDistance = this.totalOffsetDistance;
  myObj.totalCost = this.totalCost;
  myObj.totalDiagonals = this.totalDiagonals;
  myObj._isTokenRuler = this._isTokenRuler;
  return obj;
}

/**
 * Wrap Ruler.prototype.update
 * Retrieve the current _userElevationIncrements.
 * Retrieve the current snap status.
 */
function update(wrapper, data) {
  if ( !data || (data.state === Ruler.STATES.INACTIVE) ) {return wrapper(data);}
  const myData = data[MODULE_ID];
  if ( !myData ) {return wrapper(data);} // Just in case.

  // Hide GM token ruler
  if ( data.token
    && this.user.isGM
    && !game.user.isGM && Settings.get(Settings.KEYS.TOKEN_RULER.HIDE_GM)) {return wrapper(data);}

  // Fix for displaying user elevation increments as they happen.
  const triggerMeasure = this._userElevationIncrements !== myData._userElevationIncrements;
  this._isTokenRuler = myData._isTokenRuler;

  // Reconstruct segments.
  if ( myData._segments ) {this.segments = myData._segments.map(segment => {
    segment.ray = new Ray3d(segment.ray.A, segment.ray.B);
    if ( segment.speed ) {segment.speed = SPEED.CATEGORIES.find(category => category.name === segment.speed);}
    return segment;
  });}

  // Add the calculated distance totals.
  this.totalDistance = myData.totalDistance;
  this.totalOffsetDistance = myData.totalOffsetDistance;
  this.totalCost = myData.totalCost;
  this.totalDiagonals = myData.totalDiagonals;

  wrapper(data);

  if ( triggerMeasure ) {
    const ruler = canvas.controls.ruler;
    this.destination.x -= 1;
    ruler.measure(this.destination);
  }
}

/**
 * Mixed wrap Ruler#_broadcastMeasurement
 * For token ruler, don't broadcast the ruler if the token is invisible or disposition secret.
 */
function _broadcastMeasurement(wrapped) {
  // Update the local token elevation if using token ruler.
  if ( this._isTokenRuler && this.token?.hasPreview ) {
    const destination = this.segments.at(-1)?.ray.B;
    const previewToken = this.token._preview;
    if ( destination ) {
      const destElevation = roundMultiple(CONFIG.GeometryLib.utils.pixelsToGridUnits(destination.z));
      const elevationChanged = previewToken.document.elevation !== destElevation;
      if ( elevationChanged && isFinite(destElevation) ) {
        previewToken.document.elevation = destElevation;
        previewToken.renderFlags.set({ refreshTooltip: true });
      }
    }
  }

  // Don't broadcast invisible, hidden, or secret token movement when dragging.
  if ( this._isTokenRuler
    && this.token
    && (this.token.document.disposition === CONST.TOKEN_DISPOSITIONS.SECRET
     || this.token.document.hasStatusEffect(CONFIG.specialStatusEffects.INVISIBLE)
     || this.token.document.hidden) ) {return;}

  wrapped();
}

// ----- NOTE: Waypoints, origin, destination ----- //

/**
 * Override Ruler.prototype._addWaypoint
 * Add elevation increments before measuring.
 * @param {Point} point                    The waypoint
 * @param {object} [options]               Additional options
 * @param {boolean} [options.snap=true]    Snap the waypoint?
 */
function _addWaypoint(point, {snap=true}={}) {
  if ( (this.state !== Ruler.STATES.STARTING) && (this.state !== Ruler.STATES.MEASURING ) ) {return;}
  const waypoint = this.state === Ruler.STATES.STARTING
    ? this._getMeasurementOrigin(point, {snap})
    : this._getMeasurementDestination(point, {snap});

  // Set defaults
  waypoint._userElevationIncrements = 0;
  waypoint._forceToGround = Settings.FORCE_TO_GROUND;
  waypoint.elevation = 0;

  // Determine the elevation up until this point
  const isOriginWaypoint = !this.waypoints.length;
  if ( isOriginWaypoint ) {
    waypoint._forceToGround = false;
    waypoint.elevation = this.token?.elevationE ?? terrainElevationAtLocation(point) ?? 0;
  } else {
    waypoint.elevation = elevationFromWaypoint(this.waypoints.at(-1), waypoint, this.token);
  }

  this.waypoints.push(waypoint);
  this._state = Ruler.STATES.MEASURING;
  this.measure(this.destination ?? point, {snap, force: true});
}

/**
 * Wrap Ruler.prototype._removeWaypoint
 * Remove elevation increments.
 * Remove calculated path.
 */
function _removeWaypoint(wrapper, point, { snap = true } = {}) {
  if ( this._pathfindingSegmentMap ) {this._pathfindingSegmentMap.delete(this.waypoints.at(-1));}
  wrapper(point, { snap });
}

/**
 * Wrap Ruler.prototype._getMeasurementOrigin
 * Get the measurement origin.
 * If Token Ruler, shift the measurement origin to the token center, adjusted for non-symmetrical tokens.
 * @param {Point} point                    The waypoint
 * @param {object} [options]               Additional options
 * @param {boolean} [options.snap=true]    Snap the waypoint?
 * @protected
 */
function _getMeasurementOrigin(wrapped, point, {snap=true}={}) {
  point = wrapped(point, { snap });
  const token = this.token;
  if ( !this._isTokenRuler || !token ) {return point;}
  return token.getCenterPoint();
}

/**
 * Wrap Ruler.prototype._getMeasurementDestination
 * Get the destination point. By default the point is snapped to grid space centers.
 * Adjust the destination point to match where the preview token is placed.
 * @param {Point} point                    The point coordinates
 * @param {object} [options]               Additional options
 * @param {boolean} [options.snap=true]    Snap the point?
 * @returns {Point}                        The snapped destination point
 * @protected
 */
function _getMeasurementDestination(wrapped, point, {snap=true}={}) {
  const origPoint = PIXI.Point.fromObject(point);

  point = wrapped(point, { snap });
  const token = this.token;
  if ( !this._isTokenRuler || !token ) {return point;}
  if ( !token._preview ) {return point;}

  // Shift to token center or snapped center
  if ( !snap ) {return point;}

  // See Token#_onDragLeftMove.
  const origin = token.getCenterPoint();
  const delta = origPoint.subtract(origin, PIXI.Point._tmp);
  let position = PIXI.Point._tmp2.copyFrom(token.document).add(delta, PIXI.Point._tmp2);
  const tlSnapped = token._preview.getSnappedPosition(position);
  return token.getCenterPoint(tlSnapped);
}

// ----- NOTE: Segments ----- //

/**
 * Helper to build text label for customized labeling.
 * @param {string} name   What name/style category to give the label
 * @returns {PIXI.Text}
 */
function constructSecondaryLabel(name) {
  const labelStyles = CONFIG[MODULE_ID].labeling.styles;
  const secondaryTextScale = CONFIG[MODULE_ID].labeling.secondaryTextScale;
  const defaultStyle = labelStyles[name] ?? labelStyles.waypoint;
  const newLabel = new PreciseText("", defaultStyle.clone());
  newLabel.name = name;
  newLabel.visible = false;
  newLabel.style.fontSize = Math.round(defaultStyle.fontSize * secondaryTextScale);
  newLabel.anchor = { x: 0.5, y: 0.5 };
  if ( CONFIG[MODULE_ID].SPEED.useFontAwesome
    && !newLabel.style.fontFamily.includes("fontAwesome") ) {newLabel.style.fontFamily += ",fontAwesome";}
  return newLabel;
}

/**
 * Mixed wrap of  Ruler.prototype._getMeasurementSegments
 * Add elevation information to the segments.
 * Add pathfinding segments.
 * Add segments for traversing regions.
 */
function _getMeasurementSegments(wrapped) {
  // Remove the grandchildren of labels for which the segment is no longer valid.
  const nSegments = this.history.length + this.waypoints.length + 1;
  if ( this.labels.children.length > nSegments ) {
    this.labels.children.forEach((l, idx) => {
      if ( idx < nSegments ) {return;}
      l.children.forEach(c => c.destroy());
    });
  }

  // Create labels as needed. Clone style for further modifications.
  // See Foundry _getMeasurementSegments.
  for (let i = this.labels.children.length; i < nSegments; i += 1 ) {
    const newLabel = new PreciseText("", CONFIG.canvasTextStyle.clone());
    if ( CONFIG[MODULE_ID].SPEED.useFontAwesome
      && !newLabel.style.fontFamily.includes("fontAwesome") ) {newLabel.style.fontFamily += ",fontAwesome";}

    // Add in additional containers for customized labels.
    if ( Settings.get(Settings.KEYS.LABELING.CUSTOMIZED) ) {
      for ( const name of Object.keys(CONFIG[MODULE_ID].labeling.styles) ) {
        const secondaryLabel = constructSecondaryLabel(name);
        newLabel.addChild(secondaryLabel);
      }
    }
    this.labels.addChild(newLabel);
  }

  // If not the user's ruler, segments calculated by original user and copied via socket.
  if ( this.user !== game.user ) {
    // Reconstruct labels if necessary.
    let labelIndex = 0;
    this.segments ??= [];
    for ( const s of this.segments ) {
      if ( !s.label ) {continue;} // Not every segment has a label.
      s.label = this.labels.children[labelIndex++];
      if ( !s.label ) {console.error(`${MODULE_ID}|_getMeasurementSegments label not found.`);}
    }
    return this.segments;
  }

  // No segments are present if dragging back to the origin point.
  const segments = wrapped();

  const segmentMap = this._pathfindingSegmentMap ??= new Map();
  if ( !segments.length ) {
    segmentMap.clear();
    return segments;
  }

  // Add z value (elevation in pixel units) to the segments.
  elevateSegments(this, segments);

  // If no movement token, then no region paths or pathfinding.
  const token = this.token;
  if ( !token ) {return segments;}

  const usePathfinding = Settings.get(Settings.KEYS.CONTROLS.PATHFINDING) ^ Settings.FORCE_TOGGLE_PATHFINDING;
  let pathPoints = [];
  const t0 = performance.now();
  const lastSegment = segments.at(-1);
  if ( CONFIG[MODULE_ID].debug ) {console.groupCollapsed(`${MODULE_ID}|_getMeasurementSegments`);}
  if ( usePathfinding ) {
    // If currently pathfinding, set path for the last segment, overriding any prior path.
    // Pathfinding when: the pathfinding icon is enabled or the temporary toggle key is held.
    // TODO: Pathfinding should account for region elevation changes and handle flying/burrowing.
    pathPoints = calculatePathPointsForSegment(lastSegment, token);
  }

  if ( OTHER_MODULES.TERRAIN_MAPPER.ACTIVE ) {
    const t0 = performance.now();
    // For now, determine movement type for each of the path points. PathPoints are {x, y} objects.
    // If no path points, use the segments.
    const initialPath = pathPoints.map(pt => RegionMovementWaypoint3d.fromObject(pt));

    // For now, set the initial path to the elevation of the last segment.
    if ( initialPath.length ) {
      initialPath.forEach(pt => pt.z = lastSegment.ray.A.z);
      initialPath.at(-1).z = lastSegment.ray.B.z;
    } else {initialPath.push(
      RegionMovementWaypoint3d.fromObject(lastSegment.ray.A),
      RegionMovementWaypoint3d.fromObject(lastSegment.ray.B)
    );}

    // Determine the region path.
    pathPoints.length = 0;
    const ElevationHandler = OTHER_MODULES.TERRAIN_MAPPER.API.ElevationHandler;
    let prevPt = initialPath[0];
    pathPoints.push(prevPt);
    for ( let i = 1, n = initialPath.length; i < n; i += 1 ) {
      const nextPt = initialPath[i];
      const movementTypeStart = movementTypeForTokenAt(token, prevPt);
      const endGround = terrainElevationAtLocation(nextPt, nextPt.elevation);
      const movementTypeEnd = MOVEMENT_TYPES.forCurrentElevation(nextPt.elevation, endGround);
      const flying = movementTypeStart === MOVEMENT_TYPES.FLY || movementTypeEnd === MOVEMENT_TYPES.FLY;
      const burrowing = movementTypeStart === MOVEMENT_TYPES.BURROW || movementTypeEnd === MOVEMENT_TYPES.BURROW;
      const subPath = ElevationHandler.constructPath(prevPt, nextPt, { flying, burrowing, token });
      log(`Subpath ${prevPt.x},${prevPt.y},${prevPt.z} -> ${nextPt.x},${nextPt.y},${nextPt.z}. Flying: ${flying}; burrowing: ${burrowing}.`, subPath);
      subPath.shift(); // Remove prevPt from the array.
      pathPoints.push(...subPath);
      prevPt = nextPt;
    }
    const t1 = performance.now();
    log(`Found terrain path with ${pathPoints.length} points in ${t1-t0} ms.`, initialPath, pathPoints);
  }
  const t1 = performance.now();
  const key = `${lastSegment.ray.A.key}|${lastSegment.ray.B.key}`;
  if ( pathPoints.length > 2 ) {
    segmentMap.set(key, pathPoints);
    log(`Found path with ${pathPoints.length} points in ${t1-t0} ms.`, pathPoints);
  } else {segmentMap.delete(key);}

  // For each segment, replace with path sub-segment if pathfinding or region paths were used for that segment.
  const t2 = performance.now();
  const newSegments = constructPathfindingSegments(segments, segmentMap);
  const t3 = performance.now();
  log(`${newSegments.length} segments processed in ${t3-t2} ms.`);
  if ( CONFIG[MODULE_ID].debug ) {console.groupEnd(`${MODULE_ID}|_getMeasurementSegments`);}
  return newSegments;
}

/**
 * Mixed wrap Ruler.prototype._computeDistance
 * Pass 3d coordinates to measure.
 * Determine the distance with and without the cost function so movement due to terrain can be calculated.
 * If token not present or Terrain Mapper not active, this will be the same as segment distance.
 */
function _computeDistance(wrapped) {
  log("_computeDistance");

  // If not this ruler's user, use the segments already calculated and passed via socket.
  if ( this.user !== game.user ) {return;}

  wrapped();

  // Unfortunately, need to redo the measurement.
  // Primarily b/c the cost and labeling needs the offsetDistance from the measurement.
  // Add in the 3d points.
  const Point3d = CONFIG.GeometryLib.threeD.Point3d;
  let path = [];
  if ( this.segments.length ) {path.push(Point3d.fromObject(this.segments[0].ray.A));}
  for ( const segment of this.segments ) {
    const B = Point3d.fromObject(segment.ray.B);
    B.teleport = segment.teleport;
    path.push(B);
  }
  const measurements = canvas.grid.measurePath(path, {cost: this._getCostFunction()}).segments;

  // Redo the properties for the segments.
  this.totalDistance = 0;
  this.totalCost = 0;
  this.totalOffsetDistance = 0;

  // Additional waypoint calcs.
  let waypointDistance = 0;
  let waypointCost = 0;
  let waypointOffsetDistance = 0;
  let currWaypointIdx = -1;

  for ( let i = 0; i < this.segments.length; i++ ) {
    const segment = this.segments[i];
    const distance = measurements[i].distance;
    const cost = segment.history ? this.history.at(i + 1)?.cost ?? 0 : measurements[i].cost;
    const offsetDistance = measurements[i].offsetDistance;
    segment.distance = distance;
    segment.cost = cost;
    segment.offsetDistance = offsetDistance;
    segment.cumulativeDistance = this.totalDistance += distance;
    segment.cumulativeCost = this.totalCost += cost;
    segment.cumulativeOffsetDistance = this.totalOffsetDistance += offsetDistance;

    // Values relating the prior waypoint to this segment.
    segment.waypoint ??= {};
    if ( !Object.hasOwn(segment.waypoint, "idx") ) {console.log("_computeDistance|No waypoint index!");}
    if ( Object.hasOwn(segment.waypoint, "idx") && segment.waypoint.idx !== currWaypointIdx ) {
      currWaypointIdx = segment.waypoint.idx;
      waypointDistance = 0;
      waypointCost = 0;
      waypointOffsetDistance = 0;
    }
    segment.waypoint.distance = waypointDistance += segment.distance;
    segment.waypoint.cost = waypointCost += segment.cost;
    segment.waypoint.offsetDistance = waypointOffsetDistance += segment.offsetDistance;
    if ( ~currWaypointIdx ) {
      segment.waypoint.elevationIncrement = userElevationChangeAtWaypoint(this.waypoints[currWaypointIdx]);
    }
  }
}

/**
 * Wrap Ruler.prototype._getCostFunction()
 * Return the movement penalty calculator.
 */
function _getCostFunction() {
  if ( !this.token ) {return undefined;}

  // Construct a move penalty instance that covers all the segments.
  const movePenaltyInstance = this._movePenaltyInstance ??= new MovePenalty(this.token);
  if ( this.segments.length ) {
    const path = this.segments.map(s => GridCoordinates3d.fromObject(s.ray.A));
    path.push(GridCoordinates3d.fromObject(this.segments.at(-1).ray.B));
    movePenaltyInstance.restrictToPath(path);
  }
  return (prevOffset, currOffset, offsetDistance) => {
    if ( !(prevOffset instanceof GridCoordinates3d) ) {prevOffset = GridCoordinates3d.fromOffset(prevOffset);}
    if ( !(currOffset instanceof GridCoordinates3d) ) {currOffset = GridCoordinates3d.fromOffset(currOffset);}
    return movePenaltyInstance.movementCostForSegment(prevOffset, currOffset, offsetDistance);
  };
}


// ----- NOTE: Segment labeling and highlighting ----- //

/**
 * Wrap Ruler.prototype._getSegmentLabel
 * Add elevation information to the label
 */
function _getSegmentLabel(wrapped, segment) {
  if ( CONFIG[MODULE_ID].debug ) {
    if ( this.totalDistance >= 15 ) { console.debug("_getSegmentLabel: 15", segment, this); }
    if ( this.totalDistance > 30 ) { console.debug("_getSegmentLabel: 30", segment, this); }
    else if ( this.totalDistance > 60 ) { console.debug("_getSegmentLabel: 30", segment, this); }
  }

  // Force distance to be between waypoints instead of (possibly pathfinding) segments.
  // Use cost instead of straight distance for the label.
  const origSegmentDistance = segment.distance;
  const origTotalDistance = this.totalDistance;
  segment.waypoint.cost ??= segment.distance || 0;
  segment.distance = roundMultiple(segment.waypoint.cost);
  this.totalDistance = this.totalCost;

  // Issue #214 and GURPS PR.
  const origLabel = game.system.id === "gurps" ? wrapped(segment, this.totalDistance) : wrapped(segment);
  segment.distance = origSegmentDistance;
  this.totalDistance = origTotalDistance;

  if ( Settings.get(Settings.KEYS.LABELING.SCALE_TEXT) ) {
    segment.label.style.fontSize = Math.round(CONFIG.canvasTextStyle.fontSize
      * (canvas.dimensions.size / 100)
      * CONFIG[MODULE_ID].labeling.textScale);
  }

  if ( !segment.label.style.fontFamily.includes("fontAwesome") ) {segment.label.style.fontFamily += ",fontAwesome";}

  if ( Settings.get(Settings.KEYS.LABELING.CUSTOMIZED) ) {return customizedTextLabel(this, segment, origLabel);}
  return basicTextLabel(this, segment, origLabel);
}

/**
 * Wrap Ruler.prototype._highlightMeasurementSegment
 * @param {RulerMeasurementSegment} segment
 */
const TOKEN_SPEED_SPLITTER = new WeakMap();

function _highlightMeasurementSegment(wrapped, segment) {
  // Temporarily override cached ray.distance such that the ray distance is two-dimensional,
  // so highlighting selects correct squares.
  // Otherwise the highlighting algorithm can get confused for high-elevation segments.
  segment.ray._distance = PIXI.Point.distanceBetween(segment.ray.A, segment.ray.B);

  // Adjust the color if this user has selected speed highlighting.
  // Highlight each split in turn, changing highlight color each time.
  if ( Settings.useSpeedHighlighting(this.token) ) {
    if ( segment === this.segments[0] ) {
      TOKEN_SPEED_SPLITTER.set(this.token, tokenSpeedSegmentSplitter(this, this.token));
    }
    const splitterFn = TOKEN_SPEED_SPLITTER.get(this.token);
    if ( splitterFn ) {
      const priorColor = this.color;
      const segments = splitterFn(segment);
      if ( segments.length ) {
        for ( const segment of segments ) {
          this.color = segment.speed.color;
          segment.ray._distance = PIXI.Point.distanceBetween(segment.ray.A, segment.ray.B);
          wrapped(segment);

          // If gridless, highlight a rectangular shaped portion of the line.
          if ( canvas.grid.isGridless ) {highlightLineRectangle(segment, this.color, this.name);}
        }
        // Reset to the default color.
        this.color = priorColor;
        return;
      }
    }
  }

  wrapped(segment);
  segment.ray._distance = undefined; // Reset the distance measurement.
}


// ----- NOTE: Token movement ----- //

/**
 * Wrap Ruler.prototype._animateMovement
 * Add additional controlled tokens to the move, if permitted.
 */
async function _animateMovement(wrapped, token) {
  if ( !this.segments || !this.segments.length ) {return wrapped(token);} // Ruler._animateMovement expects at least one segment.

  if ( CONFIG[MODULE_ID].debug ) {
    console.groupCollapsed(`${MODULE_ID}|_animateMovement`);
    log(`Moving ${token.name} ${this.segments.length} segments.`, [...this.segments]);
    console.table(this.segments.flatMap(s => {
      const A = { ...s.ray.A };
      const B = { ...s.ray.B };
      B.distance = s.distance;
      B.offsetDistance = s.offsetDistance;
      B.cost = s.cost;
      B.numDiagonal = s.numDiagonal;
      return [A, B];
    }));
    console.groupEnd(`${MODULE_ID}|_animateMovement`);
  }

  this.segments.forEach((s, idx) => s.idx = idx);

  // _recalculateOffset.call(this, token);
  const promises = [wrapped(token)];
  for ( const controlledToken of canvas.tokens.controlled ) {
    if ( controlledToken === token ) {continue;}
    if ( !(this.user.isGM || testMovement.call(this, controlledToken)) ) {
      ui.notifications.error(`${game.i18n.localize("RULER.MovementNotAllowed")} for ${controlledToken.name}`);
      continue;
    }
    promises.push(wrapped(controlledToken));
  }
  if ( game.combat?.active && Settings.get(Settings.KEYS.MEASURING.COMBAT_HISTORY) ) {
    token[MODULE_ID] ??= {};
    token[MODULE_ID].measurementHistory = this._createMeasurementHistory();
  }

  return Promise.allSettled(promises);
}

/**
 * Helper to catch movement errors. Must use "call" or "bind" to bind it to the Ruler instance.
 */
function testMovement(token) {
  let error;
  try {
    if ( !this._canMove(token) ) {error = "RULER.MovementNotAllowed";}
  } catch(err) {
    error = err.message;
  }
  if ( error ) {
    ui.notifications.error(error, {localize: true});
    return false;
  }
  return true;
}

/**
 * Wrap Ruler.prototype._getMeasurementHistory
 * Store the history temporarily in the token.
 * @returns {RulerMeasurementHistory|void}
 */
function _getMeasurementHistory(wrapped) {
  const history = wrapped();
  const token = this.token;
  if ( !(token && game.combat?.active) ) {return history;}
  if ( !Settings.get(Settings.KEYS.MEASURING.COMBAT_HISTORY) ) {return history;}

  token[MODULE_ID] ??= {};
  const tokenHistory = token[MODULE_ID].measurementHistory;
  if ( !tokenHistory || !tokenHistory.length ) {return history;}
  const combatData = token._combatMoveData;
  if ( combatData.lastRound < game.combat.round ) {
    token[MODULE_ID].measurementHistory = [];
    return history;
  }
  return token[MODULE_ID].measurementHistory;
}

/**
 * Wrap Ruler.prototype._createMeasurementHistory
 * Store the 3d values for the history
 * @returns {RulerMeasurementHistory}    The next measurement history
 */
function _createMeasurementHistory(wrapped) {
  const history = wrapped();
  if ( !history.length ) {return history;}
  history[0].z = this.segments[0].ray.A.z;
  for ( let i = 0, h = 1, n = this.segments.length; i < n; i += 1 ) {
    const s = this.segments[i];
    if ( s.ray.distance === 0 ) {continue;}
    history[h].z = s.ray.B.z;
    h += 1;
  }
  return history;
}

/**
 * Wrap Ruler.prototype._canMove
 * Allow GM full reign to move tokens.
 */
function _canMove(wrapper, token) {
  if ( this.user.isGM ) {return true;}
  if ( token.document?.allowPlayerMove && token.document.allowPlayerMove() ) {return true;} // Move-that-for-you module. See issue #241.
  const baseCanMove = wrapper(token);
  if ( !baseCanMove) {return false;}

  // Adjust each segment for the difference from the original token position.
  // Important when dragging multiple tokens.
  // See Ruler#_animateMovement
  const origin = this.segments[this.history.length].ray.A;
  const dx = token.document.x - origin.x;
  const dy = token.document.y - origin.y;
  let {x, y} = token.document._source;
  for ( const segment of this.segments ) {
    if ( segment.history || (segment.ray.distance === 0) ) {continue;}
    const r = segment.ray;
    const adjustedDestination = {x: Math.round(r.B.x + dx), y: Math.round(r.B.y + dy)};
    const a = token.getCenterPoint({x, y});
    const b = token.getCenterPoint(adjustedDestination);
    if ( token.checkCollision(b, {origin: a, type: "move", mode: "any"}) ) {
      throw new Error("RULER.MovementCollision");
      return false;
    }
    x = adjustedDestination.x;
    y = adjustedDestination.y;
  }

  return baseCanMove;
}

/**
 * Wrap Ruler.prototype._animateSegment
 * When moving the token along the segments, update the token elevation to the destination + increment
 * for the given segment.
 * Mark the token update if pathfinding for this segment.
 */
async function _animateSegment(wrapped, token, segment, destination, updateOptions = {}) {
  log(`Updating ${token.name} destination from ({${token.document.x},${token.document.y}) to (${destination.x},${destination.y}) for segment (${segment.ray.A.x},${segment.ray.A.y})|(${segment.ray.B.x},${segment.ray.B.y})`);
  destination.elevation = roundMultiple(CONFIG.GeometryLib.utils.pixelsToGridUnits(segment.ray.B.z));

  // If moving multiple tokens, take into account the current token's elevation differential.
  const origE = this.waypoints[0].elevation || 0;
  let diffE = 0;
  if ( this.token !== token ) {diffE = token.elevationE - origE;}
  destination.elevation += diffE;

  foundry.utils.mergeObject(updateOptions, {
    rulerSegment: this.segments.length > 1,
    firstRulerSegment: segment.first,
    lastRulerSegment: segment.last
  });

  const res = await wrapped(token, segment, destination, updateOptions);

  // Revert to the original destination.
  destination.elevation -= diffE;
  return res;
}


// ----- NOTE: Event handling ----- //

/**
 * Wrap Ruler.prototype.clear
 * Delete the move penalty instance
 */
function clear(wrapper) {
  log("-----Clearing movePenaltyInstance-----");
  delete this._movePenaltyInstance;

  // Remove the grandchildren, if any. Created by ruler label styles.
  this.labels.children.forEach(l => l.children.forEach(c => c.destroy()));
  return wrapper();
}

/**
 * Wrap Ruler.prototype._onDragStart
 * Record whether shift is held.
 * Reset FORCE_TO_GROUND
 * @param {PIXI.FederatedEvent} event   The drag start event
 * @see {Canvas._onDragLeftStart}
 */
function _onDragStart(wrapped, event, { isTokenDrag = false } = {}) {
  Settings.FORCE_TO_GROUND = false;
  this._userElevationIncrements = 0;
  this._isTokenRuler = isTokenDrag;
  return wrapped(event);
}

/**
 * Wrap Ruler.prototype._onMoveKeyDown
 * If the teleport key is held, teleport the token.
 * @param {KeyboardEventContext} context
 */
function _onMoveKeyDown(wrapped, context) {
  const teleportKeys = new Set(game.keybindings.get(MODULE_ID, Settings.KEYBINDINGS.TELEPORT).map(binding =>
    binding.key));
  if ( teleportKeys.intersects(game.keyboard.downKeys) ) {this.segments.forEach(s => s.teleport = true);}
  wrapped(context);
}


// ----- NOTE: New methods ----- //

/**
 * Add Ruler.prototype.incrementElevation
 * Increase the elevation at the current ruler waypoint by one grid unit.
 */
function incrementElevation() {
  const ruler = this;
  if ( !ruler || !ruler.active ) {return;}

  // Increment the elevation at the last waypoint.
  log("incrementElevation");
  const waypoint = this.waypoints.at(-1);
  waypoint._userElevationIncrements ??= 0;
  waypoint._userElevationIncrements += 1;

  // Update the ruler display (will also broadcast the measurement)
  ruler.measure(this.destination, { force: true });
}

/**
 * Add Ruler.prototype.decrementElevation
 * Decrease the elevation at the current ruler waypoint by one grid unit.
 */
function decrementElevation() {
  const ruler = this;
  if ( !ruler || !ruler.active ) {return;}

  // Decrement the elevation at the last waypoint.
  log("decrementElevation");
  const waypoint = this.waypoints.at(-1);
  waypoint._userElevationIncrements ??= 0;
  waypoint._userElevationIncrements -= 1;

  // Update the ruler display.
  ruler.measure(this.destination, { force: true});

  // Broadcast the activity (see ControlsLayer.prototype._onMouseMove)
  this._broadcastMeasurement();
}

/**
 * Add Ruler.prototype.moveWithoutAnimation
 * Move the token and stop the ruler measurement
 * @returns {boolean} False if the movement did not occur
 */
async function teleport(_context) {
  if ( this._state !== this.constructor.STATES.MEASURING ) {return false;}
  if ( !this._canMove(this.token) ) {return false;}

  // Change all segments to teleport.
  this.segments.forEach(s => s.teleport = true);
  return this.moveToken();
}

PATCHES.BASIC.WRAPS = {
  clear,
  _getMeasurementData,
  update,
  _removeWaypoint,
  _getMeasurementOrigin,
  _getMeasurementDestination,
  _getMeasurementHistory,
  _createMeasurementHistory,

  // Movement
  _animateMovement,
  _animateSegment,

  // Wraps related to segments
  _getCostFunction,
  _getSegmentLabel,

  // Events
  _onDragStart,
  _canMove,
  _onMoveKeyDown
};

PATCHES.BASIC.MIXES = { _getMeasurementSegments, _broadcastMeasurement, _computeDistance };

PATCHES.BASIC.OVERRIDES = { _addWaypoint };

PATCHES.SPEED_HIGHLIGHTING.WRAPS = { _highlightMeasurementSegment };

PATCHES.BASIC.METHODS = {
  incrementElevation,
  decrementElevation,
  teleport
};

PATCHES.BASIC.GETTERS = {
  originElevation,
  destinationElevation
};

PATCHES.BASIC.STATIC_METHODS = {
  userElevationChangeAtWaypoint,
  terrainElevationAtLocation,
  terrainElevationForMovement,
  terrainPathForMovement,
  elevationFromWaypoint
};
