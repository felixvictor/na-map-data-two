import type { CannonFamily, CannonType, PeneDistance } from "./cannons.js"

// Cannons
export const cannonType = ["medium", "long", "carronade"]
export const cannonFamilyList: Record<CannonType, CannonFamily[]> = {
    medium: ["regular", "congreve", "defense", "edinorog"],
    long: ["regular", "navy", "blomefield"],
    carronade: ["regular", "obusiers"],
}
export const peneDistance: PeneDistance = {
    medium: [100, 750, 1000, 1250, 1500],
    long: [100, 1000, 1250, 1500],
    carronade: [100, 400, 500, 750, 1000, 1500],
}

// Loot
export const lootType = ["item", "loot", "chest", "fish"]

// Woods
export const woodFamily = ["regular", "seasoned", "rare"]
export const woodType = ["frame", "trim"]
