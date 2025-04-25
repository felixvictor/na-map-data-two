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
import { defaultPortTax } from "./common/constants.js"
import { saveJsonAsync } from "./common/file.js"
import { round } from "./common/format.js"
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
    ["Cannons", "Cannon and repair supply"],
    ["Manufacturing", "Manufacturing"],
    ["WoodWorking", "Cannons"],
])

const recipeItemTypes = new Set(["Recipe", "RecipeModule", "RecipeResource"])
const recipeUsingResults = new Set(["Recipe", "RecipeResource"])

const recipes = [] as RecipeEntity[]
const ingredients = new Map<number, Ingredient>()

let itemNames: Map<number, string>
let moduleNames: Map<number, string>
let upgradeIds: Map<number, number>
let basePrices: Map<number, number>
const craftPrices = new Map<number, number>()
let isResourceSet: Set<number>

const init = () => {
    itemNames = new Map(apiItems.map((item) => [item.Id, cleanName(item.Name)]))

    moduleNames = new Map(
        (apiItems.filter((item) => item.ItemType === "ShipUpgradeBookItem") as unknown as APIShipUpgradeBookItem[]).map(
            (item) => [item.Id, itemNames.get(item.Upgrade) ?? ""],
        ),
    )

    upgradeIds = new Map(
        apiItems.filter((item) => !item.NotUsed && item.Upgrade).map((item) => [item.Id, item.Upgrade ?? 0]),
    )

    basePrices = new Map(apiItems.map((item) => [item.Id, item.BasePrice]))

    isResourceSet = new Set(
        apiItems
            .filter((item) => item.ItemType === "Resource" && item.SortingGroup !== "Resource.Ammo")
            .map((item) => item.Id),
    )
}

/**
 * Add '0' padding for gun and carronade name
 */
const getLbPadding = (a: string) => {
    let result = a
    if (result.includes("Gun") || result.includes("Carronade")) {
        const aa = Number.parseInt(result)
        if (!Number.isNaN(aa) && aa < 10) {
            result = `0${result}`
        }
    }
    return result
}

const addIngredients = (APIIngredients: TemplateEntity[], recipeName: string) => {
    for (const apiIngredient of APIIngredients) {
        if (ingredients.has(apiIngredient.Template)) {
            const updatedIngredient = ingredients.get(apiIngredient.Template) ?? ({} as Ingredient)
            updatedIngredient.recipeNames.push(recipeName)
            updatedIngredient.recipeNames.sort((a, b) => simpleStringSort(getLbPadding(a), getLbPadding(b)))
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

const convert = async (printOutput = false): Promise<void> => {
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
                isResource: isResourceSet.has(requirement.Template),
            })).sort(sortBy(["id"])),
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
            requiredLevel: apiRecipe.RequiresLevel,
            xp: apiRecipe.GivesXP,
            serverType: apiRecipe.ServerType,
        } as RecipeEntity

        // Price
        let craftingCost = recipe.goldPrice
        if (printOutput) {
            console.log("\n**", recipe.result.name, "**")
            console.log("Manufacturing cost:", craftingCost)
        }

        for (const item of recipe.itemRequirements) {
            let itemPrice = basePrices.get(item.id) ?? 0
            let priceString = `(port buy price: ${itemPrice} // total including 5% tax: ${round(item.amount * itemPrice * (1 + defaultPortTax), 2)})`

            if (craftPrices.has(item.id)) {
                itemPrice = craftPrices.get(item.id) ?? 0
                priceString = `(crafted resource cost: ${itemPrice} // total: ${round(item.amount * itemPrice, 2)})`
            }
            if (printOutput) {
                console.log(item.amount, item.name, priceString)
            }

            craftingCost += item.amount * itemPrice
        }

        const portBuyPrice = round((basePrices.get(recipe.result.id) ?? 0) * (1 + defaultPortTax), 2)
        const pricePerUnit = round(craftingCost / recipe.result.amount, 2)
        const reduction = round(1 - pricePerUnit / portBuyPrice, 3)

        recipe.result.craftingCost = pricePerUnit
        recipe.result.reduction = reduction

        if (printOutput) {
            console.log(
                "Total crafting cost for",
                recipe.result.amount,
                "units:",
                round(craftingCost, 2),
                "(per unit:",
                pricePerUnit,
                `// port buy price per unit including 5% tax: ${portBuyPrice} // reduction of ${round(reduction * 100)}%)`,
            )
        }

        craftPrices.set(recipe.result.id, round(craftingCost / recipe.result.amount, 2))

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
