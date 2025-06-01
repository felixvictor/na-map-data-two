// noinspection SpellCheckingInspection
import { moduleLevelUniversal } from "../@types/constants.js"
import type { APIModifierName, ModifierName, ModuleConvertEntity } from "../@types/modules.js"

export const modifiers = new Map<APIModifierName, ModifierName>([
    // Woods
    ["ARMOR_ALL_SIDES ARMOR_THICKNESS", "Armour thickness"],
    ["ARMOR_ALL_SIDES MODULE_BASE_HP", "Armour hit points"],
    ["CREW MODULE_BASE_HP", "Crew"],
    ["INTERNAL_STRUCTURE MODULE_BASE_HP", "Hull hit points"],
    ["INTERNAL_STRUCTURE REPAIR_MODULE_TIME", ""],
    ["MAST MAST_BOTTOM_SECTION_HP", "Mast hit points"],
    ["MAST MAST_MIDDLE_SECTION_HP", ""],
    ["MAST MAST_TOP_SECTION_HP", ""],
    ["NONE CREW_DAMAGE_RECEIVED_DECREASE_PERCENT", "Splinter resistance"],
    ["NONE GROG_MORALE_BONUS", "Morale"],
    ["NONE SHIP_ACCELERATION_MODIFIER", "Acceleration"],
    // ["NONE SHIP_MATERIAL", "Ship material"],
    ["NONE RUDDER_HALFTURN_TIME", "Rudder speed"],
    ["NONE SHIP_MAX_SPEED", "Max speed"],
    ["NONE SHIP_PHYSICS_ACC_COEF", "Acceleration"],
    ["NONE SHIP_TURNING_ACCELERATION_TIME", "Turn acceleration"],
    ["NONE SHIP_TURNING_SPEED", "Turn speed"],
    ["REPAIR_ARMOR REPAIR_PERCENT", "Repair amount"],
    ["SAIL MAST_THICKNESS", "Mast thickness"],
    ["STRUCTURE FIRE_INCREASE_RATE", ""],
    ["STRUCTURE SHIP_PHYSICS_ACC_COEF", "Acceleration"],
    ["STRUCTURE SHIP_STRUCTURE_LEAKS_PER_SECOND", "Leak resistance"],

    // {"Slot":"REPAIR_ARMOR","MappingIds":["REPAIR_PERCENT"],"Absolute":0.07,"Percentage":0}

    // Modules
    ["ARMOR_ALL_SIDES REPAIR_MODULE_TIME", "Repair time"],
    ["ARMOR_BACK ARMOR_THICKNESS", "Back armour thickness"],
    ["ARMOR_FRONT ARMOR_THICKNESS", "Front armour thickness"],
    ["DECK_CENTRAL CANNON_DISPERSION_PER100M", "Cannon horizontal dispersion"],
    ["DECK_CENTRAL CANNON_DISPERSION_VERTICAL_PER100M", "Cannon vertical dispersion"],
    ["DECK_ALL CANNON_BASIC_DAMAGE", "Cannon damage"],
    ["DECK_ALL CANNON_BASIC_PENETRATION", "Cannon ball penetration"],
    ["DECK_ALL CANNON_CREW_REQUIRED", "Cannon crew"],
    ["DECK_ALL CANNON_DISPERSION_PER100M", "Cannon horizontal dispersion"],
    ["DECK_ALL CANNON_DISPERSION_VERTICAL_PER100M", "Cannon vertical dispersion"],
    ["DECK_ALL CANNON_DISPERSION_REDUCTION_SPEED", "Cannon aiming speed"],
    ["DECK_ALL CANNON_MIN_ANGLE", "Cannon down traverse"],
    ["DECK_ALL CANNON_MAX_ANGLE", "Cannon up traverse"],
    ["DECK_ALL CANNON_RELOAD_TIME", "Cannon reload time"],
    ["DECK_ALL FIRE_PROBABILITY", "Fire probability"],
    [
        "DECK_CENTRAL CANNON_DISPERSION_PER100M,CANNON_DISPERSION_VERTICAL_PER100M",
        "Mortar horizontal/vertical dispersion",
    ],
    ["DECK_CENTRAL CANNON_DISPERSION_REDUCTION_SPEED", "Mortar aiming speed"],
    ["MAST MAST_BOTTOM_SECTION_HP,MAST_MIDDLE_SECTION_HP,MAST_TOP_SECTION_HP", "Mast hit points"],
    ["MAST MAST_TOP_SECTION_HP,MAST_MIDDLE_SECTION_HP,MAST_BOTTOM_SECTION_HP", "Mast hit points"],
    ["NONE AXES_ATTACK_BONUS", "Melee attack"],
    ["NONE AXES_DISENGAGE_DURATION", "Disengage time"],
    ["NONE BARRICADES_FIREPOWER_BONUS", "Barricade musket defense"],
    ["NONE BARRICADES_MELEE_BONUS", "Barricade melee bonus"],
    ["NONE BOARDING_ATTACK_BONUS", "Melee attack"],
    ["NONE BOARDING_DEFENSE_BONUS", "Melee defense"],
    ["NONE CREW_TRANSFER_SPEED", "Crew transfer speed"],
    ["NONE DECK_GUNS_ACCURACY_BONUS", "Boarding cannons accuracy"],
    ["NONE FIRE_DECREASE_RATE", ""],
    ["NONE FIRE_INCREASE_RATE", ""],
    ["NONE FIREZONE_HORIZONTAL_ROTATION_SPEED", "Cannon side traverse"],
    ["NONE FIREZONE_MAX_HORIZONTAL_ANGLE", "Cannon side traverse"],
    ["NONE GLOBAL_SIDEBOARD_WATER_FLOW", "Sideboard water flow"],
    ["NONE GRENADES_BONUS", "Grenades"],
    ["NONE GROG_ACCURACY_PENALTY", "Muskets accuracy"],
    ["NONE GROG_ATTACK_BONUS", "Melee attack"],
    ["NONE HANDBOOK_ATTACK_BONUS", "Melee attack"],
    ["NONE HANDBOOK_DEFENSE_BONUS", "Melee defense"],
    ["NONE HANDBOOK_MORALE_BONUS", "Morale"],
    ["NONE HOLE_DECREASE_RATE,RAM_DECREASE_RATE", "Leak repair"],
    ["NONE HOLE_DECREASE_RATE", "Leak repair"],
    ["NONE RAM_DECREASE_RATE", ""],
    ["NONE LADDERS_MELEE_PENALTY_REDUCE", "Ship height penalty reduction"],
    ["NONE MARINES_FIREPOWER_MODIFIER", "Marines firepower"],
    ["NONE MARINES_LEVEL", "Marines level"],
    ["NONE MARINES_MELEE_MODIFIER", "Marines melee attack"],
    ["NONE MARINES_PERCENTAGE", "Marines percentage"],
    ["NONE MAST_DAMAGE_MODIFIER", "Mast damage"],
    ["NONE MAST_PHYSICS_JIB_SAIL_FORCE_BONUS", "Staysails power"],
    ["NONE MAST_PHYSICS_MAIN_SAIL_FORCE_BONUS", "Square sails power"],
    ["NONE MAST_PHYSICS_MAIN_SAIL_TORQUE_BONUS", "Square sails torque"],
    ["NONE MAST_PHYSICS_SPANKER_SAIL_FORCE_BONUS", "Spanker power"],
    ["NONE MUSKETS_ACCURACY_BONUS", "Muskets accuracy"],
    ["NONE MUSKETS_PERCENTAGE_OF_CREW", "Crew with muskets"],
    ["NONE PERK_BOARDING_ATTACK_COST_MODIFIER", "Boarding attack cost"],

    ["NONE PERK_REPAIR_REDUCE_TIMER_ARMOR", "Armour repair cooldown (minutes)"],
    ["NONE PERK_REPAIR_REDUCE_TIMER_SAILS", "Sail repair cooldown (minutes)"],
    ["NONE PERK_REPAIR_REDUCE_TIMER_CREW", "Crew repair cooldown (minutes)"],

    ["NONE DAMAGE_CANNON_DESTROY_PROBABILITY", ""],
    ["NONE PERK_ARSENAL_CASTIRONKNOWLEDGE", ""],
    ["NONE PERK_ARSENAL_COMBAT_RECORDING", ""],
    ["NONE PERK_ARSENAL_CONICAL_CHAMBER", ""],
    ["NONE PERK_ARSENAL_FUEL_WASTE_REDUCTION", ""],
    ["NONE PERK_ARSENAL_FUEL_WASTE_REDUCTION_GUNFOUNDRY", ""],
    ["NONE PERK_ARSENAL_FUEL_WASTE_REDUCTION_SMELTER", ""],
    ["NONE PERK_ARSENAL_GUNFOUNDRY", ""],
    ["NONE PERK_ARSENAL_GUNFOUNDRY_PERCENT_INCREASER", ""],
    ["NONE PERK_ARSENAL_GUNFOUNDRY_PROC_INCREASER", ""],
    ["NONE PERK_ARSENAL_INCH_12_DRILL", ""],
    ["NONE PERK_ARSENAL_INCH_18_DRILL", ""],
    ["NONE PERK_ARSENAL_INCH_24_DRILL", ""],
    ["NONE PERK_ARSENAL_INCH_32_DRILL", ""],
    ["NONE PERK_ARSENAL_INCH_36_DRILL", ""],
    ["NONE PERK_ARSENAL_INCH_42_DRILL", ""],
    ["NONE PERK_ARSENAL_INCH_4_DRILL", ""],
    ["NONE PERK_ARSENAL_INCH_68_DRILL", ""],
    ["NONE PERK_ARSENAL_INCH_6_DRILL", ""],
    ["NONE PERK_ARSENAL_INCH_9_DRILL", ""],
    ["NONE PERK_ARSENAL_LESS_UPKEEP", ""],
    ["NONE PERK_ARSENAL_LIGHT_WEIGHT_HEAVY", ""],
    ["NONE PERK_ARSENAL_LONG_BARREL", ""],
    ["NONE PERK_ARSENAL_METALLURGY", ""],
    ["NONE PERK_ARSENAL_METAL_WASTE_REDUCTION", ""],
    ["NONE PERK_ARSENAL_MORTAR", ""],
    ["NONE PERK_ARSENAL_MORTAR_DRILL", ""],
    ["NONE PERK_ARSENAL_PRECISE_LONG", ""],
    ["NONE PERK_ARSENAL_RARE_GUN_IDENTIFICATION", ""],
    ["NONE PERK_ARSENAL_RARE_METAL_IDENTIFICATION", ""],
    ["NONE PERK_ARSENAL_RE_BORING", ""],
    ["NONE PERK_ARSENAL_RING", ""],
    ["NONE PERK_ARSENAL_SHORT_GUN", ""],
    ["NONE PERK_ARSENAL_SHORT_HOWITZER", ""],
    ["NONE PERK_ARSENAL_SMELTING", ""],
    ["NONE PERK_ARSENAL_SMELTING_TIME_DECREASE", ""],
    ["NONE PERK_ARSENAL_STEEL_KNOWLEDGE", ""],
    ["NONE PERK_ARSENAL_TOTAL_EFFICIENTY", ""],
    ["NONE PERK_ARSENAL_WRROUGHT_IRON_UNDERSTANDING", ""],
    ["NONE PERK_CANNON_RELOAD_MODIFICATOR", "Cannon reload time"],
    ["NONE PERK_FIRE_CHANCE", ""],
    ["NONE PERK_SEARCH", "Additional module drop in PvP"],
    ["NONE SHIP_MAX_SPEED_OW", "Open world speed"],
    ["NONE SHIP_TURNING_SPEED_OW", "Open world turn rate"],

    ["NONE PERK_BOARDING_DEFEND_COST_MODIFIER", "Boarding defend cost"],
    ["NONE PERK_BOARDING_ENEMY_EXTRA_CREW_REQUIREMENT", "Enemy boarding crew needed"],
    ["NONE PERK_BOARDING_ENEMY_MORALE_LOSS_MODIFIER", "Enemy boarding morale loss"],
    ["NONE PERK_CARRONADE_DISPERSION_MODIFIER", "Carronade dispersion"],
    ["NONE PERK_CONTROL_EXIT_TIMER_OVERRIDE_DISTANCE", "Control distance"],
    ["NONE PERK_CRAFT_CREW_HIRE_COST_MODIFIER", "Crew hire cost"],
    ["NONE PERK_CRAFT_DROP_RECIPE_CHANCE_MODIFIER", "CRAFT_DROP_RECIPE_CHANCE_MODIFIER"],
    ["NONE PERK_CRAFT_FRIGATE_SHIP_LABOR_PRICE_MODIFIER", "Labour hours to craft frigate"],
    ["NONE PERK_CRAFT_LIGHT_SHIP_LABOR_PRICE_MODIFIER", "Labour hours to craft unrated ship"],
    ["NONE PERK_CRAFT_LINE_SHIP_LABOR_PRICE_MODIFIER", "Labour hours to craft ship of the line"],
    ["NONE PERK_CRAFT_SHIP_LABOR_PRICE_MODIFIER", "Labour hours to craft any ship"],
    ["NONE PERK_CREW_REPAIR_PERCENT_MODIFIER", "Crew repair amount"],
    ["NONE PERK_DONT_CONSUME_BATTLE_REPAIRS", "DONT_CONSUME_BATTLE_REPAIRS"],
    ["NONE PERK_EMERGENCY_REPAIR_COOLDOWN_MODIFIER", "Emergency repair cooldown"],
    ["NONE PERK_ENABLE_DOUBLE_CHARGE", "Double charge"],
    ["NONE PERK_ENABLE_DOUBLE_SHOT", "Double shot"],
    ["NONE PERK_FISHING_DROP_CHANCE_MODIFIER", "Fishing efficiency"],
    ["NONE PERK_HEEL_DEGREES_MODIFIER", "Heel correction"],
    ["NONE PERK_HOLD_MAX_WEIGHT_MODIFIER", "Hold weight"],
    ["NONE PERK_HULL_REPAIR_PERCENT_MODIFIER", "Armour repair amount"],
    ["NONE PERK_LABOR_HOURS_GENERATION_MODIFIER", "Labour hour generation"],
    ["NONE PERK_LABOR_HOURS_WALLET_MODIFIER", "Labour hour reserve"],
    ["NONE PERK_MAX_FLEET_SIZE_MODIFIER", "Fleet size"],
    ["NONE PERK_MORTAR_BALL_COUNT_MODIFIER", "Additional mortar balls"],
    ["NONE PERK_MORTAR_DISPERSION_MODIFIER", "Mortar dispension"],
    ["NONE PERK_MORTAR_RELOAD_TIME_MODIFIER", "Mortar reload time"],
    ["NONE PERK_NATIONAL_HUNTER_SPEED_ADD_MODIFIER", "National hunter speed modifier"],
    ["NONE PERK_PIRATE_HUNTER_RELOAD_TIME_MODIFIER", "Pirate hunter reload time"],
    ["NONE PERK_PRESS_GANG", "Press gang"],
    ["NONE PERK_PUMP_WATER_BAILING_MODIFIER", "Pump water bailing"],
    ["NONE PERK_RECOVER_LOST_CREW_PERCENT", "Recover lost crew"],
    ["NONE PERK_SAIL_DAMAGE_MODIFIER", "Sail damage"],
    ["NONE PERK_SAIL_REPAIR_PERCENT_MODIFIER", "Sail repair amount"],
    ["NONE PERK_SHIP_EXTRA_CHAIN_UNITS", "Additional chains"],
    ["NONE PERK_SHIP_EXTRA_DOBULE_CHARGE_UNITS", "Additional double charges"], // typo
    ["NONE PERK_SHIP_EXTRA_DOUBLE_CHARGE_UNITS", "Additional double charges"],
    ["NONE PERK_SHIP_EXTRA_DOUBLE_SHOT_UNITS", "Additional double shots"],
    ["NONE PERK_SHIP_MASTER_CLASS_TYPE", "Ship master class type"],
    ["NONE PERK_SHIP_MASTER_RELOAD_TIME_MODIFIER", "Ship master reload time modifier"],
    ["NONE PERK_SHIP_MASTER_REPAIR_COUNT_ADD_MODIFIER", "Additional repairs"],
    ["NONE PERK_SHIP_MASTER_SPEED_ADD_MODIFIER", "Ship master speed add modifier"],
    ["NONE PERK_SOLD_SHIP_PRICE_MODIFIER", "Ship purchase price"],
    ["NONE PERK_START_ALL_GUNS_LOADED", "Guns loaded at start"],
    ["NONE PREPARATION_BONUS_PER_ROUND", "Preparation"],
    ["NONE RHEA_TURN_SPEED", "Yard turn speed"],
    ["NONE SAIL_DECREASING_SPEED", "Sail decreasing speed"],
    ["NONE SAIL_RISING_SPEED", "Sail rising speed"],
    ["NONE SHIP_DECELERATION_MODIFIER", "Deceleration"],
    ["NONE SHIP_BOARDING_PREPARATION_BONUS", "Preparation"],
    ["NONE SHIP_EXTRA_CHAIN_UNITS", "Additional chains"],
    ["NONE SHIP_EXTRA_DOBULE_CHARGE_UNITS", "Additional double charges"], // typo
    ["NONE SHIP_EXTRA_DOUBLE_CHARGE_UNITS", "Additional double charges"],
    ["NONE SHIP_EXTRA_DOUBLE_SHOT_UNITS", "Additional double shots"],
    ["NONE SHIP_MAX_ROLL_ANGLE", "Heel"],
    ["NONE SHIP_PHYSICS_DEC_COEF", "Deceleration"],
    ["NONE SHIP_REPAIR_ARMOR_CREW_REQUIREMENT", "Armour repair crew needed"],
    ["NONE SHIP_REPAIR_SAIL_CREW_REQUIREMENT", "Sail repair crew needed"],
    ["NONE SHIP_TURNING_SPEED_RHEAS", "Yard power"],
    ["NONE WATER_PUMP_BAILING", "Water pump bailing"],
    ["POWDER POWDER_RADIUS", "Explosion power"],
    ["POWDER REPAIR_MODULE_TIME", ""],
    ["REPAIR_CREW REPAIR_PERCENT", "Crew repair amount"],
    ["REPAIR_GENERIC REPAIR_PERCENT", "Repair amount"],
    ["REPAIR_SAIL REPAIR_PERCENT", "Sail repair amount"],
    ["RUDDER MODULE_BASE_HP", "Rudder hit points"],
    ["RUDDER REPAIR_MODULE_TIME", ""],
    ["SAIL MODULE_BASE_HP", "Sail hit points"],
    ["SAIL REPAIR_MODULE_TIME", "Sail repair time"],
    ["SAIL SAILING_CREW_REQUIRED", "Sailing crew"],
    ["STRUCTURE CANNON_MASS", "Cannon weight"],
    ["STRUCTURE SHIP_CANNON_DESTROY_PROBABILITY", "Cannon destroy probability"],
    ["WATER_PUMP MODULE_BASE_HP", "Water pump hit points"],
    ["WATER_PUMP REPAIR_MODULE_TIME", ""],
])

