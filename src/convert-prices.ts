import type { APIItemGeneric } from "./@types/api-item.js"
import type { PriceWood } from "./@types/prices.js"
import { getApiItems } from "./common/common.js"
import { defaultPortTax } from "./common/constants.js"
import { saveJsonAsync } from "./common/file.js"
import { round } from "./common/format.js"
import { getCommonPaths } from "./common/path.js"
import { sortBy } from "./common/sort.js"

let apiItems: APIItemGeneric[]

const getLogId = (name: string) => {
    const baseName = name.replace(" Planking", "").replace(" Frame", "")
    let logName = baseName

    const logItem = apiItems.find((item) => !item.NotUsed && item.Name === logName)
    if (logItem !== undefined) {
        return logItem.Id
    }

    logName = `${baseName} Log`
    return apiItems.find((item) => !item.NotUsed && item.Name === logName)?.Id
}

const getPrices = (): PriceWood[] => {
    const resourceIds = new Set(
        apiItems.filter((item) => !item.NotUsed && item.SortingGroup === "Resource.Resources").map((item) => item.Id),
    )

    let prices = [...resourceIds].map((id): PriceWood => {
        const item = apiItems.find((item) => item.Id === id)

        return {
            id,
            name: item?.Name ?? "",
            reales: round((item?.BasePrice ?? 0) * (1 + defaultPortTax), 2),
        }
    })

    // add planking and frame
    const plankingOrFrameIds = new Set(
        apiItems
            .filter((item) => !item.NotUsed && (item.Name.endsWith(" Planking") || item.Name.endsWith(" Frame")))
            .map((item) => ({
                id: item.Id,
                logId: getLogId(item.Name),
                name: item.Name,
            })),
    )

    prices = [
        ...prices,
        ...[...plankingOrFrameIds].map(({ id, logId, name }): PriceWood => {
            const item = apiItems.find((item) => item.Id === logId)

            return {
                id,
                name,
                reales: round((item?.BasePrice ?? 0) * (1 + defaultPortTax), 2),
            }
        }),
    ]

    return prices.sort(sortBy(["id"]))
}

const convertWoodPrices = async (): Promise<void> => {
    const commonPaths = getCommonPaths()
    const prices = getPrices()
    await saveJsonAsync(commonPaths.filePrices, prices)
}

export const convertPrices = async (): Promise<void> => {
    apiItems = getApiItems()

    await convertWoodPrices()
}
