import type { CannonFamily, CannonType } from "./cannons.js"

// Cannons
export const cannonType = ["medium", "long", "carronade"]
export const cannonFamilyList: Record<CannonType, CannonFamily[]> = {
    medium: ["regular", "congreve", "defense", "edinorog"],
    long: ["regular", "navy", "blomefield"],
    carronade: ["regular", "obusiers"],
}
export const peneDistance = [50, 100, 200, 300, 400, 500, 750, 1000, 1250, 1500]

// Loot
export const lootType = ["item", "loot", "chest", "fish"]

// Woods
export const woodFamily = ["regular", "seasoned", "rare"]
export const woodType = ["frame", "trim"]
