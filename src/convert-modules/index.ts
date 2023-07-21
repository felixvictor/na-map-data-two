import { cleanName } from "../common/api.js"
import { getAPIFilename, readJson } from "../common/file.js"
import { serverIds } from "../common/servers.js"
import { currentServerStartDate as serverDate } from "../common/time.js"
import { levels, notUsedExceptionalWoodIds, notUsedModules, usedModules } from "./common.js"
import { saveModules, setModule } from "./module.js"
import { saveWoods, setWood } from "./wood.js"
import type { APIItemGeneric, APIModule } from "../@types/api-item.d.ts"
import type { ModuleConvertEntity } from "../@types/modules.js"

let apiItems: APIItemGeneric[]
const addedModules = new Set<string>()

const isDoubleEntry = (module: ModuleConvertEntity): boolean => addedModules.has(module.name + module.moduleLevel)

/**
 * Convert API module data
 */
export const convertModulesAndWoodData = async (): Promise<void> => {
    const apiModules = apiItems
        .filter((item) => item.ItemType === "Module")
        .filter((item) => !notUsedModules.has(item.Id))
        .filter((item) => item.Id <= 2594 || usedModules.has(item.Id))
        .filter((item) => (item.ModuleType === "Permanent" && !item.NotUsed) || item.ModuleType !== "Permanent")
        .filter((item) => !notUsedExceptionalWoodIds.has(item.Id)) as APIModule[]

    for (const apiModule of apiModules) {
        const module = {
            id: apiModule.Id,
            name: cleanName(apiModule.Name),
            usageType: apiModule.UsageType,
            APImodifiers: apiModule.Modifiers,
            sortingGroup: apiModule.SortingGroup.replace("module:", ""),
            permanentType: apiModule.PermanentType.replace(/_/g, " "),
            // isStackable: !!apiModule.bCanBeSetWithSameType,
            // minResourcesAmount: APImodule.MinResourcesAmount,
            // maxResourcesAmount: APImodule.MaxResourcesAmount,
            // breakUpItemsAmount: APImodule.BreakUpItemsAmount,
            // canBeBreakedUp: APImodule.CanBeBreakedUp,
            // bCanBeBreakedUp: APImodule.bCanBeBreakedUp,
            moduleType: apiModule.ModuleType,
            moduleLevel: levels.get(apiModule.ModuleLevel),
        } as ModuleConvertEntity

        if (module.name.startsWith("Bow figure - ")) {
            module.name = `${module.name.replace("Bow figure - ", "")} bow figure`
            module.moduleLevel = "U"
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
    apiItems = readJson(getAPIFilename(`${serverIds[0]}-ItemTemplates-${serverDate}.json`))

    await convertModulesAndWoodData()
    await saveModules()
    await saveWoods()
}
