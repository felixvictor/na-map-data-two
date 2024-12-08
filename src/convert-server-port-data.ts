import path from "node:path"

import { group as d3Group } from "d3-array"

import type { APIItemGeneric } from "./@types/api-item.js"
import type { APIPort } from "./@types/api-port.js"
import type { APIShop } from "./@types/api-shop.js"
import type { Distance } from "./@types/coordinates.js"
import type { NationList, NationShortName } from "./@types/nations.js"
import type { InventoryEntity, PortBattlePerServer, PortPerServer } from "./@types/ports.js"
import type { Trade, TradeItem } from "./@types/trade.js"
import { cleanItemName, cleanName } from "./common/api.js"
import { getAPIFilename, readJson, saveJsonAsync } from "./common/file.js"
import { findNationById, findNationShortNameById, nationShortName, nations } from "./common/nation.js"
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
const frontlinePorts = 2

let apiItems: APIItemGeneric[]
let apiPorts: APIPort[]
let apiShops: APIShop[]

const commonPaths = getCommonPaths()
const distancesFile = commonPaths.fileDistances
const distancesOrig = readJson(distancesFile) as Distance[]
let distances: Map<number, number>
let numberPorts: number

let portData: PortPerServer[]
let itemNames: Map<number, Item>
let itemWeights: Map<number, number>

const getDistance = (fromPortId: number, toPortId: number): number =>
    fromPortId < toPortId
        ? (distances.get(fromPortId * numberPorts + toPortId) ?? 0)
        : (distances.get(toPortId * numberPorts + fromPortId) ?? 0)

const getPriceTierQuantity = (id: number): number => apiItems.find((item) => item.Id === id)?.PriceTierQuantity ?? 0

const isTradeItem = (item: APIItemGeneric): boolean =>
    item.SortingGroup === "Resource.Trading" || item.Name === "American Cotton" || item.Name === "Tobacco"

/**
 *
 * @param apiPort - Port data
 */
const setPortFeaturePerServer = (apiPort: APIPort): void => {
    const portShop = apiShops.find((shop) => shop.Id === apiPort.Id)

    if (portShop) {
        const portFeaturesPerServer = {
            id: Number(apiPort.Id),
            portBattleStartTime: apiPort.PortBattleStartTime,
            availableForAll: apiPort.AvailableForAll,
            capturable: !apiPort.NonCapturable,
            conquestMarksPension: apiPort.ConquestMarksPension,
            portTax: Math.round(apiPort.PortTax * 100) / 100,
            taxIncome: apiPort.LastTax,
            netIncome: apiPort.LastTax - apiPort.LastCost,
            tradingCompany: apiPort.TradingCompany,
            laborHoursDiscount: apiPort.LaborHoursDiscount,
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
            inventory: portShop.RegularItems.filter((good) => itemNames.get(good.TemplateId)?.itemType !== "Cannon")
                .map(
                    (good) =>
                        ({
                            id: good.TemplateId,
                            buyQuantity: good.Quantity === -1 ? good.BuyContractQuantity : good.Quantity,
                            buyPrice: Math.round(good.BuyPrice * (1 + apiPort.PortTax)),
                            sellPrice: Math.round(good.SellPrice / (1 + apiPort.PortTax)),
                            sellQuantity:
                                good.SellContractQuantity === -1
                                    ? getPriceTierQuantity(good.TemplateId)
                                    : good.SellContractQuantity,
                        }) as InventoryEntity,
                )
                .sort(sortBy(["id"])),
        } as PortPerServer

        // Delete empty entries
        for (const type of ["dropsTrading", "consumesTrading", "producesNonTrading", "dropsNonTrading"]) {
            if ((portFeaturesPerServer[type] as string[]).length === 0) {
                // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
                delete portFeaturesPerServer[type]
            }
        }

        portData.push(portFeaturesPerServer)
    }
}

const setAndSavePortData = async (serverName: string): Promise<void> => {
    for (const apiPort of apiPorts) {
        setPortFeaturePerServer(apiPort)
    }

    await saveJsonAsync(`${commonPaths.dirGenServer}/${serverName}-ports.json`, portData.sort(sortBy(["id"])))
}

