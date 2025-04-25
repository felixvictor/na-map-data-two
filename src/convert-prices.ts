import type { APIItemGeneric } from "./@types/api-item.js"
import type { PriceWood } from "./@types/prices.js"
import { getApiItems } from "./common/common.js"
import { defaultPortTax } from "./common/constants.js"
import { saveJsonAsync } from "./common/file.js"
import { round } from "./common/format.js"
import { getCommonPaths } from "./common/path.js"
import { sortBy } from "./common/sort.js"

let apiItems: APIItemGeneric[]

const getPrices = (): PriceWood[] => {
    const resourceIds = new Set(
        apiItems.filter((item) => !item.NotUsed && item.SortingGroup === "Resource.Resources").map((item) => item.Id),
    )

    return [...resourceIds]
        .map((id): PriceWood => {
            const item = apiItems.find((item) => item.Id === id)

            return {
                id,
                name: item?.Name ?? "",
                reales: round((item?.BasePrice ?? 0) * (1 + defaultPortTax), 2),
            }
        })
        .sort(sortBy(["id"]))
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
