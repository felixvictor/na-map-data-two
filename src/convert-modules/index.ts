import type { APIItemGeneric, APIModule } from "../@types/api-item.d.ts"
import type { ModuleConvertEntity } from "../@types/modules.js"
import { cleanName } from "../common/api.js"
import { getApiItems } from "../common/common.js"
import { isPerk, levels } from "./common.js"
import { saveModules, setModule } from "./module.js"
import { saveWoods, setWood } from "./wood.js"

let apiItems: APIItemGeneric[]
const addedModules = new Set<string>()

const isDoubleEntry = (module: ModuleConvertEntity): boolean => addedModules.has(module.name + module.moduleLevel)

/**
 * Convert API module data
 */
export const convertModulesAndWoodData = (): void => {
    const apiModules = apiItems
        .filter((item) => item.ItemType === "Module")
        .filter((item) => !item.NotUsed)
        .filter(
            (item) => (item.ModuleType === "Permanent" && !item.NotUsed) || item.ModuleType !== "Permanent",
        ) as APIModule[]

    for (const apiModule of apiModules) {
        const module = {
            id: apiModule.Id,
            name: cleanName(apiModule.Name),
            usageType: apiModule.UsageType,
            apiModifiers: apiModule.Modifiers,
            sortingGroup: apiModule.SortingGroup.replace("module:", ""),
            permanentType: apiModule.PermanentType.replaceAll("_", " "),
            moduleType: apiModule.ModuleType,
            moduleLevel: levels.get(apiModule.ModuleLevel),
            sortingOverrideTemplateType: apiModule.SortingOverrideTemplateType,
        } as ModuleConvertEntity

        if (apiModule.scoreValue) {
            module.scoreValue = apiModule.scoreValue
        }

        if (isPerk(module)) {
            module.pointsNeeded = apiModule.BasePrice
        }

        if (module.name.startsWith("Bow figure - ")) {
            module.name = module.name.replace("Bow figure - ", "")
        }

        // Ignore double entries
        if (!isDoubleEntry(module)) {
            let isModuleAdded = false

            // Check for wood module
            isModuleAdded =
                (module.name.endsWith(" Planking") && module.moduleType === "Hidden") ||
                (module.name.endsWith(" Frame") && module.moduleType === "Hidden") ||
                module.name === "Crew Space"
                    ? setWood(module)
                    : setModule(module)

            if (isModuleAdded) {
                addedModules.add(module.name + module.moduleLevel)
            }
        }
    }
}

export const convertModules = async () => {
    apiItems = getApiItems()

    convertModulesAndWoodData()
    await saveModules()
    await saveWoods()
}
