import { convertBuildingData } from "./convert-buildings"
import { convertCannons } from "./convert-cannons"
import { convertGenericPortData } from "./convert-generic-port-data"
import { convertLootData } from "./convert-loot"
import { convertModules } from "./convert-modules"
import { convertRecipeData } from "./convert-recipes"
import { convertRepairData } from "./convert-module-repair-data"
import { convertOwnershipData } from "./convert-ownership"
import { convertServerPortData } from "./convert-server-port-data"
import { convertShipData } from "./convert-ship-data"
import { createPortBattleSheet } from "./create-pb-sheets"
import { compressApiData, uncompressApiData } from "./common"

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
