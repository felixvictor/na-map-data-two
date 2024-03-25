import type { ObjectIndexer } from "./index.js"

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface ShipData extends ObjectIndexer<any> {
    battleRating: number
    boarding: ShipBoarding
    bow: ShipHealth
    class: number
    crew: ShipCrew
    gunnery?: ShipGunnery
    guns: ShipGuns
    holdSize: number
    id: number
    mast: ShipMast
    maxWeight: number
    name: string
    premium: boolean
    pump: ShipStructureOrPump
    repairTime: ShipRepairTime
    repairAmount?: ShipRepairAmount
    resistance?: ShipResistance
    rudder: ShipRudder
    sails: ShipSails
    ship: ShipShip
    shipMass: number
    sides: ShipHealth
    speed: ShipSpeed
    speedDegrees: number[]
    stern: ShipHealth
    structure: ShipStructureOrPump
    tradeShip: boolean
    upgradeXP: number
}
interface ShipBoarding {
    prepInitial: number
    prepPerRound: number
    attack?: number
    cannonsAccuracy?: number
    defense?: number
    disengageTime?: number
    morale?: number
    musketsAccuracy?: number
    musketsCrew?: number
}
interface ShipGunnery {
    dispersionHorizontal: number
    dispersionVertical: number
    penetration: number
    reload: number
    traverseUpDown: number
    traverseSide: number
}
interface ShipGunneryDispersion {
    horizontal: number
    vertical: number
}
interface ShipGunneryTraverse {
    upDown: number
    side: number
}
interface ShipGuns {
    total: number
    decks: number
    damage: ShipBroadsideDamage
    gunsPerDeck: ShipGunDeck[]
    weight: ShipGunWeight
}
interface ShipGunDeck {
    amount: number
    maxCannonLb: number
    maxCarroLb: number
}
interface ShipBroadsideDamage {
    cannons: number
    carronades: number
}
interface ShipGunWeight {
    cannons: number
    carronades: number
}
interface ShipCrew {
    min: number
    max: number
    sailing: number
    cannons: number
    carronades: number
}
interface ShipSpeed {
    min: number
    max: number
}
interface ShipHealth {
    armour: number
    thickness: number
}
interface ShipStructureOrPump {
    armour: number
}
interface ShipSails {
    armour: number
    risingSpeed: number
}
interface ShipRudder {
    armour: number
    halfturnTime: number
    thickness: number
}
interface ShipRepairAmount {
    armour: number
    armourPerk: number
    sails: number
    sailsPerk: number
}
interface ShipRepairTime {
    stern: number
    bow: number
    sides: number
    rudder: number
    sails: number
    structure: number
    default?: number
}
interface ShipResistance {
    leaks: number
    splinter: number
}
interface ShipShip {
    acceleration: number
    deceleration: number
    firezoneHorizontalWidth: number
    rollAngle: number
    turnAcceleration: number
    turnSpeed: number
    waterlineHeight: number
    yardTurningAcceleration: number
}
interface ShipMast {
    bottomArmour: number
    middleArmour: number
    topArmour: number
    bottomThickness: number
    middleThickness: number
    topThickness: number
}

export interface ShipBlueprint {
    id: number
    name: string
    wood: ShipBlueprintResource[]
    resources: ShipBlueprintResource[]
    provisions: number
    price: number
    permit: number
    ship: ShipBlueprintShip
    shipyardLevel: number
    craftLevel: number
    craftXP: number
}
interface ShipBlueprintResource {
    name: string
    amount: number
}
interface ShipBlueprintShip {
    id: number
    name: string
    mass: number
}
