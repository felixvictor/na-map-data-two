import type { PointTuple } from "./coordinates.js"
import type { AttackerNationShortName, PortBattleNationShortName } from "./nations.js"

export type TradingCompany = 0 | 1 | 2
export type LaborHoursDiscount = 0 | 1 | 2
export type GoodList = number[]
export interface PortPerServer {
    id: number
    nation: PortBattleNationShortName
    capturer?: string
    captured?: string
    portBattleStartTime: number
    isAvailableForAll: boolean
    isCapturable: boolean
    portTax: number
    taxIncome: number
    netIncome: number
    tradingCompany: TradingCompany
    laborHoursDiscount: LaborHoursDiscount
    dropsTrading?: GoodList
    consumesTrading?: GoodList
    producesNonTrading?: GoodList
    dropsNonTrading?: GoodList
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

type PortIntersection =
    | boolean
    | number
    | string
    | undefined
    | GoodList
    | PointTuple
    | (string | InventoryEntity | TradeGoodProfit)[]
// eslint-disable-next-line @typescript-eslint/consistent-indexed-object-style
export interface Port extends PortBasic, PortPerServer, PortBattlePerServer {
    [index: string]: PortIntersection
}

export interface TradeProfit {
    profit: number
    profitPerTon: number
}

export interface TradeGoodProfit {
    name: string
    profit: TradeProfit
}
export interface PortWithTrades extends Port {
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
}
