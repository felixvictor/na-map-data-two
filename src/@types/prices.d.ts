export interface Price {
    standard: PriceStandardWood[]
    seasoned: PriceSeasonedWood[]
}
export interface PriceStandardWood {
    id: number
    name: string
    reales: number
}
export interface PriceSeasonedWood {
    id: number
    name: string
    reales: number
    doubloon: number
    tool: number
}
