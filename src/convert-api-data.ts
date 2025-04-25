import { removeApiJson, unCompressApiJson } from "./common/compress.js"
import { convertBuildingData } from "./convert-buildings.js"
import { convertCannons } from "./convert-cannons.js"
import { convertGenericPortData } from "./convert-generic-port-data.js"
import { convertLootData } from "./convert-loot.js"
import { convertRepairData } from "./convert-module-repair-data.js"
import { convertModules } from "./convert-modules/index.js"
import { convertOwnershipData } from "./convert-ownership.js"
import { convertPrices } from "./convert-prices.js"
import { convertRecipeData } from "./convert-recipes.js"
import { convertServerPortData } from "./convert-server-port-data.js"
import { convertShipData } from "./convert-ship-data.js"
import { createPortBattleSheet } from "./create-pb-sheets.js"

const convertApiData = async (): Promise<void> => {
    await convertBuildingData()
    await convertCannons()
    convertGenericPortData()
    convertLootData()
    await convertModules()
    await convertPrices()
    await convertRecipeData()
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
