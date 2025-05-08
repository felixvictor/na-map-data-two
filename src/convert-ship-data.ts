import fs from "node:fs"
import path from "node:path"

import { min } from "d3-array"
import { merge } from "ts-deepmerge"
import convert, { type ElementCompact } from "xml-js"

import type { APIItemGeneric, APIShip, APIShipBlueprint, Limit, Specs } from "./@types/api-item.js"
import type { Cannon, CannonEntity } from "./@types/cannons.js"
import type {
    ShipBlueprint,
    ShipData,
    ShipDataFromAPI,
    ShipDataFromXML,
    ShipGunDeck,
    ShipGuns,
} from "./@types/ships.js"
import type { TextEntity, XmlGeneric } from "./@types/xml.js"
import { cleanName } from "./common/api.js"
import { getApiItems } from "./common/common.js"
import { speedConstB, speedConstM } from "./common/constants.js"
import { fileExists, readJson, readTextFile, saveJsonAsync } from "./common/file.js"
import { round, roundToThousands } from "./common/format.js"
import { type ElementMap, groupOfFiles } from "./common/group-of-xml-files.mjs"
import { getCommonPaths } from "./common/path.js"
import { getShipId, getShipMaster, shipNames } from "./common/ship-names.mjs"
import { sortBy } from "./common/sort.js"

const commonPaths = getCommonPaths()

interface GunData {
    damage: number
    weight: number
    crew: number
    powder: number
}
type GunDataMap = Map<number, GunData>

/**
 * Ratio of bottom mast thickness
 */
const middleMastThicknessRatio = 0.75

/**
 * Ratio of bottom mast thickness
 */
const topMastThicknessRatio = 0.5

// noinspection SpellCheckingInspection
const shipsWith36lb = new Set([
    2229, // Redoutable (i)
    2235, // Implacable
    2318, // Admiraal de Ruyter
    2487, // Santa Ana (i)
])
const shipsNotUsed = new Set([
    413, // basic cutter
    1535, // rookie brig
    1536, // rookie snow
    2223, // indiaman rookie
    2338, // tutorial cerberus
    2339, // tutorial trader
    2343, // tutorial brig
    2352, // Diana (i)
    2454, // tutorial brig 2
    2483, // Travel Balloon
])
const blueprintsNotUsed = new Set([
    665, // Santa Cecilia
    746, // GunBoat
    1558, // L'Hermione
    1719, // Hercules
    1720, // Pandora
    1721, // Le Requin
    2031, // Rättvisan
    2213, // Leopard
    2228, // Redoutable
    2236, // Yacht
    2239, // Yacht silver
    2381, // Diana (i)
    2382, // Victory1765
    2484, // Travel Balloon
    2487, // San Predro (i)
    2892, // Santa Ana (i)
    2895, // Rotterdam (i)
])

let apiItems: APIItemGeneric[]
const shipDataFromAPI = new Map<number, ShipDataFromAPI>()
const shipDataFromXML = new Map<number, ShipDataFromXML>()
let cannons: Cannon

/**
 * Get item names
 * @returns Item names
 */
const getItemNames = (): Map<number, string> => new Map(apiItems.map((item) => [item.Id, cleanName(item.Name)]))

/**
 * Get ship mass
 * @param id - Ship id
 * @returns Ship mass
 */
const getShipMass = (id: number): number => apiItems.find((apiItem) => id === apiItem.Id)?.ShipMass ?? 0

const getSpeedDegrees = (specs: Specs): { maxSpeed: number; speedDegrees: number[] } => {
    const maxSpeed = round(specs.MaxSpeed * speedConstM + speedConstB, 4)
    const speedDegrees = specs.SpeedToWind.map((speed: number) => roundToThousands(speed * maxSpeed))
    const { length } = specs.SpeedToWind

    // Mirror speed degrees
    for (let index = 1; index < (length - 1) * 2; index += 2) {
        speedDegrees.unshift(speedDegrees[index])
    }

    // Delete last element
    speedDegrees.pop()

    return { maxSpeed, speedDegrees }
}

const isNumber = (name: string): boolean => !Number.isNaN(Number(name))
const getGunData = (cannon: CannonEntity): [number, GunData] => [
    Number(cannon.name),
    {
        damage: cannon.damage.basic.value,
        weight: cannon.generic.weight.value,
        crew: cannon.generic.crew.value,
        powder: cannon.generic.gunpowder.value,
    },
]

