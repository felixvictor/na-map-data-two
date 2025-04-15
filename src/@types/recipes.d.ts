export interface Recipe {
    recipe: RecipeGroup[]
    ingredient: RecipeIngredientEntity[]
}
interface RecipeGroup {
    group: string
    recipes: RecipeEntity[]
}
interface RecipeEntity {
    id: number
    name: string
    module?: string
    goldPrice: number
    itemRequirements: RecipeItemRequirement[]
    result: RecipeResult
    craftGroup?: string
    requiredLevel: number
    xp: number
    serverType: number | string
}
interface RecipeItemRequirement {
    id: number
    name: string
    amount: number
}
interface RecipeResult {
    id: number
    name: string
    amount: number
    craftingCost: number
    reduction: number
}
interface RecipeIngredientEntity {
    id: number
    name: string
    recipeNames: string[]
}
