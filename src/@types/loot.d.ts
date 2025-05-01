import type { lootType } from "./constants.js"

export type LootType = (typeof lootType)[number]
export type LootTypeList<T> = Record<LootType, T>
export type Loot = LootTypeList<LootLootEntity[] | LootChestsEntity[]>
interface LootGenericEntity {
    id: number
    name: string
}
interface LootLootEntity extends LootGenericEntity {
    items: LootLootItemsEntity[]
}
interface LootChestsEntity extends LootGenericEntity {
    weight: number
    lifetime: number
    itemGroup: LootChestGroup[]
}
export interface LootChestGroup {
    chance: number
    items: LootChestItemsEntity[]
}
export interface LootChestItemsEntity {
    id: number
    name: string
    amount?: LootAmount
}
export interface LootLootItemsEntity extends LootChestItemsEntity {
    chance: number
    group: number
}
interface LootAmount {
    min: number
    max: number
}
