(function() {function r(e, n, t) {function o(i, f) {if (!n[i]) {if (!e[i]) {let c="function"==typeof require&&require; if (!f&&c) {return c(i, !0);} if (u) {return u(i, !0);} let a=new Error(`Cannot find module '${i}'`); throw a.code="MODULE_NOT_FOUND", a;} let p=n[i]={exports: {}}; e[i][0].call(p.exports, function(r) {let n=e[i][1][r]; return o(n||r);}, p, p.exports, r, e, n, t);} return n[i].exports;} for (var u="function"==typeof require&&require, i=0; i<t.length; i++) {o(t[i]);} return o;} return r;})()({1: [function(require, module, exports) {
  (function(global) {(function() {
    const cdt2d = require("cdt2d");
    global.window.cdt2d = cdt2d;

  }).call(this);}).call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {});
}, {cdt2d: 3}], 2: [function(require, module, exports) {
  "use strict";

  // (a, y, c, l, h) = (array, y[, cmp, lo, hi])

  function ge(a, y, c, l, h) {
    let i = h + 1;
    while (l <= h) {
      let m = (l + h) >>> 1; let x = a[m];
      let p = (c !== undefined) ? c(x, y) : (x - y);
      if (p >= 0) { i = m; h = m - 1; } else { l = m + 1; }
    }
    return i;
  }

  function gt(a, y, c, l, h) {
    let i = h + 1;
    while (l <= h) {
      let m = (l + h) >>> 1; let x = a[m];
      let p = (c !== undefined) ? c(x, y) : (x - y);
      if (p > 0) { i = m; h = m - 1; } else { l = m + 1; }
    }
    return i;
  }

  function lt(a, y, c, l, h) {
    let i = l - 1;
    while (l <= h) {
      let m = (l + h) >>> 1; let x = a[m];
      let p = (c !== undefined) ? c(x, y) : (x - y);
      if (p < 0) { i = m; l = m + 1; } else { h = m - 1; }
    }
    return i;
  }

  function le(a, y, c, l, h) {
    let i = l - 1;
    while (l <= h) {
      let m = (l + h) >>> 1; let x = a[m];
      let p = (c !== undefined) ? c(x, y) : (x - y);
      if (p <= 0) { i = m; l = m + 1; } else { h = m - 1; }
    }
    return i;
  }

  function eq(a, y, c, l, h) {
    while (l <= h) {
      let m = (l + h) >>> 1; let x = a[m];
      let p = (c !== undefined) ? c(x, y) : (x - y);
      if (p === 0) { return m; }
      if (p <= 0) { l = m + 1; } else { h = m - 1; }
    }
    return -1;
  }

  function norm(a, y, c, l, h, f) {
    if (typeof c === "function") {
      return f(a, y, c, (l === undefined) ? 0 : l | 0, (h === undefined) ? a.length - 1 : h | 0);
    }
    return f(a, y, undefined, (c === undefined) ? 0 : c | 0, (l === undefined) ? a.length - 1 : l | 0);
  }

  module.exports = {
    ge: function(a, y, c, l, h) { return norm(a, y, c, l, h, ge);},
    gt: function(a, y, c, l, h) { return norm(a, y, c, l, h, gt);},
    lt: function(a, y, c, l, h) { return norm(a, y, c, l, h, lt);},
    le: function(a, y, c, l, h) { return norm(a, y, c, l, h, le);},
    eq: function(a, y, c, l, h) { return norm(a, y, c, l, h, eq);}
  };

}, {}], 3: [function(require, module, exports) {
  "use strict";

  let monotoneTriangulate = require("./lib/monotone");
  let makeIndex = require("./lib/triangulation");
  let delaunayFlip = require("./lib/delaunay");
  let filterTriangulation = require("./lib/filter");

  module.exports = cdt2d;

  function canonicalizeEdge(e) {
    return [Math.min(e[0], e[1]), Math.max(e[0], e[1])];
  }

  function compareEdge(a, b) {
    return a[0]-b[0] || a[1]-b[1];
  }

  function canonicalizeEdges(edges) {
    return edges.map(canonicalizeEdge).sort(compareEdge);
  }

  function getDefault(options, property, dflt) {
    if (property in options) {
      return options[property];
    }
    return dflt;
  }

  function cdt2d(points, edges, options) {

    if (!Array.isArray(edges)) {
      options = edges || {};
      edges = [];
    } else {
      options = options || {};
      edges = edges || [];
    }

    // Parse out options
    let delaunay = !!getDefault(options, "delaunay", true);
    let interior = !!getDefault(options, "interior", true);
    let exterior = !!getDefault(options, "exterior", true);
    let infinity = !!getDefault(options, "infinity", false);

    // Handle trivial case
    if ((!interior && !exterior) || points.length === 0) {
      return [];
    }

    // Construct initial triangulation
    let cells = monotoneTriangulate(points, edges);

    // If delaunay refinement needed, then improve quality by edge flipping
    if (delaunay || interior !== exterior || infinity) {

      // Index all of the cells to support fast neighborhood queries
      let triangulation = makeIndex(points.length, canonicalizeEdges(edges));
      for (let i=0; i<cells.length; ++i) {
        let f = cells[i];
        triangulation.addTriangle(f[0], f[1], f[2]);
      }

      // Run edge flipping
      if (delaunay) {
        delaunayFlip(points, triangulation);
      }

      // Filter points
      if (!exterior) {
        return filterTriangulation(triangulation, -1);
      } else if (!interior) {
        return filterTriangulation(triangulation, 1, infinity);
      } else if (infinity) {
        return filterTriangulation(triangulation, 0, infinity);
      } else {
        return triangulation.cells();
      }

    } else {
      return cells;
    }
  }

}, {"./lib/delaunay": 4, "./lib/filter": 5, "./lib/monotone": 6, "./lib/triangulation": 7}], 4: [function(require, module, exports) {
  "use strict";

  let inCircle = require("robust-in-sphere")[4];
  let bsearch = require("binary-search-bounds");

  module.exports = delaunayRefine;

  function testFlip(points, triangulation, stack, a, b, x) {
    let y = triangulation.opposite(a, b);

    // Test boundary edge
    if (y < 0) {
      return;
    }

    // Swap edge if order flipped
    if (b < a) {
      let tmp = a;
      a = b;
      b = tmp;
      tmp = x;
      x = y;
      y = tmp;
    }

    // Test if edge is constrained
    if (triangulation.isConstraint(a, b)) {
      return;
    }

    // Test if edge is delaunay
    if (inCircle(points[a], points[b], points[x], points[y]) < 0) {
      stack.push(a, b);
    }
  }

  // Assume edges are sorted lexicographically
  function delaunayRefine(points, triangulation) {
    let stack = [];

    let numPoints = points.length;
    let stars = triangulation.stars;
    for (var a=0; a<numPoints; ++a) {
      var star = stars[a];
      for (let j=1; j<star.length; j+=2) {
        var b = star[j];

        // If order is not consistent, then skip edge
        if (b < a) {
          continue;
        }

        // Check if edge is constrained
        if (triangulation.isConstraint(a, b)) {
          continue;
        }

        // Find opposite edge
        var x = star[j-1]; var y = -1;
        for (let k=1; k<star.length; k+=2) {
          if (star[k-1] === b) {
            y = star[k];
            break;
          }
        }

        // If this is a boundary edge, don't flip it
        if (y < 0) {
          continue;
        }

        // If edge is in circle, flip it
        if (inCircle(points[a], points[b], points[x], points[y]) < 0) {
          stack.push(a, b);
        }
      }
    }

    while (stack.length > 0) {
      var b = stack.pop();
      var a = stack.pop();

      // Find opposite pairs
      var x = -1; var y = -1;
      var star = stars[a];
      for (let i=1; i<star.length; i+=2) {
        let s = star[i-1];
        let t = star[i];
        if (s === b) {
          y = t;
        } else if (t === b) {
          x = s;
        }
      }

      // If x/y are both valid then skip edge
      if (x < 0 || y < 0) {
        continue;
      }

      // If edge is now delaunay, then don't flip it
      if (inCircle(points[a], points[b], points[x], points[y]) >= 0) {
        continue;
      }

      // Flip the edge
      triangulation.flip(a, b);

      // Test flipping neighboring edges
      testFlip(points, triangulation, stack, x, a, y);
      testFlip(points, triangulation, stack, a, y, x);
      testFlip(points, triangulation, stack, y, b, x);
      testFlip(points, triangulation, stack, b, x, y);
    }
  }

}, {"binary-search-bounds": 2, "robust-in-sphere": 8}], 5: [function(require, module, exports) {
  "use strict";

  let bsearch = require("binary-search-bounds");

  module.exports = classifyFaces;

  function FaceIndex(cells, neighbor, constraint, flags, active, next, boundary) {
    this.cells = cells;
    this.neighbor = neighbor;
    this.flags = flags;
    this.constraint = constraint;
    this.active = active;
    this.next = next;
    this.boundary = boundary;
  }

  let proto = FaceIndex.prototype;

  function compareCell(a, b) {
    return a[0] - b[0]
         || a[1] - b[1]
         || a[2] - b[2];
  }

  proto.locate = (function() {
    let key = [0, 0, 0];
    return function(a, b, c) {
      let x = a; let y = b; let z = c;
      if (b < c) {
        if (b < a) {
          x = b;
          y = c;
          z = a;
        }
      } else if (c < a) {
        x = c;
        y = a;
        z = b;
      }
      if (x < 0) {
        return -1;
      }
      key[0] = x;
      key[1] = y;
      key[2] = z;
      return bsearch.eq(this.cells, key, compareCell);
    };
  })();

  function indexCells(triangulation, infinity) {
  // First get cells and canonicalize
    let cells = triangulation.cells();
    let nc = cells.length;
    for (var i=0; i<nc; ++i) {
      var c = cells[i];
      var x = c[0]; var y = c[1]; let z = c[2];
      if (y < z) {
        if (y < x) {
          c[0] = y;
          c[1] = z;
          c[2] = x;
        }
      } else if (z < x) {
        c[0] = z;
        c[1] = x;
        c[2] = y;
      }
    }
    cells.sort(compareCell);

    // Initialize flag array
    let flags = new Array(nc);
    for (var i=0; i<flags.length; ++i) {
      flags[i] = 0;
    }

    // Build neighbor index, initialize queues
    let active = [];
    let next = [];
    let neighbor = new Array(3*nc);
    let constraint = new Array(3*nc);
    let boundary = null;
    if (infinity) {
      boundary = [];
    }
    let index = new FaceIndex(
      cells,
      neighbor,
      constraint,
      flags,
      active,
      next,
      boundary);
    for (var i=0; i<nc; ++i) {
      var c = cells[i];
      for (let j=0; j<3; ++j) {
        var x = c[j]; var y = c[(j+1)%3];
        let a = neighbor[3*i+j] = index.locate(y, x, triangulation.opposite(y, x));
        let b = constraint[3*i+j] = triangulation.isConstraint(x, y);
        if (a < 0) {
          if (b) {
            next.push(i);
          } else {
            active.push(i);
            flags[i] = 1;
          }
          if (infinity) {
            boundary.push([y, x, -1]);
          }
        }
      }
    }
    return index;
  }

  function filterCells(cells, flags, target) {
    let ptr = 0;
    for (let i=0; i<cells.length; ++i) {
      if (flags[i] === target) {
        cells[ptr++] = cells[i];
      }
    }
    cells.length = ptr;
    return cells;
  }

  function classifyFaces(triangulation, target, infinity) {
    let index = indexCells(triangulation, infinity);

    if (target === 0) {
      if (infinity) {
        return index.cells.concat(index.boundary);
      } else {
        return index.cells;
      }
    }

    let side = 1;
    let active = index.active;
    let next = index.next;
    let flags = index.flags;
    let cells = index.cells;
    let constraint = index.constraint;
    let neighbor = index.neighbor;

    while (active.length > 0 || next.length > 0) {
      while (active.length > 0) {
        let t = active.pop();
        if (flags[t] === -side) {
          continue;
        }
        flags[t] = side;
        let c = cells[t];
        for (let j=0; j<3; ++j) {
          let f = neighbor[3*t+j];
          if (f >= 0 && flags[f] === 0) {
            if (constraint[3*t+j]) {
              next.push(f);
            } else {
              active.push(f);
              flags[f] = side;
            }
          }
        }
      }

      // Swap arrays and loop
      let tmp = next;
      next = active;
      active = tmp;
      next.length = 0;
      side = -side;
    }

    let result = filterCells(cells, flags, target);
    if (infinity) {
      return result.concat(index.boundary);
    }
    return result;
  }

}, {"binary-search-bounds": 2}], 6: [function(require, module, exports) {
  "use strict";

  let bsearch = require("binary-search-bounds");
  let orient = require("robust-orientation")[3];

  let EVENT_POINT = 0;
  let EVENT_END = 1;
  let EVENT_START = 2;

  module.exports = monotoneTriangulate;

  // A partial convex hull fragment, made of two unimonotone polygons
  function PartialHull(a, b, idx, lowerIds, upperIds) {
    this.a = a;
    this.b = b;
    this.idx = idx;
    this.lowerIds = lowerIds;
    this.upperIds = upperIds;
  }

  // An event in the sweep line procedure
  function Event(a, b, type, idx) {
    this.a = a;
    this.b = b;
    this.type = type;
    this.idx = idx;
  }

  // This is used to compare events for the sweep line procedure
  // Points are:
  //  1. sorted lexicographically
  //  2. sorted by type  (point < end < start)
  //  3. segments sorted by winding order
  //  4. sorted by index
  function compareEvent(a, b) {
    let d =
    (a.a[0] - b.a[0])
    || (a.a[1] - b.a[1])
    || (a.type - b.type);
    if (d) { return d; }
    if (a.type !== EVENT_POINT) {
      d = orient(a.a, a.b, b.b);
      if (d) { return d; }
    }
    return a.idx - b.idx;
  }

  function testPoint(hull, p) {
    return orient(hull.a, hull.b, p);
  }

  function addPoint(cells, hulls, points, p, idx) {
    let lo = bsearch.lt(hulls, p, testPoint);
    let hi = bsearch.gt(hulls, p, testPoint);
    for (let i=lo; i<hi; ++i) {
      let hull = hulls[i];

      // Insert p into lower hull
      let lowerIds = hull.lowerIds;
      var m = lowerIds.length;
      while (m > 1 && orient(
        points[lowerIds[m-2]],
        points[lowerIds[m-1]],
        p) > 0) {
        cells.push(
          [lowerIds[m-1],
            lowerIds[m-2],
            idx]);
        m -= 1;
      }
      lowerIds.length = m;
      lowerIds.push(idx);

      // Insert p into upper hull
      let upperIds = hull.upperIds;
      var m = upperIds.length;
      while (m > 1 && orient(
        points[upperIds[m-2]],
        points[upperIds[m-1]],
        p) < 0) {
        cells.push(
          [upperIds[m-2],
            upperIds[m-1],
            idx]);
        m -= 1;
      }
      upperIds.length = m;
      upperIds.push(idx);
    }
  }

  function findSplit(hull, edge) {
    let d;
    if (hull.a[0] < edge.a[0]) {
      d = orient(hull.a, hull.b, edge.a);
    } else {
      d = orient(edge.b, edge.a, hull.a);
    }
    if (d) { return d; }
    if (edge.b[0] < hull.b[0]) {
      d = orient(hull.a, hull.b, edge.b);
    } else {
      d = orient(edge.b, edge.a, hull.b);
    }
    return d || hull.idx - edge.idx;
  }

  function splitHulls(hulls, points, event) {
    let splitIdx = bsearch.le(hulls, event, findSplit);
    let hull = hulls[splitIdx];
    let upperIds = hull.upperIds;
    let x = upperIds[upperIds.length-1];
    hull.upperIds = [x];
    hulls.splice(splitIdx+1, 0,
      new PartialHull(event.a, event.b, event.idx, [x], upperIds));
  }


  function mergeHulls(hulls, points, event) {
  // Swap pointers for merge search
    let tmp = event.a;
    event.a = event.b;
    event.b = tmp;
    let mergeIdx = bsearch.eq(hulls, event, findSplit);
    let upper = hulls[mergeIdx];
    let lower = hulls[mergeIdx-1];
    lower.upperIds = upper.upperIds;
    hulls.splice(mergeIdx, 1);
  }


  function monotoneTriangulate(points, edges) {

    let numPoints = points.length;
    let numEdges = edges.length;

    let events = [];

    // Create point events
    for (var i=0; i<numPoints; ++i) {
      events.push(new Event(
        points[i],
        null,
        EVENT_POINT,
        i));
    }

    // Create edge events
    for (var i=0; i<numEdges; ++i) {
      let e = edges[i];
      let a = points[e[0]];
      let b = points[e[1]];
      if (a[0] < b[0]) {
        events.push(
          new Event(a, b, EVENT_START, i),
          new Event(b, a, EVENT_END, i));
      } else if (a[0] > b[0]) {
        events.push(
          new Event(b, a, EVENT_START, i),
          new Event(a, b, EVENT_END, i));
      }
    }

    // Sort events
    events.sort(compareEvent);

    // Initialize hull
    let minX = events[0].a[0] - (1 + Math.abs(events[0].a[0])) * Math.pow(2, -52);
    let hull = [new PartialHull([minX, 1], [minX, 0], -1, [], [], [], [])];

    // Process events in order
    let cells = [];
    for (var i=0, numEvents=events.length; i<numEvents; ++i) {
      let event = events[i];
      let type = event.type;
      if (type === EVENT_POINT) {
        addPoint(cells, hull, points, event.a, event.idx);
      } else if (type === EVENT_START) {
        splitHulls(hull, points, event);
      } else {
        mergeHulls(hull, points, event);
      }
    }

    // Return triangulation
    return cells;
  }

}, {"binary-search-bounds": 2, "robust-orientation": 9}], 7: [function(require, module, exports) {
  "use strict";

  let bsearch = require("binary-search-bounds");

  module.exports = createTriangulation;

  function Triangulation(stars, edges) {
    this.stars = stars;
    this.edges = edges;
  }

  let proto = Triangulation.prototype;

  function removePair(list, j, k) {
    for (let i=1, n=list.length; i<n; i+=2) {
      if (list[i-1] === j && list[i] === k) {
        list[i-1] = list[n-2];
        list[i] = list[n-1];
        list.length = n - 2;
        return;
      }
    }
  }

  proto.isConstraint = (function() {
    let e = [0, 0];
    function compareLex(a, b) {
      return a[0] - b[0] || a[1] - b[1];
    }
    return function(i, j) {
      e[0] = Math.min(i, j);
      e[1] = Math.max(i, j);
      return bsearch.eq(this.edges, e, compareLex) >= 0;
    };
  })();

  proto.removeTriangle = function(i, j, k) {
    let stars = this.stars;
    removePair(stars[i], j, k);
    removePair(stars[j], k, i);
    removePair(stars[k], i, j);
  };

  proto.addTriangle = function(i, j, k) {
    let stars = this.stars;
    stars[i].push(j, k);
    stars[j].push(k, i);
    stars[k].push(i, j);
  };

  proto.opposite = function(j, i) {
    let list = this.stars[i];
    for (let k=1, n=list.length; k<n; k+=2) {
      if (list[k] === j) {
        return list[k-1];
      }
    }
    return -1;
  };

  proto.flip = function(i, j) {
    let a = this.opposite(i, j);
    let b = this.opposite(j, i);
    this.removeTriangle(i, j, a);
    this.removeTriangle(j, i, b);
    this.addTriangle(i, b, a);
    this.addTriangle(j, a, b);
  };

  proto.edges = function() {
    let stars = this.stars;
    let result = [];
    for (let i=0, n=stars.length; i<n; ++i) {
      let list = stars[i];
      for (let j=0, m=list.length; j<m; j+=2) {
        result.push([list[j], list[j+1]]);
      }
    }
    return result;
  };

  proto.cells = function() {
    let stars = this.stars;
    let result = [];
    for (let i=0, n=stars.length; i<n; ++i) {
      let list = stars[i];
      for (let j=0, m=list.length; j<m; j+=2) {
        let s = list[j];
        let t = list[j+1];
        if (i < Math.min(s, t)) {
          result.push([i, s, t]);
        }
      }
    }
    return result;
  };

  function createTriangulation(numVerts, edges) {
    let stars = new Array(numVerts);
    for (let i=0; i<numVerts; ++i) {
      stars[i] = [];
    }
    return new Triangulation(stars, edges);
  }

}, {"binary-search-bounds": 2}], 8: [function(require, module, exports) {
  "use strict";

  let twoProduct = require("two-product");
  let robustSum = require("robust-sum");
  let robustDiff = require("robust-subtract");
  let robustScale = require("robust-scale");

  let NUM_EXPAND = 6;

  function orientation(n) {
    let fn =
    n === 3 ? inSphere3
      : n === 4 ? inSphere4
        : n === 5 ? inSphere5 : inSphere6;

    return fn(robustSum, robustDiff, twoProduct, robustScale);
  }

  function inSphere0() { return 0; }
  function inSphere1() { return 0; }
  function inSphere2() { return 0; }

  function inSphere3(sum, diff, prod, scale) {
    function exactInSphere3(m0, m1, m2) {
      let w0 = prod(m0[0], m0[0]);
      let w0m1 = scale(w0, m1[0]);
      let w0m2 = scale(w0, m2[0]);
      let w1 = prod(m1[0], m1[0]);
      let w1m0 = scale(w1, m0[0]);
      let w1m2 = scale(w1, m2[0]);
      let w2 = prod(m2[0], m2[0]);
      let w2m0 = scale(w2, m0[0]);
      let w2m1 = scale(w2, m1[0]);
      let p = sum(diff(w2m1, w1m2), diff(w1m0, w0m1));
      let n = diff(w2m0, w0m2);
      let d = diff(p, n);
      return d[d.length - 1];
    }
    return exactInSphere3;
  }

  function inSphere4(sum, diff, prod, scale) {
    function exactInSphere4(m0, m1, m2, m3) {
      let w0 = sum(prod(m0[0], m0[0]), prod(m0[1], m0[1]));
      let w0m1 = scale(w0, m1[0]);
      let w0m2 = scale(w0, m2[0]);
      let w0m3 = scale(w0, m3[0]);
      let w1 = sum(prod(m1[0], m1[0]), prod(m1[1], m1[1]));
      let w1m0 = scale(w1, m0[0]);
      let w1m2 = scale(w1, m2[0]);
      let w1m3 = scale(w1, m3[0]);
      let w2 = sum(prod(m2[0], m2[0]), prod(m2[1], m2[1]));
      let w2m0 = scale(w2, m0[0]);
      let w2m1 = scale(w2, m1[0]);
      let w2m3 = scale(w2, m3[0]);
      let w3 = sum(prod(m3[0], m3[0]), prod(m3[1], m3[1]));
      let w3m0 = scale(w3, m0[0]);
      let w3m1 = scale(w3, m1[0]);
      let w3m2 = scale(w3, m2[0]);
      let p = sum(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))));
      let n = sum(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))));
      let d = diff(p, n);
      return d[d.length - 1];
    }
    return exactInSphere4;
  }


  function inSphere5(sum, diff, prod, scale) {
    function exactInSphere5(m0, m1, m2, m3, m4) {
      let w0 = sum(prod(m0[0], m0[0]), sum(prod(m0[1], m0[1]), prod(m0[2], m0[2])));
      let w0m1 = scale(w0, m1[0]);
      let w0m2 = scale(w0, m2[0]);
      let w0m3 = scale(w0, m3[0]);
      let w0m4 = scale(w0, m4[0]);
      let w1 = sum(prod(m1[0], m1[0]), sum(prod(m1[1], m1[1]), prod(m1[2], m1[2])));
      let w1m0 = scale(w1, m0[0]);
      let w1m2 = scale(w1, m2[0]);
      let w1m3 = scale(w1, m3[0]);
      let w1m4 = scale(w1, m4[0]);
      let w2 = sum(prod(m2[0], m2[0]), sum(prod(m2[1], m2[1]), prod(m2[2], m2[2])));
      let w2m0 = scale(w2, m0[0]);
      let w2m1 = scale(w2, m1[0]);
      let w2m3 = scale(w2, m3[0]);
      let w2m4 = scale(w2, m4[0]);
      let w3 = sum(prod(m3[0], m3[0]), sum(prod(m3[1], m3[1]), prod(m3[2], m3[2])));
      let w3m0 = scale(w3, m0[0]);
      let w3m1 = scale(w3, m1[0]);
      let w3m2 = scale(w3, m2[0]);
      let w3m4 = scale(w3, m4[0]);
      let w4 = sum(prod(m4[0], m4[0]), sum(prod(m4[1], m4[1]), prod(m4[2], m4[2])));
      let w4m0 = scale(w4, m0[0]);
      let w4m1 = scale(w4, m1[0]);
      let w4m2 = scale(w4, m2[0]);
      let w4m3 = scale(w4, m3[0]);
      let p = sum(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), m1[2]), sum(scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), -m2[2]), scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), m3[2]))), sum(scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), -m4[2]), sum(scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), m0[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m1[2])))), sum(sum(scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), m3[2]), sum(scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), -m4[2]), scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), m0[2]))), sum(scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m1[2]), sum(scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m3[2])))));
      let n = sum(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), m0[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m2[2])), sum(scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m4[2]))), sum(sum(scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), m0[2]), scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), -m1[2])), sum(scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m4[2]))));
      let d = diff(p, n);
      return d[d.length - 1];
    }

    return exactInSphere5;
  }

  function inSphere6(sum, diff, prod, scale) {
    function exactInSphere6(m0, m1, m2, m3, m4, m5) {
      let w0 = sum(sum(prod(m0[0], m0[0]), prod(m0[1], m0[1])), sum(prod(m0[2], m0[2]), prod(m0[3], m0[3])));
      let w0m1 = scale(w0, m1[0]);
      let w0m2 = scale(w0, m2[0]);
      let w0m3 = scale(w0, m3[0]);
      let w0m4 = scale(w0, m4[0]);
      let w0m5 = scale(w0, m5[0]);
      let w1 = sum(sum(prod(m1[0], m1[0]), prod(m1[1], m1[1])), sum(prod(m1[2], m1[2]), prod(m1[3], m1[3])));
      let w1m0 = scale(w1, m0[0]);
      let w1m2 = scale(w1, m2[0]);
      let w1m3 = scale(w1, m3[0]);
      let w1m4 = scale(w1, m4[0]);
      let w1m5 = scale(w1, m5[0]);
      let w2 = sum(sum(prod(m2[0], m2[0]), prod(m2[1], m2[1])), sum(prod(m2[2], m2[2]), prod(m2[3], m2[3])));
      let w2m0 = scale(w2, m0[0]);
      let w2m1 = scale(w2, m1[0]);
      let w2m3 = scale(w2, m3[0]);
      let w2m4 = scale(w2, m4[0]);
      let w2m5 = scale(w2, m5[0]);
      let w3 = sum(sum(prod(m3[0], m3[0]), prod(m3[1], m3[1])), sum(prod(m3[2], m3[2]), prod(m3[3], m3[3])));
      let w3m0 = scale(w3, m0[0]);
      let w3m1 = scale(w3, m1[0]);
      let w3m2 = scale(w3, m2[0]);
      let w3m4 = scale(w3, m4[0]);
      let w3m5 = scale(w3, m5[0]);
      let w4 = sum(sum(prod(m4[0], m4[0]), prod(m4[1], m4[1])), sum(prod(m4[2], m4[2]), prod(m4[3], m4[3])));
      let w4m0 = scale(w4, m0[0]);
      let w4m1 = scale(w4, m1[0]);
      let w4m2 = scale(w4, m2[0]);
      let w4m3 = scale(w4, m3[0]);
      let w4m5 = scale(w4, m5[0]);
      let w5 = sum(sum(prod(m5[0], m5[0]), prod(m5[1], m5[1])), sum(prod(m5[2], m5[2]), prod(m5[3], m5[3])));
      let w5m0 = scale(w5, m0[0]);
      let w5m1 = scale(w5, m1[0]);
      let w5m2 = scale(w5, m2[0]);
      let w5m3 = scale(w5, m3[0]);
      let w5m4 = scale(w5, m4[0]);
      let p = sum(sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m3[1]), sum(scale(diff(w5m3, w3m5), -m4[1]), scale(diff(w4m3, w3m4), m5[1]))), m2[2]), scale(sum(scale(diff(w5m4, w4m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m4[1]), scale(diff(w4m2, w2m4), m5[1]))), -m3[2])), sum(scale(sum(scale(diff(w5m3, w3m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m3[1]), scale(diff(w3m2, w2m3), m5[1]))), m4[2]), scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), -m5[2]))), m1[3]), sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m3[1]), sum(scale(diff(w5m3, w3m5), -m4[1]), scale(diff(w4m3, w3m4), m5[1]))), m1[2]), scale(sum(scale(diff(w5m4, w4m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m4[1]), scale(diff(w4m1, w1m4), m5[1]))), -m3[2])), sum(scale(sum(scale(diff(w5m3, w3m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m3[1]), scale(diff(w3m1, w1m3), m5[1]))), m4[2]), scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), -m5[2]))), -m2[3]), scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m4[1]), scale(diff(w4m2, w2m4), m5[1]))), m1[2]), scale(sum(scale(diff(w5m4, w4m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m4[1]), scale(diff(w4m1, w1m4), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m2[1]), scale(diff(w2m1, w1m2), m5[1]))), m4[2]), scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), -m5[2]))), m3[3]))), sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m3, w3m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m3[1]), scale(diff(w3m2, w2m3), m5[1]))), m1[2]), scale(sum(scale(diff(w5m3, w3m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m3[1]), scale(diff(w3m1, w1m3), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m2[1]), scale(diff(w2m1, w1m2), m5[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), -m5[2]))), -m4[3]), scale(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), m1[2]), scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), -m2[2])), sum(scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), -m4[2]))), m5[3])), sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m3[1]), sum(scale(diff(w5m3, w3m5), -m4[1]), scale(diff(w4m3, w3m4), m5[1]))), m1[2]), scale(sum(scale(diff(w5m4, w4m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m4[1]), scale(diff(w4m1, w1m4), m5[1]))), -m3[2])), sum(scale(sum(scale(diff(w5m3, w3m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m3[1]), scale(diff(w3m1, w1m3), m5[1]))), m4[2]), scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), -m5[2]))), m0[3]), scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m3[1]), sum(scale(diff(w5m3, w3m5), -m4[1]), scale(diff(w4m3, w3m4), m5[1]))), m0[2]), scale(sum(scale(diff(w5m4, w4m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m4[1]), scale(diff(w4m0, w0m4), m5[1]))), -m3[2])), sum(scale(sum(scale(diff(w5m3, w3m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m3[1]), scale(diff(w3m0, w0m3), m5[1]))), m4[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m5[2]))), -m1[3])))), sum(sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m4[1]), scale(diff(w4m1, w1m4), m5[1]))), m0[2]), scale(sum(scale(diff(w5m4, w4m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m4[1]), scale(diff(w4m0, w0m4), m5[1]))), -m1[2])), sum(scale(sum(scale(diff(w5m1, w1m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m1[1]), scale(diff(w1m0, w0m1), m5[1]))), m4[2]), scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), -m5[2]))), m3[3]), scale(sum(sum(scale(sum(scale(diff(w5m3, w3m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m3[1]), scale(diff(w3m1, w1m3), m5[1]))), m0[2]), scale(sum(scale(diff(w5m3, w3m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m3[1]), scale(diff(w3m0, w0m3), m5[1]))), -m1[2])), sum(scale(sum(scale(diff(w5m1, w1m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m1[1]), scale(diff(w1m0, w0m1), m5[1]))), m3[2]), scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), -m5[2]))), -m4[3])), sum(scale(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), m0[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m1[2])), sum(scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), m3[2]), scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), -m4[2]))), m5[3]), scale(sum(sum(scale(sum(scale(diff(w5m3, w3m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m3[1]), scale(diff(w3m2, w2m3), m5[1]))), m1[2]), scale(sum(scale(diff(w5m3, w3m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m3[1]), scale(diff(w3m1, w1m3), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m2[1]), scale(diff(w2m1, w1m2), m5[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), -m5[2]))), m0[3]))), sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m3, w3m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m3[1]), scale(diff(w3m2, w2m3), m5[1]))), m0[2]), scale(sum(scale(diff(w5m3, w3m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m3[1]), scale(diff(w3m0, w0m3), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m2[1]), scale(diff(w2m0, w0m2), m5[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m5[2]))), -m1[3]), scale(sum(sum(scale(sum(scale(diff(w5m3, w3m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m3[1]), scale(diff(w3m1, w1m3), m5[1]))), m0[2]), scale(sum(scale(diff(w5m3, w3m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m3[1]), scale(diff(w3m0, w0m3), m5[1]))), -m1[2])), sum(scale(sum(scale(diff(w5m1, w1m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m1[1]), scale(diff(w1m0, w0m1), m5[1]))), m3[2]), scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), -m5[2]))), m2[3])), sum(scale(sum(sum(scale(sum(scale(diff(w5m2, w2m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m2[1]), scale(diff(w2m1, w1m2), m5[1]))), m0[2]), scale(sum(scale(diff(w5m2, w2m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m2[1]), scale(diff(w2m0, w0m2), m5[1]))), -m1[2])), sum(scale(sum(scale(diff(w5m1, w1m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m1[1]), scale(diff(w1m0, w0m1), m5[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m5[2]))), -m3[3]), scale(sum(sum(scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), m0[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m1[2])), sum(scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m3[2]))), m5[3])))));
      let n = sum(sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m3[1]), sum(scale(diff(w5m3, w3m5), -m4[1]), scale(diff(w4m3, w3m4), m5[1]))), m2[2]), scale(sum(scale(diff(w5m4, w4m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m4[1]), scale(diff(w4m2, w2m4), m5[1]))), -m3[2])), sum(scale(sum(scale(diff(w5m3, w3m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m3[1]), scale(diff(w3m2, w2m3), m5[1]))), m4[2]), scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), -m5[2]))), m0[3]), sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m3[1]), sum(scale(diff(w5m3, w3m5), -m4[1]), scale(diff(w4m3, w3m4), m5[1]))), m0[2]), scale(sum(scale(diff(w5m4, w4m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m4[1]), scale(diff(w4m0, w0m4), m5[1]))), -m3[2])), sum(scale(sum(scale(diff(w5m3, w3m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m3[1]), scale(diff(w3m0, w0m3), m5[1]))), m4[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m5[2]))), -m2[3]), scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m4[1]), scale(diff(w4m2, w2m4), m5[1]))), m0[2]), scale(sum(scale(diff(w5m4, w4m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m4[1]), scale(diff(w4m0, w0m4), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m2[1]), scale(diff(w2m0, w0m2), m5[1]))), m4[2]), scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), -m5[2]))), m3[3]))), sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m3, w3m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m3[1]), scale(diff(w3m2, w2m3), m5[1]))), m0[2]), scale(sum(scale(diff(w5m3, w3m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m3[1]), scale(diff(w3m0, w0m3), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m2[1]), scale(diff(w2m0, w0m2), m5[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m5[2]))), -m4[3]), scale(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), m0[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m2[2])), sum(scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m4[2]))), m5[3])), sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m4[1]), scale(diff(w4m2, w2m4), m5[1]))), m1[2]), scale(sum(scale(diff(w5m4, w4m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m4[1]), scale(diff(w4m1, w1m4), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m2[1]), scale(diff(w2m1, w1m2), m5[1]))), m4[2]), scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), -m5[2]))), m0[3]), scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m2[1]), sum(scale(diff(w5m2, w2m5), -m4[1]), scale(diff(w4m2, w2m4), m5[1]))), m0[2]), scale(sum(scale(diff(w5m4, w4m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m4[1]), scale(diff(w4m0, w0m4), m5[1]))), -m2[2])), sum(scale(sum(scale(diff(w5m2, w2m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m2[1]), scale(diff(w2m0, w0m2), m5[1]))), m4[2]), scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), -m5[2]))), -m1[3])))), sum(sum(sum(scale(sum(sum(scale(sum(scale(diff(w5m4, w4m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m4[1]), scale(diff(w4m1, w1m4), m5[1]))), m0[2]), scale(sum(scale(diff(w5m4, w4m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m4[1]), scale(diff(w4m0, w0m4), m5[1]))), -m1[2])), sum(scale(sum(scale(diff(w5m1, w1m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m1[1]), scale(diff(w1m0, w0m1), m5[1]))), m4[2]), scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), -m5[2]))), m2[3]), scale(sum(sum(scale(sum(scale(diff(w5m2, w2m5), m1[1]), sum(scale(diff(w5m1, w1m5), -m2[1]), scale(diff(w2m1, w1m2), m5[1]))), m0[2]), scale(sum(scale(diff(w5m2, w2m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m2[1]), scale(diff(w2m0, w0m2), m5[1]))), -m1[2])), sum(scale(sum(scale(diff(w5m1, w1m5), m0[1]), sum(scale(diff(w5m0, w0m5), -m1[1]), scale(diff(w1m0, w0m1), m5[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m5[2]))), -m4[3])), sum(scale(sum(sum(scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), m0[2]), scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), -m1[2])), sum(scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m4[2]))), m5[3]), scale(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), m1[2]), scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), -m2[2])), sum(scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), -m4[2]))), m0[3]))), sum(sum(scale(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m2[1]), sum(scale(diff(w4m2, w2m4), -m3[1]), scale(diff(w3m2, w2m3), m4[1]))), m0[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m2[2])), sum(scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), m3[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m4[2]))), -m1[3]), scale(sum(sum(scale(sum(scale(diff(w4m3, w3m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m3[1]), scale(diff(w3m1, w1m3), m4[1]))), m0[2]), scale(sum(scale(diff(w4m3, w3m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m3[1]), scale(diff(w3m0, w0m3), m4[1]))), -m1[2])), sum(scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), m3[2]), scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), -m4[2]))), m2[3])), sum(scale(sum(sum(scale(sum(scale(diff(w4m2, w2m4), m1[1]), sum(scale(diff(w4m1, w1m4), -m2[1]), scale(diff(w2m1, w1m2), m4[1]))), m0[2]), scale(sum(scale(diff(w4m2, w2m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m2[1]), scale(diff(w2m0, w0m2), m4[1]))), -m1[2])), sum(scale(sum(scale(diff(w4m1, w1m4), m0[1]), sum(scale(diff(w4m0, w0m4), -m1[1]), scale(diff(w1m0, w0m1), m4[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m4[2]))), -m3[3]), scale(sum(sum(scale(sum(scale(diff(w3m2, w2m3), m1[1]), sum(scale(diff(w3m1, w1m3), -m2[1]), scale(diff(w2m1, w1m2), m3[1]))), m0[2]), scale(sum(scale(diff(w3m2, w2m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m2[1]), scale(diff(w2m0, w0m2), m3[1]))), -m1[2])), sum(scale(sum(scale(diff(w3m1, w1m3), m0[1]), sum(scale(diff(w3m0, w0m3), -m1[1]), scale(diff(w1m0, w0m1), m3[1]))), m2[2]), scale(sum(scale(diff(w2m1, w1m2), m0[1]), sum(scale(diff(w2m0, w0m2), -m1[1]), scale(diff(w1m0, w0m1), m2[1]))), -m3[2]))), m4[3])))));
      let d = diff(p, n);
      return d[d.length - 1];
    }
    return exactInSphere6;
  }

  let CACHED = [
    inSphere0,
    inSphere1,
    inSphere2
  ];

  function slowInSphere(args) {
    let proc = CACHED[args.length];
    if (!proc) {
      proc = CACHED[args.length] = orientation(args.length);
    }
    return proc.apply(undefined, args);
  }

  function proc(slow, o0, o1, o2, o3, o4, o5, o6) {
    function testInSphere(a0, a1, a2, a3, a4, a5) {
      switch (arguments.length) {
        case 0:
        case 1:
          return 0;
        case 2:
          return o2(a0, a1);
        case 3:
          return o3(a0, a1, a2);
        case 4:
          return o4(a0, a1, a2, a3);
        case 5:
          return o5(a0, a1, a2, a3, a4);
        case 6:
          return o6(a0, a1, a2, a3, a4, a5);
      }

      let s = new Array(arguments.length);
      for (let i = 0; i < arguments.length; ++i) {
        s[i] = arguments[i];
      }
      return slow(s);
    }
    return testInSphere;
  }

  function generateInSphereTest() {
    while (CACHED.length <= NUM_EXPAND) {
      CACHED.push(orientation(CACHED.length));
    }

    module.exports = proc.apply(undefined, [slowInSphere].concat(CACHED));
    for (let i=0; i<=NUM_EXPAND; ++i) {
      module.exports[i] = CACHED[i];
    }
  }

  generateInSphereTest();
}, {"robust-scale": 10, "robust-subtract": 11, "robust-sum": 12, "two-product": 13}], 9: [function(require, module, exports) {
  "use strict";

  let twoProduct = require("two-product");
  let robustSum = require("robust-sum");
  let robustScale = require("robust-scale");
  let robustSubtract = require("robust-subtract");

  let NUM_EXPAND = 5;

  let EPSILON = 1.1102230246251565e-16;
  let ERRBOUND3 = (3.0 + 16.0 * EPSILON) * EPSILON;
  let ERRBOUND4 = (7.0 + 56.0 * EPSILON) * EPSILON;

  function orientation_3(sum, prod, scale, sub) {
    return function orientation3Exact(m0, m1, m2) {
      let p = sum(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])));
      let n = sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0]));
      let d = sub(p, n);
      return d[d.length - 1];
    };
  }

  function orientation_4(sum, prod, scale, sub) {
    return function orientation4Exact(m0, m1, m2, m3) {
      let p = sum(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))));
      let n = sum(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), sum(scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))));
      let d = sub(p, n);
      return d[d.length - 1];
    };
  }

  function orientation_5(sum, prod, scale, sub) {
    return function orientation5Exact(m0, m1, m2, m3, m4) {
      let p = sum(sum(sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m2[2]), sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), -m3[2]), scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m4[2]))), m1[3]), sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m3[2]), scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m4[2]))), -m2[3]), scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m4[2]))), m3[3]))), sum(scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), -m4[3]), sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m3[2]), scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m4[2]))), m0[3]), scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m3[2]), scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), m4[2]))), -m1[3])))), sum(sum(scale(sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m4[2]))), m3[3]), sum(scale(sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))), -m4[3]), scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m3[2]))), m0[3]))), sum(scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), -m1[3]), sum(scale(sum(scale(sum(prod(m1[1], m3[0]), prod(-m3[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m3[2]))), m2[3]), scale(sum(scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))), -m3[3])))));
      let n = sum(sum(sum(scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m2[2]), sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), -m3[2]), scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m4[2]))), m0[3]), scale(sum(scale(sum(prod(m3[1], m4[0]), prod(-m4[1], m3[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m3[2]), scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), m4[2]))), -m2[3])), sum(scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m4[2]))), m3[3]), scale(sum(scale(sum(prod(m2[1], m3[0]), prod(-m3[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m3[0]), prod(-m3[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m3[2]))), -m4[3]))), sum(sum(scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m1[2]), sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), -m2[2]), scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m4[2]))), m0[3]), scale(sum(scale(sum(prod(m2[1], m4[0]), prod(-m4[1], m2[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m2[2]), scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), m4[2]))), -m1[3])), sum(scale(sum(scale(sum(prod(m1[1], m4[0]), prod(-m4[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m4[0]), prod(-m4[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m4[2]))), m2[3]), scale(sum(scale(sum(prod(m1[1], m2[0]), prod(-m2[1], m1[0])), m0[2]), sum(scale(sum(prod(m0[1], m2[0]), prod(-m2[1], m0[0])), -m1[2]), scale(sum(prod(m0[1], m1[0]), prod(-m1[1], m0[0])), m2[2]))), -m4[3]))));
      let d = sub(p, n);
      return d[d.length - 1];
    };
  }

  function orientation(n) {
    let fn =
    n === 3 ? orientation_3
      : n === 4 ? orientation_4 : orientation_5;

    return fn(robustSum, twoProduct, robustScale, robustSubtract);
  }

  let orientation3Exact = orientation(3);
  let orientation4Exact = orientation(4);

  let CACHED = [
    function orientation0() { return 0; },
    function orientation1() { return 0; },
    function orientation2(a, b) {
      return b[0] - a[0];
    },
    function orientation3(a, b, c) {
      let l = (a[1] - c[1]) * (b[0] - c[0]);
      let r = (a[0] - c[0]) * (b[1] - c[1]);
      let det = l - r;
      let s;
      if (l > 0) {
        if (r <= 0) {
          return det;
        } else {
          s = l + r;
        }
      } else if (l < 0) {
        if (r >= 0) {
          return det;
        } else {
          s = -(l + r);
        }
      } else {
        return det;
      }
      let tol = ERRBOUND3 * s;
      if (det >= tol || det <= -tol) {
        return det;
      }
      return orientation3Exact(a, b, c);
    },
    function orientation4(a, b, c, d) {
      let adx = a[0] - d[0];
      let bdx = b[0] - d[0];
      let cdx = c[0] - d[0];
      let ady = a[1] - d[1];
      let bdy = b[1] - d[1];
      let cdy = c[1] - d[1];
      let adz = a[2] - d[2];
      let bdz = b[2] - d[2];
      let cdz = c[2] - d[2];
      let bdxcdy = bdx * cdy;
      let cdxbdy = cdx * bdy;
      let cdxady = cdx * ady;
      let adxcdy = adx * cdy;
      let adxbdy = adx * bdy;
      let bdxady = bdx * ady;
      let det = adz * (bdxcdy - cdxbdy)
            + bdz * (cdxady - adxcdy)
            + cdz * (adxbdy - bdxady);
      let permanent = (Math.abs(bdxcdy) + Math.abs(cdxbdy)) * Math.abs(adz)
                  + (Math.abs(cdxady) + Math.abs(adxcdy)) * Math.abs(bdz)
                  + (Math.abs(adxbdy) + Math.abs(bdxady)) * Math.abs(cdz);
      let tol = ERRBOUND4 * permanent;
      if ((det > tol) || (-det > tol)) {
        return det;
      }
      return orientation4Exact(a, b, c, d);
    }
  ];

  function slowOrient(args) {
    let proc = CACHED[args.length];
    if (!proc) {
      proc = CACHED[args.length] = orientation(args.length);
    }
    return proc.apply(undefined, args);
  }

  function proc(slow, o0, o1, o2, o3, o4, o5) {
    return function getOrientation(a0, a1, a2, a3, a4) {
      switch (arguments.length) {
        case 0:
        case 1:
          return 0;
        case 2:
          return o2(a0, a1);
        case 3:
          return o3(a0, a1, a2);
        case 4:
          return o4(a0, a1, a2, a3);
        case 5:
          return o5(a0, a1, a2, a3, a4);
      }

      let s = new Array(arguments.length);
      for (let i = 0; i < arguments.length; ++i) {
        s[i] = arguments[i];
      }
      return slow(s);
    };
  }

  function generateOrientationProc() {
    while (CACHED.length <= NUM_EXPAND) {
      CACHED.push(orientation(CACHED.length));
    }
    module.exports = proc.apply(undefined, [slowOrient].concat(CACHED));
    for (let i=0; i<=NUM_EXPAND; ++i) {
      module.exports[i] = CACHED[i];
    }
  }

  generateOrientationProc();
}, {"robust-scale": 10, "robust-subtract": 11, "robust-sum": 12, "two-product": 13}], 10: [function(require, module, exports) {
  "use strict";

  let twoProduct = require("two-product");
  let twoSum = require("two-sum");

  module.exports = scaleLinearExpansion;

  function scaleLinearExpansion(e, scale) {
    let n = e.length;
    if (n === 1) {
      let ts = twoProduct(e[0], scale);
      if (ts[0]) {
        return ts;
      }
      return [ts[1]];
    }
    let g = new Array(2 * n);
    let q = [0.1, 0.1];
    let t = [0.1, 0.1];
    let count = 0;
    twoProduct(e[0], scale, q);
    if (q[0]) {
      g[count++] = q[0];
    }
    for (let i=1; i<n; ++i) {
      twoProduct(e[i], scale, t);
      let pq = q[1];
      twoSum(pq, t[0], q);
      if (q[0]) {
        g[count++] = q[0];
      }
      let a = t[1];
      let b = q[1];
      let x = a + b;
      let bv = x - a;
      let y = b - bv;
      q[1] = x;
      if (y) {
        g[count++] = y;
      }
    }
    if (q[1]) {
      g[count++] = q[1];
    }
    if (count === 0) {
      g[count++] = 0.0;
    }
    g.length = count;
    return g;
  }
}, {"two-product": 13, "two-sum": 14}], 11: [function(require, module, exports) {
  "use strict";

  module.exports = robustSubtract;

  // Easy case: Add two scalars
  function scalarScalar(a, b) {
    let x = a + b;
    let bv = x - a;
    let av = x - bv;
    let br = b - bv;
    let ar = a - av;
    let y = ar + br;
    if (y) {
      return [y, x];
    }
    return [x];
  }

  function robustSubtract(e, f) {
    let ne = e.length|0;
    let nf = f.length|0;
    if (ne === 1 && nf === 1) {
      return scalarScalar(e[0], -f[0]);
    }
    let n = ne + nf;
    let g = new Array(n);
    let count = 0;
    let eptr = 0;
    let fptr = 0;
    let abs = Math.abs;
    let ei = e[eptr];
    let ea = abs(ei);
    let fi = -f[fptr];
    let fa = abs(fi);
    let a; let b;
    if (ea < fa) {
      b = ei;
      eptr += 1;
      if (eptr < ne) {
        ei = e[eptr];
        ea = abs(ei);
      }
    } else {
      b = fi;
      fptr += 1;
      if (fptr < nf) {
        fi = -f[fptr];
        fa = abs(fi);
      }
    }
    if ((eptr < ne && ea < fa) || (fptr >= nf)) {
      a = ei;
      eptr += 1;
      if (eptr < ne) {
        ei = e[eptr];
        ea = abs(ei);
      }
    } else {
      a = fi;
      fptr += 1;
      if (fptr < nf) {
        fi = -f[fptr];
        fa = abs(fi);
      }
    }
    let x = a + b;
    let bv = x - a;
    let y = b - bv;
    let q0 = y;
    let q1 = x;
    let _x; let _bv; let _av; let _br; let _ar;
    while (eptr < ne && fptr < nf) {
      if (ea < fa) {
        a = ei;
        eptr += 1;
        if (eptr < ne) {
          ei = e[eptr];
          ea = abs(ei);
        }
      } else {
        a = fi;
        fptr += 1;
        if (fptr < nf) {
          fi = -f[fptr];
          fa = abs(fi);
        }
      }
      b = q0;
      x = a + b;
      bv = x - a;
      y = b - bv;
      if (y) {
        g[count++] = y;
      }
      _x = q1 + x;
      _bv = _x - q1;
      _av = _x - _bv;
      _br = x - _bv;
      _ar = q1 - _av;
      q0 = _ar + _br;
      q1 = _x;
    }
    while (eptr < ne) {
      a = ei;
      b = q0;
      x = a + b;
      bv = x - a;
      y = b - bv;
      if (y) {
        g[count++] = y;
      }
      _x = q1 + x;
      _bv = _x - q1;
      _av = _x - _bv;
      _br = x - _bv;
      _ar = q1 - _av;
      q0 = _ar + _br;
      q1 = _x;
      eptr += 1;
      if (eptr < ne) {
        ei = e[eptr];
      }
    }
    while (fptr < nf) {
      a = fi;
      b = q0;
      x = a + b;
      bv = x - a;
      y = b - bv;
      if (y) {
        g[count++] = y;
      }
      _x = q1 + x;
      _bv = _x - q1;
      _av = _x - _bv;
      _br = x - _bv;
      _ar = q1 - _av;
      q0 = _ar + _br;
      q1 = _x;
      fptr += 1;
      if (fptr < nf) {
        fi = -f[fptr];
      }
    }
    if (q0) {
      g[count++] = q0;
    }
    if (q1) {
      g[count++] = q1;
    }
    if (!count) {
      g[count++] = 0.0;
    }
    g.length = count;
    return g;
  }
}, {}], 12: [function(require, module, exports) {
  "use strict";

  module.exports = linearExpansionSum;

  // Easy case: Add two scalars
  function scalarScalar(a, b) {
    let x = a + b;
    let bv = x - a;
    let av = x - bv;
    let br = b - bv;
    let ar = a - av;
    let y = ar + br;
    if (y) {
      return [y, x];
    }
    return [x];
  }

  function linearExpansionSum(e, f) {
    let ne = e.length|0;
    let nf = f.length|0;
    if (ne === 1 && nf === 1) {
      return scalarScalar(e[0], f[0]);
    }
    let n = ne + nf;
    let g = new Array(n);
    let count = 0;
    let eptr = 0;
    let fptr = 0;
    let abs = Math.abs;
    let ei = e[eptr];
    let ea = abs(ei);
    let fi = f[fptr];
    let fa = abs(fi);
    let a; let b;
    if (ea < fa) {
      b = ei;
      eptr += 1;
      if (eptr < ne) {
        ei = e[eptr];
        ea = abs(ei);
      }
    } else {
      b = fi;
      fptr += 1;
      if (fptr < nf) {
        fi = f[fptr];
        fa = abs(fi);
      }
    }
    if ((eptr < ne && ea < fa) || (fptr >= nf)) {
      a = ei;
      eptr += 1;
      if (eptr < ne) {
        ei = e[eptr];
        ea = abs(ei);
      }
    } else {
      a = fi;
      fptr += 1;
      if (fptr < nf) {
        fi = f[fptr];
        fa = abs(fi);
      }
    }
    let x = a + b;
    let bv = x - a;
    let y = b - bv;
    let q0 = y;
    let q1 = x;
    let _x; let _bv; let _av; let _br; let _ar;
    while (eptr < ne && fptr < nf) {
      if (ea < fa) {
        a = ei;
        eptr += 1;
        if (eptr < ne) {
          ei = e[eptr];
          ea = abs(ei);
        }
      } else {
        a = fi;
        fptr += 1;
        if (fptr < nf) {
          fi = f[fptr];
          fa = abs(fi);
        }
      }
      b = q0;
      x = a + b;
      bv = x - a;
      y = b - bv;
      if (y) {
        g[count++] = y;
      }
      _x = q1 + x;
      _bv = _x - q1;
      _av = _x - _bv;
      _br = x - _bv;
      _ar = q1 - _av;
      q0 = _ar + _br;
      q1 = _x;
    }
    while (eptr < ne) {
      a = ei;
      b = q0;
      x = a + b;
      bv = x - a;
      y = b - bv;
      if (y) {
        g[count++] = y;
      }
      _x = q1 + x;
      _bv = _x - q1;
      _av = _x - _bv;
      _br = x - _bv;
      _ar = q1 - _av;
      q0 = _ar + _br;
      q1 = _x;
      eptr += 1;
      if (eptr < ne) {
        ei = e[eptr];
      }
    }
    while (fptr < nf) {
      a = fi;
      b = q0;
      x = a + b;
      bv = x - a;
      y = b - bv;
      if (y) {
        g[count++] = y;
      }
      _x = q1 + x;
      _bv = _x - q1;
      _av = _x - _bv;
      _br = x - _bv;
      _ar = q1 - _av;
      q0 = _ar + _br;
      q1 = _x;
      fptr += 1;
      if (fptr < nf) {
        fi = f[fptr];
      }
    }
    if (q0) {
      g[count++] = q0;
    }
    if (q1) {
      g[count++] = q1;
    }
    if (!count) {
      g[count++] = 0.0;
    }
    g.length = count;
    return g;
  }
}, {}], 13: [function(require, module, exports) {
  "use strict";

  module.exports = twoProduct;

  let SPLITTER = Number(Math.pow(2, 27) + 1.0);

  function twoProduct(a, b, result) {
    let x = a * b;

    let c = SPLITTER * a;
    let abig = c - a;
    let ahi = c - abig;
    let alo = a - ahi;

    let d = SPLITTER * b;
    let bbig = d - b;
    let bhi = d - bbig;
    let blo = b - bhi;

    let err1 = x - (ahi * bhi);
    let err2 = err1 - (alo * bhi);
    let err3 = err2 - (ahi * blo);

    let y = alo * blo - err3;

    if (result) {
      result[0] = y;
      result[1] = x;
      return result;
    }

    return [y, x];
  }
}, {}], 14: [function(require, module, exports) {
  "use strict";

  module.exports = fastTwoSum;

  function fastTwoSum(a, b, result) {
    let x = a + b;
    let bv = x - a;
    let av = x - bv;
    let br = b - bv;
    let ar = a - av;
    if (result) {
      result[0] = ar + br;
      result[1] = x;
      return result;
    }
    return [ar+br, x];
  }
}, {}]}, {}, [1]);
