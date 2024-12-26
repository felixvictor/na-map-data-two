import path from "node:path"

import type { Feature, FeatureCollection, Point, Position } from "geojson"

import type { APIItemGeneric } from "./@types/api-item.js"
import type { APIPort } from "./@types/api-port.js"
import type { APIShop } from "./@types/api-shop.js"
import type { Distance } from "./@types/coordinates.js"
import type { InventoryEntity, PortInventory, PortPerServer } from "./@types/ports.js"
import type { Trade, TradeItem } from "./@types/trade.js"
import { cleanItemName, cleanName } from "./common/api.js"
import { convertCoordX, convertCoordY, coordinateAdjust } from "./common/coordinates.js"
import { getAPIFilename, readJson, saveJsonAsync } from "./common/file.js"
import { findNationShortNameById } from "./common/nation.js"
import { getCommonPaths } from "./common/path.js"
import { serverIds } from "./common/servers.js"
import { simpleNumberSort, sortBy } from "./common/sort.js"
import { getTimeFromTicks, currentServerStartDate as serverDate } from "./common/time.js"

interface Item {
    name: string
    weight: number
    itemType: string
    trading: boolean
    buyPrice: number
}

const rareWoodIds = new Set([
    807, // Malabar Teak
    863, // Rangoon Teak
    1440, // Greenheart
    1894, // Danzic Oak
    1895, // African Oak
    1896, // Riga Fir
    1898, // New England Fir
    1900, // African Teak
    1901, // Italian Larch
])

const minProfit = 30_000
const minTaxIncomeToShow = 100_000

let apiItems: APIItemGeneric[] = []
let apiPorts: APIPort[] = []
let apiShops: APIShop[] = []

const commonPaths = getCommonPaths()
const distancesFile = commonPaths.fileDistances
const distancesOrig = readJson(distancesFile) as Distance[]
let distances: Map<number, number>
let numberPorts: number
let coordinatesMap: Map<number, Position>

let portData: PortPerServer[]
let itemNames: Map<number, Item>
let itemWeights: Map<number, number>
let inventories: PortInventory[] = []
const portTaxMap = new Map<string, number>()

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const getPortShop = (portId: string) => apiShops.find((shop) => shop.Id === portId)!

const getDistance = (fromPortId: number, toPortId: number): number =>
    fromPortId < toPortId
        ? (distances.get(fromPortId * numberPorts + toPortId) ?? 0)
        : (distances.get(toPortId * numberPorts + fromPortId) ?? 0)

const getPriceTierQuantity = (id: number): number => apiItems.find((item) => item.Id === id)?.PriceTierQuantity ?? 0

const isTradeItem = (item: APIItemGeneric): boolean =>
    item.SortingGroup === "Resource.Trading" || item.Name === "American Cotton" || item.Name === "Tobacco"

const setPortFeaturePerServer = (apiPort: APIPort): void => {
    const portShop = getPortShop(apiPort.Id)

    const portFeaturesPerServer = {
        id: Number(apiPort.Id),
        nation: findNationShortNameById(apiPort.Nation),
        portBattleStartTime: apiPort.PortBattleStartTime,
        isAvailableForAll: apiPort.AvailableForAll,
        isCapturable: !apiPort.NonCapturable,
        conquestMarksPension: apiPort.ConquestMarksPension,
        portTax: Math.round(apiPort.PortTax * 100) / 100,
        taxIncome: apiPort.LastTax,
        netIncome: apiPort.LastTax - apiPort.LastCost,
        tradingCompany: apiPort.TradingCompany,
        laborHoursDiscount: apiPort.LaborHoursDiscount,
    } as Partial<PortPerServer>

    if (apiPort.Capturer !== "") {
        portFeaturesPerServer.capturer = apiPort.Capturer
    }

    if (apiPort.LastPortBattle > 0) {
        portFeaturesPerServer.captured = getTimeFromTicks(apiPort.LastPortBattle)
    } else if (apiPort.LastRaidStartTime > 0) {
        portFeaturesPerServer.captured = getTimeFromTicks(apiPort.LastRaidStartTime)
        portFeaturesPerServer.capturer = "RAIDER"
    }

    portTaxMap.set(apiPort.Id, portFeaturesPerServer.portTax ?? 0)

    const trades = {
        dropsTrading: [
            ...new Set(
                portShop.ResourcesAdded.filter((good) =>
                    itemNames.get(good.Template) ? itemNames.get(good.Template)?.trading : true,
                ).map((good) => good.Template),
            ),
        ].sort(simpleNumberSort),
        consumesTrading: [
            ...new Set(
                portShop.ResourcesConsumed.filter((good) =>
                    itemNames.get(good.Key) ? itemNames.get(good.Key)?.trading : true,
                ).map((good) => good.Key),
            ),
        ].sort(simpleNumberSort),
        producesNonTrading: [
            ...new Set(
                portShop.ResourcesProduced.filter((good) => {
                    return itemNames.get(good.Key) ? !itemNames.get(good.Key)?.trading : false
                }).map((good) => good.Key),
            ),
        ].sort(simpleNumberSort),
        dropsNonTrading: [
            ...new Set(
                portShop.ResourcesAdded.filter((good) =>
                    !rareWoodIds.has(good.Template) && itemNames.get(good.Template)
                        ? !itemNames.get(good.Template)?.trading
                        : false,
                ).map((good) => good.Template),
            ),
        ].sort(simpleNumberSort),
    }

    for (const [key, values] of Object.entries(trades)) {
        if (values.length > 0) {
            portFeaturesPerServer[key] = values
        }
    }

    portData.push(portFeaturesPerServer as PortPerServer)
}

