import { group as d3Group } from "d3-array"

import type {
    APIItemGeneric,
    APIRecipeModuleResource,
    APIRecipeResource,
    APIShipUpgradeBookItem,
    TemplateEntity,
} from "./@types/api-item.js"
import type { RecipeEntity, RecipeGroup } from "./@types/recipes.js"
import { cleanName } from "./common/api.js"
import { getApiItems } from "./common/common.js"
import { saveJsonAsync } from "./common/file.js"
import { getCommonPaths } from "./common/path.js"
import { simpleStringSort, sortBy } from "./common/sort.js"

interface Ingredient {
    id: number
    name: string
    recipeNames: string[]
}

let apiItems: APIItemGeneric[]
const commonPaths = getCommonPaths()

// noinspection SpellCheckingInspection
const craftGroups = new Map([
    ["AdmiraltyDefault", "Admirality"],
    ["Cannons", "Repairs"],
    ["Manufacturing", "Manufacturing"],
    ["WoodWorking", "Cannons"],
])

const recipeItemTypes = new Set(["Recipe", "RecipeModule", "RecipeResource"])
const recipeUsingResults = new Set(["Recipe", "RecipeResource"])

const recipes = [] as RecipeEntity[]
const ingredients = new Map<number, Ingredient>()

let itemNames: Map<number, string>
let moduleNames: Map<number, string>
let ingredientIds: Set<number>
let upgradeIds: Map<number, number>

const init = () => {
    itemNames = new Map(apiItems.map((item) => [item.Id, cleanName(item.Name)]))

    moduleNames = new Map(
        (apiItems.filter((item) => item.ItemType === "ShipUpgradeBookItem") as unknown as APIShipUpgradeBookItem[]).map(
            (item) => [item.Id, itemNames.get(item.Upgrade) ?? ""],
        ),
    )

    ingredientIds = new Set(
        apiItems
            .filter(
                (item) =>
                    !item.NotUsed &&
                    (item.ItemType === "ShipUpgradeBookItem" || item.SortingGroup === "Resource.Trading"),
            )
            .map((item) => item.Id),
    )

    upgradeIds = new Map(
        apiItems.filter((item) => !item.NotUsed && item.Upgrade).map((item) => [item.Id, item.Upgrade ?? 0]),
    )
}

const addIngredients = (APIIngredients: TemplateEntity[], recipeName: string) => {
    for (const apiIngredient of APIIngredients) {
        if (ingredients.has(apiIngredient.Template)) {
            const updatedIngredient = ingredients.get(apiIngredient.Template) ?? ({} as Ingredient)
            updatedIngredient.recipeNames.push(recipeName)
            updatedIngredient.recipeNames.sort(simpleStringSort)
            ingredients.set(apiIngredient.Template, updatedIngredient)
        } else {
            const ingredient = {
                id: apiIngredient.Template,
                name: itemNames.get(apiIngredient.Template),
                recipeNames: [recipeName],
            } as Ingredient
            ingredients.set(apiIngredient.Template, ingredient)
        }
    }
}

const convert = async (): Promise<void> => {
    const filteredItems = apiItems
        .filter((item) => !item.NotUsed)
        .filter((apiRecipe) => recipeItemTypes.has(apiRecipe.ItemType)) as
        | APIRecipeResource[]
        | APIRecipeModuleResource[]

    for (const apiRecipe of filteredItems) {
        const resultReference = recipeUsingResults.has(apiRecipe.ItemType)
            ? apiRecipe.Results[0]
            : (apiRecipe as APIRecipeModuleResource).Qualities[0].Results[0]
        const recipe = {
            id: apiRecipe.Id,
            name: cleanName(apiRecipe.Name).replace(" - ", " – ").replace("u2013", "–").replace(/ $/, ""),
            module: apiRecipe.Results.length === 0 ? "" : moduleNames.get(apiRecipe.Results[0].Template),
            goldPrice: apiRecipe.GoldRequirements,
            itemRequirements: apiRecipe.FullRequirements.map((requirement) => ({
                id: requirement.Template,
                name: itemNames.get(requirement.Template),
                amount: requirement.Amount,
            })).sort(sortBy(["name"])),
            result: {
                id: upgradeIds.has(resultReference.Template)
                    ? upgradeIds.get(resultReference.Template)
                    : resultReference.Template,
                name: itemNames.get(resultReference.Template),
                amount: resultReference.Amount,
            },
            craftGroup: craftGroups.has(apiRecipe.CraftGroup)
                ? craftGroups.get(apiRecipe.CraftGroup)
                : apiRecipe.CraftGroup,
            serverType: apiRecipe.ServerType,
        } as RecipeEntity

        // if result exists
        if (recipe.result.name) {
            recipes.push(recipe)
        }

        addIngredients(apiRecipe.FullRequirements, recipe.name)
    }

    /** Save recipes */
    const recipeGrouped = [...d3Group(recipes, (recipe) => recipe.craftGroup)]
    const recipeCleaned = recipeGrouped.map(([group, recipes]) => {
        return {
            group,
            recipes: recipes
                .map((recipe) => {
                    const { craftGroup, ...recipeCleaned } = recipe
                    recipeCleaned.itemRequirements.sort(sortBy(["id"]))
                    return recipeCleaned
                })
                .sort(sortBy(["id"])),
        } as RecipeGroup
    })
    await saveJsonAsync(commonPaths.fileRecipe, recipeCleaned)

    /** Save ingredients */
    const ingredientData = [...ingredients.values()].sort(sortBy(["id"]))
    await saveJsonAsync(commonPaths.fileIngredient, ingredientData)
}

export const convertRecipeData = async (): Promise<void> => {
    apiItems = getApiItems()

    init()
    await convert()
}
