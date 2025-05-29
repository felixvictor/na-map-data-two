import type { ModifiersEntity } from "../@types/api-item.d.ts"
import { moduleLevel, moduleLevelUniversal } from "../@types/constants.js"
import type {
    APIModifierName,
    ModuleConvertEntity,
    ModuleEntityFlatHierarchy,
    ModuleEntityProperties,
} from "../@types/modules.d.ts"
import { levelDivider } from "../common/api.js"
import { cCircleWhite, cDashEn, cSpaceNarrowNoBreaking } from "../common/constants.js"
import { saveJsonAsync } from "../common/file.js"
import { capitalizeFirstLetter } from "../common/format.js"
import { getCommonPaths } from "../common/path.js"
import { sortBy } from "../common/sort.js"
import { flipAmountForModule, modifiers, notPercentage } from "./common.js"

const commonPaths = getCommonPaths()

const moduleEntityFlatHierarchy = new Map<string, ModuleEntityFlatHierarchy>()
const rootName = "0-root"
const branchName = "1-branch"

const getModifierName = (modifier: ModifiersEntity): APIModifierName =>
    `${modifier.Slot} ${modifier.MappingIds.join(",")}`

/**
 * Get module type as a combined string
 * @param module - Module data
 * @returns Module object
 */
const setModuleTypeHierarchy = (module: ModuleConvertEntity) => {
    let level1: string
    const { permanentType, sortingGroup } = module
    const { moduleLevel, moduleType, name: moduleName, usageType } = module

    if (usageType === "All" && sortingGroup && moduleLevel === moduleLevelUniversal && moduleType === "Hidden") {
        level1 = "Ship trim"
    } else if (moduleType === "Permanent") {
        level1 = "Permanent"
    } else if (
        usageType === "All" &&
        !sortingGroup &&
        moduleLevel === moduleLevelUniversal &&
        moduleType === "Hidden"
    ) {
        level1 = "Perk"
    } else if (moduleType === "Regular") {
        level1 = "Ship knowledge"
    } else {
        level1 = "Not used"
    }

    // Correct sorting group
    let level2 = sortingGroup
    if (level1 === "Ship trim") {
        level2 = ""
    } else {
        level2 = sortingGroup ? capitalizeFirstLetter(sortingGroup).replace("_", "/") : ""
    }

    const level3 = permanentType === "Default" ? "" : (permanentType ?? "")

    let levelAll = level1
    if (level2 !== "") {
        levelAll = `${levelAll}${cSpaceNarrowNoBreaking}${cDashEn}${cSpaceNarrowNoBreaking}${level2}`
    }
    if (level3 !== "") {
        levelAll = `${levelAll}${cSpaceNarrowNoBreaking}${cCircleWhite}${cSpaceNarrowNoBreaking}${level3}`
    }

    let parentString = level1
    if (level2 !== "") {
        parentString = `${level1}-${level2}`
        moduleEntityFlatHierarchy.set(parentString, {
            name: level2,
            hierarchyName: parentString,
            parentString: level1,
            hierarchyString: branchName,
        })
    }
    if (level3 !== "") {
        parentString = `${level1}-${level2}-${level3}`
        moduleEntityFlatHierarchy.set(parentString, {
            name: level3,
            hierarchyName: parentString,
            parentString: `${level1}-${level2}`,
            hierarchyString: branchName,
        })
        moduleEntityFlatHierarchy.set(`${level1}-${level2}`, {
            name: level2,
            hierarchyName: `${level1}-${level2}`,
            parentString: level1,
            hierarchyString: branchName,
        })
    }

    moduleEntityFlatHierarchy.set(level1, {
        name: level1,
        hierarchyName: level1,
        hierarchyString: branchName,
        parentString: rootName,
    })

    const { ApiModifiers, moduleType: mT, sortingGroup: sG, permanentType: pT, ...data } = module
    moduleEntityFlatHierarchy.set(moduleName, {
        name: moduleName,
        hierarchyName: moduleName,
        hierarchyString: levelAll,
        parentString,
        data,
    })

    return true
}

/**
 * Get module modifier properties
 * @param APImodifiers - Module modifier data
 * @returns Module modifier properties
 */
const getModuleProperties = (APImodifiers: ModifiersEntity[]): ModuleEntityProperties[] | undefined => {
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

export const setModule = (moduleConvertEntity: ModuleConvertEntity) => {
    for (const level of moduleLevel) {
        const s = `${levelDivider}${level}`
        if (moduleConvertEntity.name.endsWith(s)) {
            moduleConvertEntity.moduleLevel = level
        }
    }

    moduleConvertEntity.properties = getModuleProperties(moduleConvertEntity.ApiModifiers)
    return setModuleTypeHierarchy(moduleConvertEntity)
}

export const saveModules = async () => {
    moduleEntityFlatHierarchy.delete("Not used")
    moduleEntityFlatHierarchy.set(rootName, {
        name: rootName,
        hierarchyName: rootName,
        hierarchyString: rootName,
        parentString: "",
    })

    // Add module ids for the parent nodes of leaf nodes
    const leafModules = [...moduleEntityFlatHierarchy.values()].filter(({ data }) => data !== undefined)

    /* eslint-disable @typescript-eslint/no-non-null-assertion */
    for (const module of leafModules) {
        const parentData = moduleEntityFlatHierarchy.get(module.parentString)!
        if (parentData.moduleIds) {
            parentData.moduleIds.push(module.data!.id)
        } else {
            parentData.moduleIds = [module.data!.id]
        }
        moduleEntityFlatHierarchy.set(module.parentString, parentData)
    }

    await saveJsonAsync(
        commonPaths.fileModules,
        [...moduleEntityFlatHierarchy.values()].sort(sortBy(["hierarchyString", "name"])),
    )
}
