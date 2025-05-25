interface TradePrice {
    id: number
    grossPrice: number
}
export interface Trade {
    good: number
    source: TradePrice
    target: TradePrice
    distance: number
    profitTotal: number
    quantity: number
    weightPerItem: number
    profit?: number
}
export interface TradeItem {
    id: number
    name: string
    basePrice: number
    distanceFactor?: number
    weight?: number
}
