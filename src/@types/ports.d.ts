import type { PointTuple } from "./coordinates.js"
import type { PortBattleNationShortName } from "./nations.js"

export type GoodList = number[]

export interface PortPerServer {
    id: number
    nation: PortBattleNationShortName
    capturer?: string
    captured?: string
    portBattleStartTime: number
    raiderAttackTime?: string
    isAvailableForAll: boolean
    isCapturable: boolean
    isCountyCapital: boolean
    portTax: number
    taxIncome: number
    dropsTradeItem?: GoodList
    dropsResource?: GoodList
}

export interface PortInventory {
    id: number
    inventory: InventoryEntity[]
}

export interface InventoryEntity {
    id: number
    buyQuantity: number
    buyPrice: number
    sellPrice: number
    sellQuantity: number
}

export type PortBattleType = "Small" | "Medium" | "Large"
export interface PortBasic {
    id: number
    name: string
    coordinates: PointTuple
    angle: number
    region: string
    countyCapitalName: string
    county: string
    countyCapital: boolean
    shallow: boolean
    brLimit: number
    portPoints: number
    portBattleType: PortBattleType
}

export type Port = PortBasic & PortPerServer

export interface TradeProfit {
    profit: number
    profitPerTon: number
}

export interface TradeGoodProfit {
    name: string
    profit: TradeProfit
}
export interface PortTrades {
    tradePortId: number
    sailingDistanceToTradePort: number
    goodsToBuyInTradePort: TradeGoodProfit[]
    buyInTradePort: boolean
    goodsToSellInTradePort: TradeGoodProfit[]
    sellInTradePort: boolean
    distance?: number
    isSource: boolean
    ownPort: boolean
    enemyPort: boolean
}

export interface PbZone {
    id: number
    position: PointTuple
    pbCircles: PointTuple[]
    forts: PointTuple[]
    towers: PointTuple[]
    joinCircle: PointTuple
    spawnPoints: PointTuple[]
    raidCircles: PointTuple[]
    raidPoints: PointTuple[]
}
