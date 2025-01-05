import { InternMap, group } from "d3-array"

import type { ModifiersEntity } from "../@types/api-item.d.ts"
import type { APIModifierName, ModuleConvertEntity, ModuleEntity, ModulePropertiesEntity } from "../@types/modules.d.ts"
import { cCircleWhite, cDashEn, cSpaceNarrowNoBreaking } from "../common/constants.js"
import { saveJsonAsync } from "../common/file.js"
import { capitalizeFirstLetter } from "../common/format.js"
import { getCommonPaths } from "../common/path.js"
import { sortBy } from "../common/sort.js"
import { bonusRegex, flipAmountForModule, modifiers, moduleRate, notPercentage } from "./common.js"

const modules = new Map<string, ModuleEntity>()
const commonPaths = getCommonPaths()

const getModifierName = (modifier: ModifiersEntity): APIModifierName =>
    `${modifier.Slot} ${modifier.MappingIds.join(",")}`

/**
 * Get module type as a combined string
 * @param module - Module data
 * @returns Module object
 */
const getModuleType = (module: ModuleConvertEntity) => {
    let type: string
    const { permanentType, sortingGroup } = module
    const { moduleLevel, moduleType, name, usageType } = module
    let sortingGroupString = ""
    if (usageType === "All" && sortingGroup && moduleLevel === "U" && moduleType === "Hidden") {
        type = "Ship trim"
    } else if (moduleType === "Permanent" && !name.endsWith(" Bonus")) {
        type = "Permanent"
    } else if (usageType === "All" && !sortingGroup && moduleLevel === "U" && moduleType === "Hidden") {
        type = "Perk"
    } else if (moduleType === "Regular") {
        type = "Ship knowledge"
    } else {
        type = "Not used"
    }

    // Correct sorting group
    if (name.endsWith("French Rig Refit") || name === "Bridgetown Frame Refit") {
        sortingGroupString = "survival"
    }

    if (type === "Ship trim") {
        const result = bonusRegex.exec(name)
        sortingGroupString = result ? `${cSpaceNarrowNoBreaking}${cDashEn}${cSpaceNarrowNoBreaking}${result[1]}` : ""
    } else {
        sortingGroupString = sortingGroup
            ? `${cSpaceNarrowNoBreaking}${cDashEn}${cSpaceNarrowNoBreaking}${capitalizeFirstLetter(sortingGroup).replace("_", "/")}`
            : ""
    }

    const permanentTypeString =
        permanentType === "Default"
            ? ""
            : `${cSpaceNarrowNoBreaking}${cCircleWhite}${cSpaceNarrowNoBreaking}${permanentType}`

    console.log({ type }, { sortingGroup }, { permanentType }, `${type}${sortingGroupString}${permanentTypeString}`)

    return {
        type,
        sortingGroup: sortingGroup === "" ? "default" : sortingGroup,
        permanentType: permanentType === "Default" ? "default" : permanentType,
        typeString: `${type}${sortingGroupString}${permanentTypeString}`,
    }
}

/**
 * Get module modifier properties
 * @param APImodifiers - Module modifier data
 * @returns Module modifier properties
 */
const getModuleProperties = (APImodifiers: ModifiersEntity[]): ModulePropertiesEntity[] | undefined => {
    return APImodifiers.filter((modifier) => {
        const apiModifierName = getModifierName(modifier)
        if (!modifiers.has(apiModifierName)) {
            console.log(`${apiModifierName} modifier not defined`, modifier)
            return true
        }

        return modifiers.get(apiModifierName) !== ""
    })
        .flatMap((modifier) => {
            const apiModifierName = getModifierName(modifier)
            const modifierName = modifiers.get(apiModifierName) ?? ""
            let amount = modifier.Percentage
            let isPercentage = true

            if (modifier.Absolute) {
                if (
                    Math.abs(modifier.Absolute) >= 1 ||
                    modifier.MappingIds[0].endsWith("PERCENT_MODIFIER") ||
                    modifier.MappingIds[0] === "REPAIR_PERCENT"
                ) {
                    amount = modifier.Absolute
                    isPercentage = false
                } else {
                    amount = Math.round(modifier.Absolute * 10_000) / 100
                }
            }

            if (flipAmountForModule.has(modifierName)) {
                amount *= -1
            } else if (modifierName === "Splinter resistance") {
                amount = Math.round(modifier.Absolute * 10_000) / 100
                isPercentage = true
            }

            // Some modifiers are wrongly indicated as a percentage
            if (notPercentage.has(modifierName)) {
                isPercentage = false
            }

            // Special case dispersion: split entry up in horizontal and vertical
            if (modifierName === "Cannon horizontal/vertical dispersion") {
                return [
                    {
                        modifier: "Cannon horizontal dispersion",
                        amount,
                        isPercentage,
                    },
                    {
                        modifier: "Cannon vertical dispersion",
                        amount,
                        isPercentage,
                    },
                ]
            }

            return {
                modifier: modifierName,
                amount,
                isPercentage,
            }
        })
        .sort(sortBy(["modifier"]))
}

export const setModule = (module: ModuleConvertEntity): boolean => {
    let dontSave = false

    module.properties = getModuleProperties(module.ApiModifiers)
    const typeObject = getModuleType(module)
    module = { ...module, ...typeObject }

    for (const rate of moduleRate) {
        for (const name of rate.names) {
            if (module.name.endsWith(name)) {
                module.name = module.name.replace(name, "")
                module.moduleLevel = rate.level
            }
        }
    }

    const rateExceptions = new Set([
        "Apprentice Carpenters",
        "Journeyman Carpenters",
        "Navy Carpenters",
        "Northern Carpenters",
        "Northern Master Carpenters",
        "Navy Mast Bands",
        "Navy Orlop Refit",
    ])

    if (rateExceptions.has(module.name)) {
        module.moduleLevel = "U"
    }

    const nameExceptions = new Set([
        "Cannon nation module - France",
        "Coward",
        "Doctor",
        "Dreadful",
        "Expert Surgeon",
        "Frigate Master",
        "Gifted",
        "Light Ship Master",
        "Lineship Master",
        "Press Gang",
        "Signaling",
        "Thrifty",
    ])
    if (
        nameExceptions.has(module.name) ||
        (module.name === "Optimized Rudder" && module.moduleLevel !== "U") ||
        module.typeString.startsWith("Not used") ||
        module.name.startsWith("TEST") ||
        module.name.endsWith(" - OLD") ||
        module.name.endsWith("TEST")
    ) {
        dontSave = true
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { ApiModifiers, moduleType, ...cleanedModule } = module
    modules.set(cleanedModule.name + cleanedModule.moduleLevel, dontSave ? ({} as ModuleEntity) : cleanedModule)

    return !dontSave
}

// @{link: https://www.geeksforgeeks.org/how-to-convert-a-map-to-json-string-in-javascript/}
const mapToJson = (map: InternMap) => {
    const object = {}
    for (const [key, value] of map) {
        object[key] = value instanceof InternMap ? mapToJson(value) : value
    }
    return object
}

export const saveModules = async () => {
    // Get the non-empty setModules and sort
    const result = [...modules.values()]
        .filter((module) => Object.keys(module).length > 0)
        .sort(sortBy(["typeString", "id"]))

    // Group by type
    const modulesGrouped = group(
        result,
        (module: ModuleEntity) => module.type,
        (module: ModuleEntity) => module.sortingGroup,
        (module: ModuleEntity) => module.permanentType,
    )

    await saveJsonAsync(commonPaths.fileModules, mapToJson(modulesGrouped))
}
