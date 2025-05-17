import path from "node:path"

export interface DirectoryList {
    directoryAPI: string
    directoryGenGeneric: string
    directoryGenServer: string
    directoryLib: string
    directoryModules: string
    directorySrc: string
    fileBuilding: string
    fileDistances: string
    fileCannon: string
    fileIngredient: string
    fileChest: string
    fileModules: string
    filePbSheet: string
    filePbZone: string
    filePort: string
    filePrices: string
    fileRecipe: string
    fileRepair: string
    fileShip: string
    fileShipSheet: string
    fileShipBlueprint: string
    fileWood: string
}

/**
 * Build common paths and file names
 */
export function getCommonPaths(appRoot = process.env.PWD ?? ""): DirectoryList {
    const directoryBuild = path.join(appRoot, "build")
    const directoryAPI = path.join(directoryBuild, "API")
    const directoryLibrary = path.join(appRoot, "lib")
    const directoryGenServer = path.join(directoryLibrary, "")
    const directoryGenGeneric = path.join(directoryLibrary, "")
    const directorySource = path.join(appRoot, "src")

    return {
        directoryAPI: directoryAPI,
        directoryGenGeneric,
        directoryGenServer,
        directoryLib: directoryLibrary,
        directoryModules: path.join(directoryBuild, "Modules"),
        directorySrc: directorySource,

        fileBuilding: path.join(directoryGenGeneric, "buildings.json"),
        fileDistances: path.join(directoryLibrary, "distances.json"),
        fileCannon: path.join(directoryGenGeneric, "cannons.json"),
        fileIngredient: path.join(directoryGenGeneric, "ingredients.json"),
        fileChest: path.join(directoryGenGeneric, "chests.json"),
        fileModules: path.join(directoryGenGeneric, "modules.json"),
        filePbSheet: path.join(directoryGenGeneric, "port-battle.xlsx"),
        filePbZone: path.join(directoryGenGeneric, "pb-zones.json"),
        filePort: path.join(directoryGenGeneric, "ports.json"),
        filePrices: path.join(directoryGenGeneric, "prices.json"),
        fileRecipe: path.join(directoryGenGeneric, "recipes.json"),
        fileRepair: path.join(directoryGenGeneric, "repairs.json"),
        fileShip: path.join(directoryGenGeneric, "ships.json"),
        fileShipSheet: path.join(directoryGenGeneric, "ships.xlsx"),
        fileShipBlueprint: path.join(directoryGenGeneric, "ship-blueprints.json"),
        fileWood: path.join(directoryGenGeneric, "woods.json"),
    }
}
