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
import { unCompressApiJson, removeApiJson } from "./common/compress.js"

const convertApiData = async (): Promise<void> => {
    await convertBuildingData()
    await convertCannons()
    convertGenericPortData()
    convertLootData()
    await convertModules()
    convertRecipeData()
    await convertRepairData()
    await convertServerPortData()
    await convertOwnershipData()
    await convertShipData()
}

const convert = async (): Promise<void> => {
    unCompressApiJson()
    await convertApiData()
    await createPortBattleSheet()
    removeApiJson()
}

void convert()