const convertShipDataFromAPI = () => {
    const cannonLb = [0, 42, 32, 24, 18, 12, 9, 0, 6, 4, 3, 2]
    const carroLb = [0, 0, 68, 42, 32, 24, 0, 18, 12]
    const sideDeckMaxIndex = 3
    const frontDeckIndex = sideDeckMaxIndex + 1
    const backDeckIndex = frontDeckIndex + 1

    const emptyDeck = { amount: 0, maxCannonLb: 0, maxCarroLb: 0 } as ShipGunDeck

    const cannonData: GunDataMap = new Map(
        cannons.long.filter((cannon) => isNumber(cannon.name)).map((cannon) => getGunData(cannon)),
    )
    const carroData: GunDataMap = new Map(
        cannons.carronade.filter((cannon) => isNumber(cannon.name)).map((cannon) => getGunData(cannon)),
    )

    for (const apiShip of apiItems.filter(
        (item) => item.ItemType === "Ship" && !item.NotUsed && !shipsNotUsed.has(item.Id),
    ) as unknown as APIShip[]) {
        const guns = {
            total: 0,
            decks: apiShip.Decks,
            damage: { cannons: 0, carronades: 0 },
            gunsPerDeck: [],
            weight: { cannons: 0, carronades: 0 },
            powder: 0,
        } as ShipGuns
        let totalCannonCrew = 0
        let totalCarroCrew = 0

        const { maxSpeed, speedDegrees } = getSpeedDegrees(apiShip.Specs)

        const addDeck = (index: number, deckLimit?: Limit, addPowder = false) => {
            if (deckLimit === undefined) {
                guns.gunsPerDeck.push(emptyDeck)
            } else {
                const gunsPerDeck = apiShip.GunsPerDeck[index]
                const currentDeck = {
                    amount: gunsPerDeck,
                    // French-build 3rd rates have 36lb cannons on gun deck (instead of 32lb)
                    maxCannonLb:
                        shipsWith36lb.has(apiShip.Id) && index === apiShip.Decks - 1
                            ? 36
                            : cannonLb[deckLimit.Limitation1.Min],
                    maxCarroLb: carroLb[deckLimit.Limitation2.Min],
                }
                guns.gunsPerDeck.push(currentDeck)

                const cannonWeight = Math.round(gunsPerDeck * (cannonData.get(currentDeck.maxCannonLb)?.weight ?? 0))
                const cannonCrew = gunsPerDeck * (cannonData.get(currentDeck.maxCannonLb)?.crew ?? 0)

                guns.weight.cannons += cannonWeight
                totalCannonCrew += cannonCrew

                if (addPowder) {
                    guns.powder += gunsPerDeck * (cannonData.get(currentDeck.maxCannonLb)?.powder ?? 0)
                }

                if (currentDeck.maxCarroLb) {
                    guns.weight.carronades += Math.round(
                        gunsPerDeck * (cannonData.get(currentDeck.maxCarroLb)?.weight ?? 0),
                    )
                    totalCarroCrew += gunsPerDeck * (carroData.get(currentDeck.maxCarroLb)?.crew ?? 0)
                } else {
                    guns.weight.carronades += cannonWeight
                    totalCarroCrew += cannonCrew
                }
            }
        }

        for (let deckIndex = 0; deckIndex <= sideDeckMaxIndex; deckIndex += 1) {
            addDeck(deckIndex, apiShip.DeckClassLimit[deckIndex], true)

            const gunsPerDeck = guns.gunsPerDeck[deckIndex].amount
            guns.total += gunsPerDeck

            const cannonDamageCurrentDeck = cannonData.get(guns.gunsPerDeck[deckIndex].maxCannonLb)?.damage ?? 0
            const cannonBroadsideDamage = Math.round((gunsPerDeck * cannonDamageCurrentDeck) / 2)
            guns.damage.cannons += cannonBroadsideDamage

            const carroDamageCurrentDeck = carroData.get(guns.gunsPerDeck[deckIndex].maxCarroLb)?.damage ?? 0
            guns.damage.carronades +=
                carroDamageCurrentDeck > 0
                    ? Math.round((gunsPerDeck * carroDamageCurrentDeck) / 2)
                    : cannonBroadsideDamage
        }

        addDeck(frontDeckIndex, apiShip.FrontDeckClassLimit[0])
        addDeck(backDeckIndex, apiShip.BackDeckClassLimit[0])

        const ship = {
            id: Number(apiShip.Id),
            name: cleanName(apiShip.Name),
            class: apiShip.Class,
            isShallowWaterShip: apiShip.Specs.MaxPassableHeight !== 0,
            guns,
            shipMass: apiShip.ShipMass,
            battleRating: apiShip.BattleRating,
            holdSize: apiShip.HoldSize,
            maxWeight: apiShip.MaxWeight,
            crew: {
                min: apiShip.MinCrewRequired,
                max: apiShip.HealthInfo.Crew,
                cannons: totalCannonCrew,
                carronades: totalCarroCrew,
            },
            speed: {
                min: min(speedDegrees) ?? 0,
                max: maxSpeed,
            },
            sides: { armour: apiShip.HealthInfo.LeftArmor },
            bow: { armour: apiShip.HealthInfo.FrontArmor },
            stern: { armour: apiShip.HealthInfo.BackArmor },
            structure: { armour: apiShip.HealthInfo.InternalStructure },
            sails: { armour: apiShip.HealthInfo.Sails },
            pump: { armour: apiShip.HealthInfo.Pump },
            rudder: {
                armour: apiShip.HealthInfo.Rudder,
            },
            upgradeXP: apiShip.OverrideTotalXpForUpgradeSlots,
            premium: apiShip.Premium,
            tradeShip: apiShip.ShipType === 1,
            // hostilityScore: ship.HostilityScore
        } as ShipDataFromAPI

        shipDataFromAPI.set(ship.id, ship)
    }
}

