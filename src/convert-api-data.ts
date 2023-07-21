import { convertBuildingData } from "./convert-buildings.js"
import { convertCannons } from "./convert-cannons.js"
import { convertGenericPortData } from "./convert-generic-port-data.js"
import { convertLootData } from "./convert-loot.js"
import { convertModules } from "./convert-modules/index.js"
import { convertRecipeData } from "./convert-recipes.js"
import { convertRepairData } from "./convert-module-repair-data.js"
import { convertOwnershipData } from "./convert-ownership.js"
import { convertServerPortData } from "./convert-server-port-data.js"
import { convertShipData } from "./convert-ship-data.js"
import { createPortBattleSheet } from "./create-pb-sheets.js"
import { compressApiData, uncompressApiData } from "./common/compress.js"

const runType = process.argv[2] || "client"

const convertApiData = async (): Promise<void> => {
    await convertBuildingData()
    await convertCannons()
    await convertGenericPortData()
    await convertLootData()
    await convertModules()
    await convertRecipeData()
    await convertRepairData()
    await convertServerPortData()
    if (runType.endsWith("server")) {
        void (await convertOwnershipData())
    }

    await convertShipData()
}

const convert = async (): Promise<void> => {
    uncompressApiData()
    await convertApiData()
    await createPortBattleSheet()
    compressApiData()
}

void convert()
