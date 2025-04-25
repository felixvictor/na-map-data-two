import type { APIItemGeneric } from "./@types/api-item.js"
import type { PriceWood } from "./@types/prices.js"
import { getApiItems } from "./common/common.js"
import { defaultPortTax } from "./common/constants.js"
import { saveJsonAsync } from "./common/file.js"
import { getCommonPaths } from "./common/path.js"
import { sortBy } from "./common/sort.js"

let apiItems: APIItemGeneric[]

const getPrices = (): PriceWood[] => {
    const standardWoods = new Set([
        26, // Fir
        39, // Oak
        44, // Teak
        300, // Live Oak
        894, // Mahogany
        906, // Bermuda Cedar
        1359, // White Oak
    ])
    const rareWoods = new Set([
        807, // Malabar Teak
        863, // Rangoon Teak
        1894, // Danzic Oak
        1895, // African Oak
        1898, // New England Fir
    ])

    return [...standardWoods, ...rareWoods]
        .map((rareWoodId): PriceWood => {
            const rareWood = apiItems.find((item) => item.Id === rareWoodId)

            return {
                id: rareWoodId,
                name: rareWood?.Name ?? "",
                reales: (rareWood?.BasePrice ?? 0) * (1 + defaultPortTax),
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