/**
 * List of file names to be read
 */
const baseFileNames = new Set<string>()
const specialNames = new Set(["basic", "rookie", "trader", "tutorial"])

/**
 * Gets all files from directory <dir> and stores valid ship names in <fileNames>
 * @param directory - Directory
 */
const getBaseFileNames = (directory: string): void => {
    for (const fileName of fs.readdirSync(directory)) {
        /**
         * First part of the file name containing the ship name
         */
        let baseFileName = fileName.slice(0, fileName.indexOf(" "))

        if (specialNames.has(baseFileName)) {
            let shortenedFileName = fileName
            for (const name of specialNames) {
                shortenedFileName = shortenedFileName.replace(`${name} `, "")
            }
            const baseFileNameExtension = shortenedFileName.slice(0, shortenedFileName.indexOf(" "))
            baseFileName += ` ${baseFileNameExtension}`
        }

        if (shipNames.has(baseFileName)) {
            baseFileNames.add(baseFileName)
        }
    }
}

const readXMLFile = (baseFileName: string, extension: string): XmlGeneric => {
    const fileName = path.resolve(commonPaths.directoryModules, `${baseFileName} ${extension}.xml`)
    let xml = {} as XmlGeneric
    if (fileExists(fileName)) {
        const fileXmlData = readTextFile(fileName)
        xml = (convert.xml2js(fileXmlData, { compact: true }) as ElementCompact).ModuleTemplate as XmlGeneric
    }

    return xml
}

/**
 * Ship data per xml file
 */
const convertXML = (elements: ElementMap, fileData: XmlGeneric): ShipDataFromXML => {
    const ship = {} as ShipDataFromXML

    // Retrieve additional data per attribute pair
    for (const pair of fileData.Attributes.Pair) {
        const key = pair.Key._text
        // Check if pair is considered additional data
        if (!elements.has(key)) {
            continue
        }

        const value = Number((pair.Value.Value as TextEntity)._text)
        const { group, element } = elements.get(key) as { [p: string]: string; group: string; element: string }
        ship[group] ??= {}

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        ship[group][element] = value

        // Add calculated mast thickness
        if (key === "MAST_THICKNESS") {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ship[group].middleThickness = value * middleMastThicknessRatio
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            ship[group].topThickness = value * topMastThicknessRatio
        }

        // Set default value for preparation per round
        if (key === "PREPARATION_BONUS_PER_ROUND") {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-plus-operands
            ship[group][element] += 18
        }

        // Set default value for morale
        if (key === "HANDBOOK_MORALE_BONUS") {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/restrict-plus-operands
            ship[group][element] += 100
        }
    }

    return ship
}

const getDataFromXMLGroupOfFiles = (fileName: string, shipId: number) => {
    let dataFromXMLGroupOfFiles: Partial<ShipDataFromXML> = { id: shipId }
    for (const file of groupOfFiles) {
        const xml = readXMLFile(fileName, file.ext)
        if (Object.keys(xml).length === 0) {
            continue
        }
        const dataFromXMLFile = convertXML(file.elements, xml)
        dataFromXMLGroupOfFiles = merge(dataFromXMLGroupOfFiles, dataFromXMLFile)
    }
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    shipDataFromXML.set(shipId, merge(shipDataFromXML.get(shipId)!, dataFromXMLGroupOfFiles) as ShipDataFromXML)
}

/**
 * Retrieve additional ship data from game files
 */
const convertShipDataFromXML = () => {
    getBaseFileNames(commonPaths.directoryModules)

    for (const baseFileName of baseFileNames) {
        const shipId = getShipId(baseFileName)
        const masterBaseFileName = getShipMaster(baseFileName)
        shipDataFromXML.set(shipId, {} as ShipDataFromXML)
        if (masterBaseFileName !== "") {
            getDataFromXMLGroupOfFiles(masterBaseFileName, shipId)
        }

        getDataFromXMLGroupOfFiles(baseFileName, shipId)
    }
}

