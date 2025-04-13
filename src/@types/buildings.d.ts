export interface Building {
    id: number
    name: string
    result?: BuildingResult[]
    batch?: BuildingBatch
    levels: BuildingLevelsEntity[]
}
export interface BuildingResult {
    id: number
    name: string
    price: number
}
export interface BuildingBatch {
    price: number
    amount: number
}
export interface BuildingLevelsEntity {
    production: number
    maxStorage: number
    price: number
    materials: BuildingMaterialsEntity[]
}
export interface BuildingMaterialsEntity {
    item: string
    amount: number
}
export interface BuildingWithResult {
    id: number
    name: string
    result: BuildingResult[]
    batch?: BuildingBatch
    levels: BuildingLevelsEntity[]
    byproduct?: unknown[]
}
