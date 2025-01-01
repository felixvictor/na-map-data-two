// noinspection SpellCheckingInspection
export type ElementMap = Map<string, { [key: string]: string; group: string; element: string }>
export interface GroupOfXMLFile {
    ext: string // file name extension (base file name is a ship name)
    elements: ElementMap
}

/**
 * Data structure for content of the individual files.
 */
export const groupOfFiles: GroupOfXMLFile[] = [
    {
        ext: "b armor",
        elements: new Map([
            // ["ARMOR_REAR_HP", { group: "stern", element: "armour" }], // removed patch 30
            ["ARMOR_THICKNESS", { group: "stern", element: "thickness" }],
            ["REPAIR_MODULE_TIME", { group: "repairTime", element: "stern" }],
        ]),
    },
    {
        ext: "crew",
        elements: new Map([
            ["SHIP_BOARDING_PREPARATION_BONUS", { group: "boarding", element: "prepInitial" }],
            ["PREPARATION_BONUS_PER_ROUND", { group: "boarding", element: "prepPerRound" }],
            ["HANDBOOK_MORALE_BONUS", { group: "boarding", element: "morale" }],
        ]),
    },
    {
        ext: "f armor",
        elements: new Map([
            // ["ARMOR_FRONT_HP", { group: "bow", element: "armour" }], // removed patch 30
            ["ARMOR_THICKNESS", { group: "bow", element: "thickness" }],
            ["REPAIR_MODULE_TIME", { group: "repairTime", element: "bow" }],
        ]),
    },
    {
        ext: "l armor",
        elements: new Map([
            // ["ARMOR_LEFT_HP", { group: "sides", element: "armour" }], // removed patch 30
            ["ARMOR_THICKNESS", { group: "sides", element: "thickness" }],
            ["REPAIR_MODULE_TIME", { group: "repairTime", element: "sides" }],
        ]),
    },
    {
        ext: "hull",
        elements: new Map([
            // ["FIRE_INCREASE_RATE", "FIRE_INCREASE_RATE"],
            // ["FIREZONE_HORIZONTAL_ROTATION_SPEED", "FIREZONE_HORIZONTAL_ROTATION_SPEED"],
            ["FIREZONE_HORIZONTAL_WIDTH", { group: "ship", element: "firezoneHorizontalWidth" }],
            // ["FIREZONE_MAX_HORIZONTAL_ANGLE", "FIREZONE_MAX_HORIZONTAL_ANGLE"],
            // ["HIT_PROBABILITY", "HIT_PROBABILITY"],
            ["SHIP_PHYSICS_ACC_COEF", { group: "ship", element: "acceleration" }],
            ["SHIP_PHYSICS_DEC_COEF", { group: "ship", element: "deceleration" }],
            ["SHIP_MAX_ROLL_ANGLE", { group: "ship", element: "rollAngle" }],
            // ["SHIP_RHEAS_DRIFT", "SHIP_RHEAS_DRIFT"],
            // ["SHIP_SPEED_DRIFT_MODIFIER", { group: "ship", element: "speedDriftModifier" }],
            // ["SHIP_SPEED_YARD_POWER_MODIFIER", "SHIP_SPEED_YARD_POWER_MODIFIER"],
            // ["SHIP_STAYSAILS_DRIFT", { group: "ship", element: "staySailsDrift" }],
            ["SHIP_STRUCTURE_LEAKS_PER_SECOND", { group: "ship", element: "structureLeaks" }],
            ["SHIP_TURNING_ACCELERATION_TIME", { group: "ship", element: "turnAcceleration" }],
            ["SHIP_TURNING_ACCELERATION_TIME_RHEAS", { group: "ship", element: "yardTurningAcceleration" }],
            ["SHIP_WATERLINE_HEIGHT", { group: "ship", element: "waterlineHeight" }],
        ]),
    },
    {
        ext: "mast",
        elements: new Map([
            // ["HIT_PROBABILITY", "HIT_PROBABILITY"],
            ["MAST_BOTTOM_SECTION_HP", { group: "mast", element: "bottomArmour" }],
            ["MAST_MIDDLE_SECTION_HP", { group: "mast", element: "middleArmour" }],
            ["MAST_TOP_SECTION_HP", { group: "mast", element: "topArmour" }],
        ]),
    },
    {
        ext: "rudder",
        elements: new Map([
            ["ARMOR_THICKNESS", { group: "rudder", element: "thickness" }],
            // ["HIT_PROBABILITY", "HIT_PROBABILITY"],
            // ["MODULE_BASE_HP", { group: "rudder", element: "armour" }], // removed patch 30
            ["REPAIR_MODULE_TIME", { group: "repairTime", element: "rudder" }],
            ["RUDDER_HALFTURN_TIME", { group: "rudder", element: "halfturnTime" }],
            ["SHIP_TURNING_SPEED", { group: "ship", element: "turnSpeed" }],
        ]),
    },
    {
        ext: "sail",
        elements: new Map([
            // ["EXPLOSION_DAMAGE_ABSORB_MULTIPLIER", "EXPLOSION_DAMAGE_ABSORB_MULTIPLIER"],
            // ["HIT_PROBABILITY", "HIT_PROBABILITY"],
            // ["MAST_CRIT_PROBABILITY", "MAST_CRIT_PROBABILITY"],
            ["MAST_THICKNESS", { group: "mast", element: "bottomThickness" }],
            // ["MODULE_BASE_HP", { group: "sails", element: "armour" }], // removed patch 30
            ["REPAIR_MODULE_TIME", { group: "repairTime", element: "sails" }],
            // ["RHEA_TURN_SPEED", "RHEA_TURN_SPEED"],
            ["SAIL_RISING_SPEED", { group: "sails", element: "risingSpeed" }],
            ["SAILING_CREW_REQUIRED", { group: "crew", element: "sailing" }],
            // ["SHIP_MAX_SPEED", { group: "ship", element: "maxSpeed" }],
            // ["SPANKER_TURN_SPEED", { group: "sails", element: "spankerTurnSpeed" }]
        ]),
    },
    {
        ext: "structure",
        elements: new Map([
            // ["EXPLOSION_DAMAGE_ABSORB_MULTIPLIER", "EXPLOSION_DAMAGE_ABSORB_MULTIPLIER"],
            // ["MODULE_BASE_HP", { group: "structure", element: "armour" }], // removed patch 30
            ["REPAIR_MODULE_TIME", { group: "repairTime", element: "structure" }],
        ]),
    },
]
