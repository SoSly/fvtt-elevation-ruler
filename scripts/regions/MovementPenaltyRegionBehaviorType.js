/* globals
foundry
*/
"use strict";

import { MODULE_ID, MOVEMENT_TYPES } from "../const.js";

/**
 * Region behavior that applies movement penalties to tokens moving through the region.
 * Stores multipliers for different movement types (walk, fly, burrow, swim, climb).
 * A multiplier of 1 means normal speed, 2 means half speed (difficult terrain), 0.5 means double speed.
 *
 * @property {number} walkMultiplier    Movement cost multiplier for walking
 * @property {number} flyMultiplier     Movement cost multiplier for flying
 * @property {number} burrowMultiplier  Movement cost multiplier for burrowing
 * @property {number} swimMultiplier    Movement cost multiplier for swimming
 * @property {number} climbMultiplier   Movement cost multiplier for climbing
 */
export class MovementPenaltyRegionBehaviorType extends foundry.data.regionBehaviors.RegionBehaviorType {

  static defineSchema() {
    const fields = foundry.data.fields;

    return {
      walkMultiplier: new fields.NumberField({
        required: true,
        initial: 1,
        min: 0,
        label: `${MODULE_ID}.regions.movement-penalty.walk-multiplier.name`,
        hint: `${MODULE_ID}.regions.movement-penalty.walk-multiplier.hint`
      }),

      flyMultiplier: new fields.NumberField({
        required: true,
        initial: 1,
        min: 0,
        label: `${MODULE_ID}.regions.movement-penalty.fly-multiplier.name`,
        hint: `${MODULE_ID}.regions.movement-penalty.fly-multiplier.hint`
      }),

      burrowMultiplier: new fields.NumberField({
        required: true,
        initial: 1,
        min: 0,
        label: `${MODULE_ID}.regions.movement-penalty.burrow-multiplier.name`,
        hint: `${MODULE_ID}.regions.movement-penalty.burrow-multiplier.hint`
      }),

      swimMultiplier: new fields.NumberField({
        required: true,
        initial: 1,
        min: 0,
        label: `${MODULE_ID}.regions.movement-penalty.swim-multiplier.name`,
        hint: `${MODULE_ID}.regions.movement-penalty.swim-multiplier.hint`
      }),

      climbMultiplier: new fields.NumberField({
        required: true,
        initial: 1,
        min: 0,
        label: `${MODULE_ID}.regions.movement-penalty.climb-multiplier.name`,
        hint: `${MODULE_ID}.regions.movement-penalty.climb-multiplier.hint`
      })
    };
  }

  /**
   * Get the movement cost multiplier for a specific movement type.
   * @param {MOVEMENT_TYPES} movementType - The movement type enum value
   * @returns {number} The multiplier for this movement type (1 = normal, 2 = half speed, etc.)
   */
  getMultiplierForMovementType(movementType) {
    const typeMap = {
      [MOVEMENT_TYPES.BURROW]: this.burrowMultiplier,
      [MOVEMENT_TYPES.WALK]: this.walkMultiplier,
      [MOVEMENT_TYPES.FLY]: this.flyMultiplier,
      [MOVEMENT_TYPES.SWIM]: this.swimMultiplier,
      [MOVEMENT_TYPES.CLIMB]: this.climbMultiplier
    };

    return typeMap[movementType] ?? 1;
  }
}
