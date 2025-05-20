import type { CannonFamily, CannonType, PeneDistance } from "./cannons.js"

// Cannons
export const cannonType = ["medium", "long", "carronade"]
export const cannonFamilyList: Record<CannonType, CannonFamily[]> = {
    medium: ["regular", "congreve", "defense", "edinorog"],
    long: ["regular", "navy", "blomefield"],
    carronade: ["regular", "obusiers"],
}
export const peneDistance: PeneDistance = {
    medium: [100, 200, 300, 400, 500, 750, 1000, 1250, 1500],
    long: [100, 500, 750, 1000, 1250, 1500],
    carronade: [100, 200, 300, 400, 500, 750, 1000, 1250, 1500],
}

// Woods
export const woodFamily = ["regular", "seasoned", "rare"]
export const woodType = ["frame", "trim"]

export const moduleLevel = ["L", "M", "S"] as const
export const moduleLevelUniversal = "U"
export type ModuleLevel = (typeof moduleLevel)[number]