export const rareWoodTrimFrameIds = new Set([
    2356, // African Oak Frame
    2357, // African Teak Frame
    2359, // Danzic Oak Frame
    2360, // Greenheart Frame
    2361, // Italian Larch Frame
    2362, // Malabar Teak Frame
    2364, // New England Fir Frame
    2365, // Rangoon Teak Frame
    2366, // Riga Fir Frame
    2369, // African Teak Planking
    2371, // Danzic Oak Planking
    2373, // Italian Larch Planking
    2374, // Malabar Teak Planking
    2376, // New England Fir Planking
    2377, // Rangoon Teak Planking
    2378, // Riga Fir Planking
])

export const flipAmountForModule = new Set<ModifierName>(["Leak resistance", "Turn acceleration", "Rudder speed"])

export const notPercentage = new Set<ModifierName>(["Crew with muskets", "Melee attack", "Melee defense", "Morale"])

export const levels = new Map([
    ["Universal", "U"],
    ["Regular", "R"],
    ["LightShips", "S"],
    ["Medium", "M"],
    ["LineShips", "L"],
])

export const isShipTrim = (module: ModuleConvertEntity) =>
    module.usageType === "All" &&
    module.sortingOverrideTemplateType === "hidden" &&
    module.moduleLevel === moduleLevelUniversal &&
    module.moduleType === "Hidden"

export const isPerk = (module: ModuleConvertEntity) =>
    module.usageType === "All" &&
    module.sortingOverrideTemplateType === "" &&
    module.moduleLevel === moduleLevelUniversal &&
    module.moduleType === "Hidden"