const setAndSavePortData = async (serverName: string): Promise<void> => {
    for (const apiPort of apiPorts) {
        setPortFeaturePerServer(apiPort)
    }

    await saveJsonAsync(`${commonPaths.directoryGenServer}/${serverName}-ports.json`, portData.sort(sortBy(["id"])))
}

const setAndSaveInventory = async (serverName: string): Promise<void> => {
    inventories = apiPorts
        .map((port) => {
            const portShop = getPortShop(port.Id)

            return {
                id: Number(port.Id),
                inventory: portShop.RegularItems.filter((good) => itemNames.get(good.TemplateId)?.itemType !== "Cannon")
                    .map(
                        (good) =>
                            ({
                                id: good.TemplateId,
                                buyQuantity: good.Quantity === -1 ? good.BuyContractQuantity : good.Quantity,
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                buyPrice: Math.round(good.BuyPrice * (1 + portTaxMap.get(port.Id)!)),
                                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                                sellPrice: Math.round(good.SellPrice / (1 + portTaxMap.get(port.Id)!)),
                                sellQuantity:
                                    good.SellContractQuantity === -1
                                        ? getPriceTierQuantity(good.TemplateId)
                                        : good.SellContractQuantity,
                            }) as InventoryEntity,
                    )
                    .sort(sortBy(["id"])),
            } as PortInventory
        })
        .sort(sortBy(["id"]))

    await saveJsonAsync(path.resolve(commonPaths.directoryGenServer, `${serverName}-inventories.json`), inventories)
}

const setAndSaveTradeData = async (serverName: string): Promise<void> => {
    const trades: Trade[] = []
    for (const buyPort of portData) {
        //inventories
        const buyGoods = inventories.find((inventory) => inventory.id === buyPort.id)?.inventory ?? []
        for (const buyGood of buyGoods.filter((buyGood) => buyGood.buyQuantity > 0)) {
            const { buyPrice, buyQuantity, id: buyGoodId } = buyGood
            for (const sellPort of portData) {
                const sellGoods = inventories.find((inventory) => inventory.id === sellPort.id)?.inventory ?? []
                const sellGood = sellGoods.find((good) => good.id === buyGoodId)
                if (sellPort.id !== buyPort.id && sellGood) {
                    const { sellPrice, sellQuantity } = sellGood
                    const quantity = Math.min(buyQuantity, sellQuantity)
                    const profitPerItem = sellPrice - buyPrice
                    const profitTotal = profitPerItem * quantity

                    if (profitTotal >= minProfit) {
                        const trade = {
                            good: buyGoodId,
                            source: { id: Number(buyPort.id), grossPrice: buyPrice },
                            target: { id: Number(sellPort.id), grossPrice: sellPrice },
                            distance: getDistance(buyPort.id, sellPort.id),
                            profitTotal,
                            quantity,
                            weightPerItem: itemWeights.get(buyGoodId) ?? 0,
                        } as Trade
                        trades.push(trade)
                    }
                }
            }
        }
    }

    trades.sort(sortBy(["profitTotal"]))

    await saveJsonAsync(path.resolve(commonPaths.directoryGenServer, `${serverName}-trades.json`), trades)
}

