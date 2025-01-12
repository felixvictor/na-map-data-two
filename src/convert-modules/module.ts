import type { ModifiersEntity } from "../@types/api-item.d.ts"
import type {
    APIModifierName,
    ModuleConvertEntity,
    ModuleEntityFlatHierarchy,
    ModuleEntityProperties,
} from "../@types/modules.d.ts"
import { cCircleWhite, cDashEn, cSpaceNarrowNoBreaking } from "../common/constants.js"
import { saveJsonAsync } from "../common/file.js"
import { capitalizeFirstLetter } from "../common/format.js"
import { getCommonPaths } from "../common/path.js"
import { sortBy } from "../common/sort.js"
import { bonusRegex, flipAmountForModule, modifiers, moduleRate, notPercentage } from "./common.js"

const commonPaths = getCommonPaths()

const moduleEntityFlatHierarchy = new Map<string, ModuleEntityFlatHierarchy>()
const rootName = "Modules"

const getModifierName = (modifier: ModifiersEntity): APIModifierName =>
    `${modifier.Slot} ${modifier.MappingIds.join(",")}`

/**
 * Get module type as a combined string
 * @param module - Module data
 * @returns Module object
 */
const setModuleTypeHierarchy = (module: ModuleConvertEntity) => {
    let typeString: string
    const { permanentType, sortingGroup } = module
    const { moduleLevel, moduleType, name: moduleName, usageType } = module

    if (usageType === "All" && sortingGroup && moduleLevel === "U" && moduleType === "Hidden") {
        typeString = "Ship trim"
    } else if (moduleType === "Permanent" && !moduleName.endsWith(" Bonus")) {
        typeString = "Permanent"
    } else if (usageType === "All" && !sortingGroup && moduleLevel === "U" && moduleType === "Hidden") {
        typeString = "Perk"
    } else if (moduleType === "Regular") {
        typeString = "Ship knowledge"
    } else {
        typeString = "Not used"
    }

    // Correct sorting group
    let sortingGroupString = sortingGroup
    if (moduleName.endsWith("French Rig Refit") || moduleName === "Bridgetown Frame Refit") {
        sortingGroupString = "Survival"
    }

    if (typeString === "Ship trim") {
        const result = bonusRegex.exec(moduleName)
        sortingGroupString = result ? result[1] : ""
    } else {
        sortingGroupString = sortingGroup ? capitalizeFirstLetter(sortingGroup).replace("_", "/") : ""
    }

    const permanentTypeString = permanentType === "Default" ? "" : (permanentType ?? "")

    let typeHierarchyString = typeString
    if (sortingGroupString !== "") {
        typeHierarchyString = `${typeHierarchyString}${cSpaceNarrowNoBreaking}${cDashEn}${cSpaceNarrowNoBreaking}${sortingGroupString}`
    }
    if (permanentTypeString !== "") {
        typeHierarchyString = `${typeHierarchyString}${cSpaceNarrowNoBreaking}${cCircleWhite}${cSpaceNarrowNoBreaking}${permanentTypeString}`
    }

    let parentType = typeString
    if (sortingGroupString !== "") {
        parentType = `${typeString}-${sortingGroupString}`
        moduleEntityFlatHierarchy.set(parentType, {
            name: sortingGroupString,
            parentType,
            typeHierarchyString: "node",
        })
    }
    if (permanentTypeString !== "") {
        parentType = `${typeString}-${sortingGroupString}-${permanentTypeString}`
        moduleEntityFlatHierarchy.set(parentType, {
            name: permanentTypeString,
            parentType,
            typeHierarchyString: "node",
        })
        moduleEntityFlatHierarchy.set(`${typeString}-${sortingGroupString}`, {
            name: sortingGroupString,
            parentType: `${typeString}-${sortingGroupString}`,
            typeHierarchyString: "node",
        })
    }

    moduleEntityFlatHierarchy.set(typeString, { name: typeString, typeHierarchyString: "node", parentType: rootName })

    if (isUsed(moduleName, typeString, moduleLevel)) {
        const { ApiModifiers, moduleType, sortingGroup, permanentType, ...data } = module
        moduleEntityFlatHierarchy.set(moduleName, {
            name: moduleName,
            typeHierarchyString,
            parentType,
            data,
        })
        return true
    }

    return false
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

const isUsed = (name: string, typeString: string, moduleLevel: string) => {
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
        "TEST MODULE SPEED IN OW",
        "Thrifty",
    ])

    const nameL = name.toLocaleLowerCase()
    const typeStringL = typeString.toLocaleLowerCase()

    return !(
        nameExceptions.has(name) ||
        (name === "Optimized Rudder" && moduleLevel !== "U") ||
        typeStringL.startsWith("not used") ||
        nameL.startsWith("test") ||
        nameL.endsWith("test") ||
        nameL.endsWith("old") ||
        nameL.startsWith("not used")
    )
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

export const setModule = (moduleConvertEntity: ModuleConvertEntity) => {
    for (const rate of moduleRate) {
        for (const name of rate.names) {
            if (moduleConvertEntity.name.endsWith(name)) {
                moduleConvertEntity.name = moduleConvertEntity.name.replace(name, "")
                moduleConvertEntity.moduleLevel = rate.level
            }
        }
    }

    if (rateExceptions.has(moduleConvertEntity.name)) {
        moduleConvertEntity.moduleLevel = "U"
    }

    moduleConvertEntity.properties = getModuleProperties(moduleConvertEntity.ApiModifiers)
    return setModuleTypeHierarchy(moduleConvertEntity)
}

export const saveModules = async () => {
    moduleEntityFlatHierarchy.delete("Not used")
    moduleEntityFlatHierarchy.set(rootName, {
        name: rootName,
        typeHierarchyString: "",
    })

    const m = [...moduleEntityFlatHierarchy.values()].filter(
        ({ parentType, data }) => parentType !== undefined && data !== undefined,
    )

    for (const module of m) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const parentData = moduleEntityFlatHierarchy.get(module.parentType!)!
        if (parentData.moduleIds) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            parentData.moduleIds.push(module.data!.id)
        } else {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            parentData.moduleIds = [module.data!.id]
        }
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        moduleEntityFlatHierarchy.set(module.parentType!, parentData)
    }

    await saveJsonAsync(
        commonPaths.fileModules,
        [...moduleEntityFlatHierarchy.values()].sort(sortBy(["typeHierarchyString", "name"])),
    )
}