/**
 * Convert ship blueprints
 */
const convertShipBlueprints = async (): Promise<void> => {
    const itemNames = getItemNames()

    const apiBlueprints = apiItems.filter(
        (apiItem) => apiItem.ItemType === "RecipeShip" && !blueprintsNotUsed.has(apiItem.Id),
    ) as unknown as APIShipBlueprint[]
    const shipBlueprints = apiBlueprints
        .map((apiBlueprint) => {
            const shipMass = getShipMass(apiBlueprint.Results[0].Template)
            return {
                id: apiBlueprint.Id,
                name: cleanName(apiBlueprint.Name).replace(" Blueprint", ""),
                wood: [{ name: "Frame", amount: apiBlueprint.WoodTypeDescs[0].Requirements[0].Amount }],
                resources: apiBlueprint.FullRequirements.filter(
                    (requirement) =>
                        !(
                            (itemNames.get(requirement.Template)?.endsWith(" Permit") ??
                                itemNames.get(requirement.Template) === "Doubloons") ||
                            itemNames.get(requirement.Template) === "Provisions"
                        ),
                )
                    .map((requirement) => ({
                        id: requirement.Template,
                        name: itemNames.get(requirement.Template)?.replace(" Log", ""),
                        amount: requirement.Amount,
                    }))
                    .sort(sortBy(["name"])),
                provisions:
                    apiBlueprint.FullRequirements.find(
                        (requirement) => itemNames.get(requirement.Template) === "Provisions",
                    )?.Amount ?? 0,
                price: apiBlueprint.GoldRequirements,
                permit:
                    apiBlueprint.FullRequirements.find((requirement) =>
                        itemNames.get(requirement.Template)?.endsWith(" Permit"),
                    )?.Amount ?? 0,
                ship: {
                    id: apiBlueprint.Results[0].Template,
                    name: itemNames.get(apiBlueprint.Results[0].Template),
                    mass: shipMass,
                },
                shipyardLevel: apiBlueprint.BuildingRequirements[0].Level + 1,
                craftLevel: apiBlueprint.RequiresLevel,
                craftXP: apiBlueprint.GivesXP,
            } as ShipBlueprint
        })
        // Sort by id
        .sort(sortBy(["id"]))

    await saveJsonAsync(commonPaths.fileShipBlueprint, shipBlueprints)
}

/*
 * Get resource ratios
 */
/*
const getShipClass = id => apiItems.find(apiItem => id === apiItem.Id).Class;
const resourceRatios = new Map(data[0].resources.map(resource => [resource.name, []]));
resourceRatios.set("Frame", []);
resourceRatios.set("Trim", []);
const excludedShips = ["GunBoat", "Le Gros Ventre Refit"];
data.filter(shipBP => !excludedShips.includes(shipBP.name))
    // .filter(shipBP => getShipClass(shipBP.ship.id) === 5)
    .forEach(shipBP => {
        const ratio = shipBP.ship.mass;
        shipBP.resources.forEach(resource => {
            const value = round(resource.amount / ratio, 4);
            resourceRatios.set(resource.name, resourceRatios.get(resource.name).concat(value));
        });
        let value = round(shipBP.frames[0].amount / ratio, 4);
        resourceRatios.set("Frame", resourceRatios.get("Frame").concat(value));
        value = round(shipBP.trims[0].amount / ratio, 4);
        resourceRatios.set("Trim", resourceRatios.get("Trim").concat(value));
        // console.log(`"${shipBP.name}";${ratio}`);
        console.log(
            `"${shipBP.name}";${shipBP.resources.map(resource => round(resource.amount / ratio, 4)).join(";")}`
        );
    });
resourceRatios.forEach((value, key) => {
    console.log(`"${key}";${d3.max(value, d => d)};${d3.median(value)}`);
});
*/

const convertShips = async (): Promise<void> => {
    convertShipDataFromAPI()
    convertShipDataFromXML()
    const shipData = [...shipDataFromAPI]
        .map(
            ([shipId, shipFromAPI]) =>
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                merge(shipFromAPI, shipDataFromXML.get(shipId)!) as ShipData,
        )
        .sort(sortBy(["id"]))

    await saveJsonAsync(commonPaths.fileShip, shipData)
}

export const convertShipData = async (): Promise<void> => {
    apiItems = getApiItems()
    cannons = readJson(commonPaths.fileCannon) as Cannon

    await convertShips()
    await convertShipBlueprints()
}
