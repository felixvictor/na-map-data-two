interface Chest {
    id: number
    name: string
    weight: number
    lifetime: number
    itemGroup: ChestGroup[]
}
export interface ChestGroup {
    chance: number
    items: ChestItem[]
}
export interface ChestItem {
    id: number
    name: string
    group: number
    amount?: ChestAmount
}
interface ChestAmount {
    min: number
    max: number
}
