// https://stackoverflow.com/a/46427607
const buildPath = (...args: string[]) => {
    return args
        .map((part, i) => {
            if (i === 0) {
                return part.trim().replace(/\/*$/g, "")
            }

            return part.trim().replace(/(^\/*|\/*$)/g, "")
        })
        .filter((x) => x.length)
        .join("/")
}

// https://stackoverflow.com/a/50052194

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
    filePbZoneTwo: string
    filePort: string
    filePortTwo: string
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
    const dirBuild = buildPath(appRoot, "build")
    const dirAPI = buildPath(dirBuild, "API")
    const dirLib = buildPath(appRoot, "lib")
    const dirGenServer = buildPath(dirLib, "")
    const dirGenGeneric = buildPath(dirLib, "")
    const dirSrc = buildPath(appRoot, "src")

    return {
        dirAPI,
        dirGenGeneric,
        dirGenServer,
        dirLib,
        dirModules: buildPath(dirBuild, "Modules"),
        dirSrc,

        fileBuilding: buildPath(dirGenGeneric, "buildings.json"),
        fileDistances: buildPath(dirLib, "distances.json"),
        fileCannon: buildPath(dirGenGeneric, "cannons-two.json"),
        fileLoot: buildPath(dirGenGeneric, "loot.json"),
        fileModules: buildPath(dirGenGeneric, "modules.json"),
        filePbSheet: buildPath(dirGenGeneric, "port-battle.xlsx"),
        filePbZone: buildPath(dirGenGeneric, "pb-zones.json"),
        filePbZoneTwo: buildPath(dirGenGeneric, "pb-zones-two.json"),
        filePort: buildPath(dirGenGeneric, "ports.json"),
        filePortTwo: buildPath(dirGenGeneric, "ports-two.json"),
        filePrices: buildPath(dirGenGeneric, "prices.json"),
        fileRecipe: buildPath(dirGenGeneric, "recipes.json"),
        fileRepair: buildPath(dirGenGeneric, "repairs.json"),
        fileShip: buildPath(dirGenGeneric, "ships.json"),
        fileShipBlueprint: buildPath(dirGenGeneric, "ship-blueprints.json"),
        fileWood: buildPath(dirGenGeneric, "woods.json"),
    }
}
