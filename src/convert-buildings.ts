import type { APIBuilding, APIItemGeneric, APIRecipeResource, LevelsEntity, TemplateEntity } from "./@types/api-item.js"
import type {
    Building,
    BuildingBatch,
    BuildingLevelsEntity,
    BuildingMaterialsEntity,
    BuildingResult,
} from "./@types/buildings.js"
import { cleanName } from "./common/api.js"
import { getApiItems } from "./common/common.js"
import { saveJsonAsync } from "./common/file.js"
import { getCommonPaths } from "./common/path.js"
import { sortBy } from "./common/sort.js"

const idWorkshop = 450

let apiItems: APIItemGeneric[]

const getItemsCrafted = (buildingId: number): BuildingResult[] =>
    apiItems
        .filter((item) => !item.NotUsed && item.BuildingRequirements?.[0]?.BuildingTemplate === buildingId)
        .map((recipe) => ({
            id: recipe.Id,
            name: cleanName(recipe.Name),
            price: 0,
        }))
        .sort((a, b) => a.id - b.id)

const getItemsCraftedByWorkshop = (): BuildingResult[] => getItemsCrafted(idWorkshop)

/**
 * Convert API building data and save sorted as JSON
 */
const getBuildings = (): Building[] => {
    const buildings = new Map<string, Building>()
    const buildingResources = new Map<number, BuildingResult>(
        apiItems.map((apiResource) => [
            Number(apiResource.Id),
            { id: apiResource.Id, name: cleanName(apiResource.Name), price: apiResource.BasePrice },
        ]),
    )

    const apiRecipeResources = apiItems.filter(
        (item) => item.ItemType === "RecipeResource",
    ) as unknown as APIRecipeResource[]

    const resourceRecipes = new Map<number, BuildingBatch>(
        apiRecipeResources.map((recipe) => [
            recipe.Results[0].Template,
            {
                price: recipe.GoldRequirements,
                amount: recipe.Results[0].Amount,
            },
        ]),
    )

    const apiBuildings = apiItems.filter((item) => item.ItemType === "Building" && !item.NotUsed) as APIBuilding[]

    for (const apiBuilding of apiBuildings) {
        const building: Building = {
            id: Number(apiBuilding.Id),
            name: cleanName(apiBuilding.Name),
            result: buildingResources.has(apiBuilding.ProduceResource ?? apiBuilding.RequiredPortResource)
                ? ([
                      buildingResources.get(apiBuilding.ProduceResource ?? apiBuilding.RequiredPortResource),
                  ] as BuildingResult[])
                : undefined,

            batch: resourceRecipes.get(apiBuilding.RequiredPortResource),
            levels: apiBuilding.Levels.map(
                (level: LevelsEntity): BuildingLevelsEntity => ({
                    production: level.ProductionLevel * apiBuilding.BaseProduction,
                    maxStorage: level.MaxStorage,
                    price: level.UpgradePriceGold,
                    materials: level.UpgradePriceMaterials.map(
                        (material: TemplateEntity): BuildingMaterialsEntity => ({
                            item: buildingResources.get(material.Template)?.name ?? "",
                            amount: material.Amount,
                        }),
                    ),
                }),
            ),
        }

        // Ignore double entries
        if (!buildings.has(building.name)) {
            switch (building.name) {
                case "Shipyard": {
                    building.result = [{ id: 0, name: "Ships", price: 0 }]
                    break
                }
                case "Forge": {
                    building.result = [{ id: 0, name: "Cannons", price: 0 }]
                    break
                }
                case "Workshop": {
                    building.result = getItemsCraftedByWorkshop()
                    break
                }
            }

            buildings.set(building.name, building)
        }
    }

    return [...buildings.values()]
}

const convertBuildings = async (): Promise<void> => {
    const commonPaths = getCommonPaths()
    let buildings = getBuildings()

    buildings = buildings.filter((building) => Object.keys(building).length).sort(sortBy(["id"]))
    await saveJsonAsync(commonPaths.fileBuilding, buildings)
}

export const convertBuildingData = async (): Promise<void> => {
    apiItems = getApiItems()

    await convertBuildings()
}