const setAndSaveTradeData = async (serverName: string): Promise<void> => {
    const trades: Trade[] = []
    for (const buyPort of portData) {
        for (const buyGood of buyPort.inventory.filter((buyGood) => buyGood.buyQuantity > 0)) {
            const { buyPrice, buyQuantity, id: buyGoodId } = buyGood
            for (const sellPort of portData) {
                const sellGood = sellPort.inventory.find((good) => good.id === buyGoodId)
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

    await saveJsonAsync(path.resolve(commonPaths.dirGenServer, `${serverName}-trades.json`), trades)
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

    await saveJsonAsync(path.resolve(commonPaths.dirGenServer, `${serverName}-items.json`), items)
}

const setAndSavePortBattleData = async (serverName: string): Promise<void> => {
    const pb = apiPorts
        .map((port) => {
            const portData = {
                id: Number(port.Id),
                name: cleanName(port.Name),
                nation: findNationShortNameById(port.Nation),
            } as PortBattlePerServer

            if (port.Capturer !== "") {
                portData.capturer = port.Capturer
            }

            if (port.LastPortBattle > 0) {
                portData.captured = getTimeFromTicks(port.LastPortBattle)
            } else if (port.LastRaidStartTime > 0) {
                portData.captured = getTimeFromTicks(port.LastRaidStartTime)
                portData.capturer = "RAIDER"
            }

            return portData
        })
        .sort(sortBy(["id"]))

    await saveJsonAsync(path.resolve(commonPaths.dirGenServer, `${serverName}-pb.json`), pb)
}

const setAndSaveFrontlines = async (serverName: string): Promise<void> => {
    interface DistanceExtended {
        [index: string]: number | string
        fromPortId: number
        fromPortName: string
        toPortId: number
        toPortName: string
        toPortNation: NationShortName
        distance: number
    }

    interface FANToPort {
        key: number // To port id
        value: number[] | undefined
    }

    interface FANFromPort {
        key: number // From port id
        value: FANValue[] | undefined
    }

    interface FANValue {
        id: number
        nation: NationShortName
    }

    interface FDNPort {
        key: number // From port id
        value: number[] // Port ids
    }

    const outNations = new Set(["NT"])
    const frontlineAttackingNationGroupedByToPort = {} as NationList<FANToPort[]>
    const frontlineAttackingNationGroupedByFromPort = {} as NationList<FANFromPort[]>

    const filteredNations = nations.filter(({ short: nationShort }) => !outNations.has(nationShort))
    for (const { id: nationId, short: nationShortName } of filteredNations) {
        const frontlinesFrom = apiPorts
            .filter(
                ({ Nation: fromPortNation }) =>
                    fromPortNation === nationId || fromPortNation === 0 || fromPortNation === 9,
            )

            .flatMap((fromPort) =>
                apiPorts
                    // toPort must be a capturable port from a nation other than fromNation
                    .filter((toPort) => !toPort.NonCapturable && toPort.Nation !== fromPort.Nation)
                    .map(
                        (toPort) =>
                            ({
                                fromPortId: Number(fromPort.Id),
                                fromPortName: fromPort.Name,
                                toPortId: Number(toPort.Id),
                                toPortName: toPort.Name,
                                toPortNation: findNationById(toPort.Nation)?.short,
                                distance: getDistance(Number(fromPort.Id), Number(toPort.Id)),
                            }) as DistanceExtended,
                    )
                    .sort(sortBy(["distance"]))
                    .slice(0, frontlinePorts),
            )

        frontlineAttackingNationGroupedByToPort[nationShortName] = [
            ...d3Group(frontlinesFrom, (d) => Number(d.toPortId)),
            // ...d3Group(frontlinesFrom, (d) => `${d.toPortId} ${d.toPortName}`),
        ]
            .map(([key, value]) => ({
                key,
                value: value.map((port) => port.fromPortId),
                // value: value.map((port) => [port.fromPortId, port.fromPortName, port.distance]),
            }))
            .sort(sortBy(["key"]))

        frontlineAttackingNationGroupedByFromPort[nationShortName] = [
            ...d3Group(frontlinesFrom, (d) => Number(d.fromPortId)),
            // ...d3Group(frontlinesFrom, (d) => `${d.fromPortId} ${d.fromPortName}`),
        ]
            .map(([key, value]) => ({
                key,
                value: value.map(
                    (port) =>
                        ({
                            id: port.toPortId,
                            nation: port.toPortNation,
                        }) as FANValue,
                ),
            }))
            .sort(sortBy(["key"]))
    }

    const frontlineDefendingNationMap = new Map<string, Set<string>>()
    for (const attackingNation of nationShortName) {
        if (Object.hasOwn(frontlineAttackingNationGroupedByFromPort, attackingNation)) {
            for (const fromPort of frontlineAttackingNationGroupedByFromPort[attackingNation]) {
                if (fromPort.value) {
                    for (const toPort of fromPort.value) {
                        const key = String(toPort.nation) + String(toPort.id)
                        let fromPorts = frontlineDefendingNationMap.get(key)

                        if (fromPorts) {
                            fromPorts.add(String(fromPort.key))
                        } else {
                            fromPorts = new Set([String(fromPort.key)])
                        }

                        frontlineDefendingNationMap.set(key, fromPorts)
                    }
                }
            }
        }
    }

    const frontlineDefendingNation = {} as NationList<FDNPort[]>
    for (const [key, fromPorts] of frontlineDefendingNationMap) {
        const nationShortName = key.slice(0, 2)
        const toPortId = Number(key.slice(2))
        if (!Object.hasOwn(frontlineDefendingNation, nationShortName)) {
            // if (Object.keys(frontlineDefendingNation[nationShortName]).length === 0) {
            frontlineDefendingNation[nationShortName] = []
        }

        frontlineDefendingNation[nationShortName].push({
            key: toPortId,
            value: [...fromPorts].map((element) => Number(element)),
        })
        // frontlineDefendingNation[nationShortName].push({ key: toPortId, value: [...fromPorts] });
    }

    await saveJsonAsync(path.resolve(commonPaths.dirGenServer, `${serverName}-frontlines.json`), {
        attacking: frontlineAttackingNationGroupedByToPort,
        defending: frontlineDefendingNation,
    })
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

        await setAndSavePortData(serverName)
        await setAndSaveTradeData(serverName)
        await setAndSaveDroppedItems(serverName)
        await setAndSavePortBattleData(serverName)
        await setAndSaveFrontlines(serverName)
    }
}
