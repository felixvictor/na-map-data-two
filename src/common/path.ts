import path from "node:path"

export interface DirList {
    dirAPI: string
    dirGenGeneric: string
    dirGenServer: string
    dirLib: string
    dirModules: string
    dirSrc: string
    fileBuilding: string
    fileDistances: string
    fileCannon: string
    fileLoot: string
    fileModules: string
    filePbSheet: string
    filePbZone: string
    filePort: string
    filePrices: string
    fileRecipe: string
    fileRepair: string
    fileShip: string
    fileShipBlueprint: string
    fileWood: string
}

/**
 * Build common paths and file names
 */
export function getCommonPaths(appRoot = process.env.PWD ?? ""): DirList {
    const dirBuild = path.join(appRoot, "build")
    const dirAPI = path.join(dirBuild, "API")
    const dirLib = path.join(appRoot, "lib")
    const dirGenServer = path.join(dirLib, "")
    const dirGenGeneric = path.join(dirLib, "")
    const dirSrc = path.join(appRoot, "src")

    return {
        dirAPI,
        dirGenGeneric,
        dirGenServer,
        dirLib,
        dirModules: path.join(dirBuild, "Modules"),
        dirSrc,

        fileBuilding: path.join(dirGenGeneric, "buildings.json"),
        fileDistances: path.join(dirLib, "distances.json"),
        fileCannon: path.join(dirGenGeneric, "cannons.json"),
        fileLoot: path.join(dirGenGeneric, "loot.json"),
        fileModules: path.join(dirGenGeneric, "modules.json"),
        filePbSheet: path.join(dirGenGeneric, "port-battle.xlsx"),
        filePbZone: path.join(dirGenGeneric, "pb-zones.json"),
        filePort: path.join(dirGenGeneric, "ports.json"),
        filePrices: path.join(dirGenGeneric, "prices.json"),
        fileRecipe: path.join(dirGenGeneric, "recipes.json"),
        fileRepair: path.join(dirGenGeneric, "repairs.json"),
        fileShip: path.join(dirGenGeneric, "ships.json"),
        fileShipBlueprint: path.join(dirGenGeneric, "ship-blueprints.json"),
        fileWood: path.join(dirGenGeneric, "woods.json"),
    }
}