const setAndSaveDroppedItems = async (serverName: string): Promise<void> => {
    const allowedItems = new Set([
        600, // Labor Contracts
        988, // Combat Medal
        1009, // Perks Reset Permit
        1537, // Victory Mark
        1758, // Light carriages
        2226, // Ship Logbook
    ])

    const items = apiItems
        .filter((item) => !item.NotUsed && ((item.CanBeSoldToShop && item.BasePrice > 0) || allowedItems.has(item.Id)))
        .map((item) => {
            const tradeItem = {
                id: item.Id,
                name: isTradeItem(item) ? cleanItemName(item.Name) : cleanName(item.Name),
                buyPrice: item.BasePrice,
            } as TradeItem

            if (item.PortPrices.Consumed.SellPrice.Min > 0) {
                tradeItem.sellPrice = item.PortPrices.Consumed.SellPrice.Min
            }

            if (item.PortPrices.RangePct) {
                tradeItem.distanceFactor = item.PortPrices.RangePct
            }

            if (item.ItemWeight) {
                tradeItem.weight = item.ItemWeight
            }

            return tradeItem
        })

    await saveJsonAsync(path.resolve(commonPaths.directoryGenServer, `${serverName}-items.json`), items)
}

const setAndSaveTaxIncome = async (serverName: string): Promise<void> => {
    const features: Feature[] = []

    portData
        .filter((port) => port.taxIncome > minTaxIncomeToShow)
        .map((port) => {
            const feature: Feature<Point> = {
                type: "Feature",
                id: port.id,
                geometry: {
                    type: "Point",
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    coordinates: coordinatesMap.get(port.id)!,
                },
                properties: { taxIncome: port.taxIncome },
            }

            features.push(feature)
        })
    const geoJson: FeatureCollection = { type: "FeatureCollection", features }
    await saveJsonAsync(path.resolve(commonPaths.directoryGenServer, `${serverName}-income.geojson`), geoJson)
}

export const convertServerPortData = async () => {
    for (const serverName of serverIds) {
        apiItems = readJson(getAPIFilename(`${serverName}-ItemTemplates-${serverDate}.json`)) as APIItemGeneric[]
        apiPorts = readJson(getAPIFilename(`${serverName}-Ports-${serverDate}.json`)) as APIPort[]
        apiShops = readJson(getAPIFilename(`${serverName}-Shops-${serverDate}.json`)) as APIShop[]

        /**
         * Item names
         */
        itemNames = new Map(
            apiItems
                .filter((item) => !item.NotUsed)
                .map((item) => [
                    item.Id,
                    {
                        name: cleanName(item.Name),
                        weight: item.ItemWeight,
                        itemType: item.ItemType,
                        buyPrice: item.BasePrice,
                        trading: isTradeItem(item),
                    },
                ]),
        )

        // noinspection OverlyComplexBooleanExpressionJS
        itemWeights = new Map(
            apiItems
                .filter(
                    (apiItem) =>
                        !apiItem.NotUsed &&
                        (!apiItem.NotTradeable || apiItem.ShowInContractsSelector) &&
                        apiItem.ItemType !== "RecipeResource",
                )
                .map((apiItem) => [apiItem.Id, apiItem.ItemWeight]),
        )

        portData = []
        numberPorts = apiPorts.length
        distances = new Map(
            distancesOrig.map(([fromPortId, toPortId, distance]) => [fromPortId * numberPorts + toPortId, distance]),
        )
        coordinatesMap = new Map<number, Position>(
            apiPorts.map((port) => [
                Number(port.Id),
                coordinateAdjust([
                    Math.trunc(convertCoordX(port.Position.x, port.Position.z)),
                    Math.trunc(convertCoordY(port.Position.x, port.Position.z)),
                ]) as Position,
            ]),
        )

        await setAndSavePortData(serverName)
        await setAndSaveInventory(serverName)
        await setAndSaveTradeData(serverName)
        await setAndSaveDroppedItems(serverName)
        await setAndSaveTaxIncome(serverName)
    }
}
