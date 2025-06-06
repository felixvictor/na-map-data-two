import { woodType } from "../@types/constants.js"
import type { APIModifierName, ModuleConvertEntity } from "../@types/modules.js"
import type { WoodJsonData, WoodTrimOrFrame } from "../@types/woods.js"
import { saveJsonAsync } from "../common/file.js"
import { getCommonPaths } from "../common/path.js"
import { sortBy } from "../common/sort.js"
import { flipAmountForModule, modifiers, notPercentage, rareWoodTrimFrameIds } from "./common.js"

const commonPaths = getCommonPaths()

const woods = {} as WoodJsonData

woods.trim = []
woods.frame = []

/**
 * Set wood properties
 * @param module - Module data
 */
export const setWood = (module: ModuleConvertEntity): boolean => {
    const wood = {} as WoodTrimOrFrame
    wood.id = module.id

    wood.properties = module.apiModifiers
        // filter unused modifiers
        .filter((modifier) => {
            const apiModifierName: APIModifierName = `${modifier.Slot} ${modifier.MappingIds.join(",")}`

            return modifiers.get(apiModifierName)
        })
        .map((modifier) => {
            const apiModifierName: APIModifierName = `${modifier.Slot} ${modifier.MappingIds.join(",")}`
            // Add modifier if in modifier map
            const modifierName = modifiers.get(apiModifierName) ?? ""
            let amount = modifier.Percentage
            let isPercentage = true

            if (modifier.Absolute) {
                amount = modifier.Absolute
                isPercentage = false
            }

            // Some modifiers are wrongly indicated as a percentage
            if (notPercentage.has(modifierName)) {
                isPercentage = false
            }

            if (flipAmountForModule.has(modifierName)) {
                amount *= -1
            }

            if (modifierName === "Splinter resistance") {
                amount = Math.round(amount * 100)
                isPercentage = true
            }

            return {
                modifier: modifierName,
                amount,
                isPercentage,
            }
        })

    if (module.name.includes("(S)")) {
        wood.family = "seasoned"
    } else if (rareWoodTrimFrameIds.has(wood.id)) {
        wood.family = "rare"
    } else {
        wood.family = "regular"
    }

    if (module.name.endsWith(" Planking") || module.name === "Crew Space") {
        wood.type = "trim"
        wood.name = module.name.replace(" Planking", "")

        woods.trim.push(wood)
    } else {
        wood.type = "frame"
        wood.name = module.name.replace(" Frame", "")
        woods.frame.push(wood)
    }

    return true
}

export const saveWoods = async () => {
    // Sort by modifier
    for (const type of woodType) {
        for (const wood of woods[type]) {
            wood.properties.sort(sortBy(["modifier"]))
        }

        woods[type].sort(sortBy(["id"]))
    }

    await saveJsonAsync(commonPaths.fileWood, woods)
}
