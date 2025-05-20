import * as console from "node:console"
import fs from "node:fs"
import path from "node:path"

import type { ElementCompact } from "xml-js"
import convert from "xml-js"

import type {
    Cannon,
    CannonDamage,
    CannonEntity,
    CannonGeneric,
    CannonPenetration,
    CannonType,
    CannonValue,
} from "./@types/cannons.js"
import { cannonType, peneDistance } from "./@types/constants.js"
import type { PairEntity, TangentEntity, TextEntity, XmlGeneric } from "./@types/xml.js"
import { readTextFile, saveJsonAsync } from "./common/file.js"
import { round } from "./common/format.js"
import { getCommonPaths } from "./common/path.js"

const commonPaths = getCommonPaths()

const countDecimals = (value: number | undefined): number => {
    if (value === undefined) {
        return 0
    }

    if (Math.floor(value) === value) {
        return 0
    }

    return value.toString().split(".")[1].length
}

/**
 * Get content of XML file in json format
 * @param baseFileName - Base file name
 * @returns File content in json format
 */
const getFileData = (baseFileName: string): XmlGeneric => {
    const fileName = path.resolve(commonPaths.directoryModules, baseFileName)
    const fileXmlData = readTextFile(fileName)

    return (convert.xml2js(fileXmlData, { compact: true }) as ElementCompact).ModuleTemplate as XmlGeneric
}

/**
 * List of file names to be read
 */
const fileNames = new Set<string>()

/**
 * Gets all files from directory <directory> and stores valid cannon/carronade file names in <fileNames>
 */
const getBaseFileNames = (directory: string): void => {
    for (const fileName of fs.readdirSync(directory)) {
        /**
         * First part of the file name containing the type
         */
        const fileNameFirstPart = fileName.slice(0, fileName.indexOf(" "))
        if (
            !fileName.endsWith("el 1.xml") &&
            ((fileNameFirstPart === "cannon" && fileName !== "cannon repair kit.xml") ||
                fileNameFirstPart === "carronade" ||
                fileNameFirstPart === "carr" ||
                fileName.startsWith("tower cannon"))
        ) {
            fileNames.add(fileName)
        }
    }
}

/**
 * Data mapping for content of the individual files.
 */
const dataMapping = new Map<string, { group: keyof CannonEntity; element: string }>([
    // ["CANNON_BLOW_CHANCE", { group: "generic", element: "blow chance" }],
    // ["HIT_PROBABILITY", { group: "damage", element: "hit probability" }],
    // ["DAMAGE_MULTIPLIER", { group: "damage", element: "multiplier" }],
    ["CANNON_BASIC_DAMAGE", { group: "damage", element: "basic" }],
    // ["CANNON_FIREPOWER", { group: "damage", element: "firepower" }],
    // ["CANNON_MIN_ANGLE", { group: "traverse", element: "up" }],
    // ["CANNON_MAX_ANGLE", { group: "traverse", element: "down" }],
    // ["CANNON_DISPERSION_PER100M", { group: "dispersion", element: "horizontal" }],
    // ["CANNON_DISPERSION_VERTICAL_PER100M", { group: "dispersion", element: "vertical" }],
    // ["CANNON_DISPERSION_REDUCTION_SPEED", { group: "dispersion", element: "reduction speed" }],
    ["CANNON_RELOAD_TIME", { group: "damage", element: "reload time" }],
    ["CANNON_MASS", { group: "generic", element: "weight" }],
    // ["DAMAGE_TYPE", { group: "damage", element: "type" }],
    // ["MODULE_BASE_HP", { group: "strength", element: "base" }],
    ["CANNON_BASIC_PENETRATION", { group: "damage", element: "penetration" }],
    // ["FIRE_PROBABILITY", { group: "generic", element: "fire probability" }],
    // ["CANNON_MASS", { group: "generic", element: "mass" }],
    // ["CANNON_BALL_RADIUS", { group: "generic", element: "ball radius" }],
    // ["CANNON_FIREZONE_HORIZONTAL_ROTATION_SPEED", { group: "dispersion", element: "horizontal rotation speed" }],
    // ["CANNON_BULLETS_PER_SHOT", { group: "generic", element: "bullets per shot" }],
    // ["CANNON_DISPERSION_REDUCTION_ANGLE_CHANGE_MULTIPLIER", { group: "dispersion", element: "reduction angle change modifier" }],
    // ["CANNON_DISPERSION_SHIP_PITCHING_MODIFIER", { group: "dispersion", element: "shi pitching modifier" }],
    // ["CANNON_FORWARD_FLY_TIME", { group: "generic", element: "forward fly time" }],
    // ["CANNON_FORWARD_FIREPOWER_LOSS", { group: "generic", element: "firepower loss" }],
    // ["CANNON_GRAVITY_MULTIPLIER", { group: "generic", element: "gravity multiplier" }],
    // ["CANNON_TYPE", { group: "generic", element: "type" }],
    // ["CANNON_CLASS", { group: "generic", element: "class" }],
    // ["ARMOR_DAMAGE_ABSORB_MULTIPLIER", { group: "strength", element: "damage absorb multiplier" }],
    ["CANNON_CREW_REQUIRED", { group: "generic", element: "crew" }],
    // ["ARMOR_THICKNESS", { group: "strength", element: "thickness" }],
    ["CANNON_BALL_ARMOR_SPLINTERS_DAMAGE_FOR_CREW", { group: "damage", element: "splinter" }],
    ["CANNON_GUNPOWDER_AMOUNT", { group: "generic", element: "gunpowder" }],
])

const cannons = {} as Cannon
for (const type of cannonType) {
    cannons[type] = []
}

const defenseFamily = new Set(["fort", "tower"])
const familyIgnored = new Set(["standard", "unicorn", "useless"])

const getFamily = (name: string): string => {
    const regex = /\s+\(?(\w+)\)?/
    let family = regex.exec(name)?.[1].toLocaleLowerCase() ?? "regular"

    if (family === "medium") {
        family = "regular"
    }

    if (defenseFamily.has(family)) {
        family = "defense"
    }

    if (name.startsWith("Carr ")) {
        family = "obusiers"
    }

    return family
}

/**
 * Add data
 * @param fileData - File data per cannon
 */
const addData = (fileData: XmlGeneric): void => {
    const getType = (): CannonType => {
        if (fileData._attributes.Name.includes("Carronade") || fileData._attributes.Name.includes("Obusiers")) {
            return "carronade"
        }

        if (
            fileData._attributes.Name.includes("Long") ||
            fileData._attributes.Name.includes("Blomfield") ||
            fileData._attributes.Name.includes("Navy Gun")
        ) {
            return "long"
        }

        // Special case 2pd standard
        if (fileData._attributes.Name === "Cannon 2 pd") {
            return "standard"
        }

        return "medium"
    }

    const getName = (): string =>
        fileData._attributes.Name.replace("Cannon ", "")
            .replace("Carr ", "")
            .replace("Carronade ", "")
            .replace(" pd", "")
            .replace(" Long", "")
            .replace("Salvaged ", "")
            .replace("0.5 E", "E")
            .replace("Blomfield", "Blomefield")
            .replace(" Gun", "")
            .replaceAll(/^(\d+) - (\w+)$/g, "$1 ($2)")
            .replaceAll(/^(\d+) (\w+)$/g, "$1 ($2)")
            .replaceAll(/^Tower (\d+)$/g, "$1 (Tower)")
            // Edinorog are 18lb now
            .replace("24 (Edinorog)", "18 (Edinorog)")
            .replace(" (Medium)", "")

    const cannon = { name: getName(), family: getFamily(getName()) } as CannonEntity

    if (cannon.name.includes("Fort") || cannon.name.includes("Tower") || cannon.name.includes("useless")) {
        return
    }

    for (const [value, { group, element }] of dataMapping) {
        if (!Object.hasOwn(cannon, group)) {
            cannon[group] = {} as string & CannonDamage & CannonGeneric & CannonPenetration
        }

        cannon[group][element] = {
            value: round(
                Number(
                    (fileData.Attributes.Pair.find((pair) => pair.Key._text === value)?.Value.Value as TextEntity)
                        ._text,
                ),
                2,
            ),
        } as CannonValue
    }

    // Calculate penetrations
    let type = getType()
    const penetrations = new Map<number, number>(
        (
            fileData.Attributes.Pair.find((pair: PairEntity) => pair.Key._text === "CANNON_PENETRATION_DEGRADATION")
                ?.Value.Value as TangentEntity[]
        ).map((penetration) => [Number(penetration.Time._text) * 1000, Number(penetration.Value._text)]),
    )

    const interpolate = (lowerDistribution: number, higherDistribution: number, targetDistribution: number): number => {
        if (lowerDistribution > higherDistribution) {
            throw new Error(`interpolate distribution ${lowerDistribution} higher than ${higherDistribution}`)
        }

        const lowerPene = penetrations.get(lowerDistribution)
        const higherPene = penetrations.get(higherDistribution)
        if (lowerPene === undefined || higherPene === undefined) {
            throw new Error(`interpolate penetrations  undefined`)
        }

        return (
            lowerPene +
            ((targetDistribution - lowerDistribution) * (higherPene - lowerPene)) /
                (higherDistribution - lowerDistribution)
        )
    }

    // Special case 2pd standard
    if (type === "standard") {
        type = "medium"
    }

    switch (type) {
        case "long": {
            penetrations.set(100, interpolate(0, 500, 100))
            penetrations.set(750, interpolate(500, 1000, 750))
            penetrations.set(1250, interpolate(1000, 2000, 1250))
            penetrations.set(1500, interpolate(1000, 2000, 1500))

            break
        }
        case "medium": {
            penetrations.set(100, interpolate(0, 400, 100))
            penetrations.set(200, interpolate(0, 400, 200))
            penetrations.set(300, interpolate(0, 400, 300))
            penetrations.set(500, interpolate(400, 1300, 500))
            penetrations.set(750, interpolate(400, 1300, 750))
            penetrations.set(1000, interpolate(400, 1300, 1000))
            penetrations.set(1250, interpolate(400, 1300, 1250))
            penetrations.set(1500, interpolate(1300, 2000, 1500))

            break
        }
        case "carronade": {
            penetrations.set(100, interpolate(0, 300, 100))
            penetrations.set(200, interpolate(0, 300, 200))
            penetrations.set(400, interpolate(300, 750, 400))
            penetrations.set(500, interpolate(300, 750, 500))
            penetrations.set(1000, interpolate(750, 1200, 1000))
            penetrations.set(1250, interpolate(1200, 1500, 1250))

            break
        }
        // No default
    }

    cannon.penetration = {} as CannonPenetration
    for (const distance of peneDistance[type]) {
        cannon.penetration[distance] = {
            value: Math.trunc((penetrations.get(distance) ?? 0) * (cannon.damage.penetration?.value ?? 0)),
        }
    }

    delete cannon.damage.penetration

    // Calculate damage per second
    cannon.damage["per second"] = {
        value: round(cannon.damage.basic.value / cannon.damage["reload time"].value, 2),
    }

    if (
        !familyIgnored.has(cannon.family) &&
        !(cannon.family === "defense" && cannon.name === "24 (Fort)") &&
        !(cannon.family === "defense" && cannon.name === "24 (Tower)")
    ) {
        cannons[type].push(cannon)
    }
}

/**
 * Retrieve cannon data from game files and store it
 */
export const convertCannons = async (): Promise<void> => {
    getBaseFileNames(commonPaths.directoryModules)

    // Get all files without a master
    for (const baseFileName of fileNames) {
        const fileData = getFileData(baseFileName)
        addData(fileData)
    }

    // Set maximum digits after decimal point
    const maxDigits = new Map<[CannonType, keyof CannonEntity, string], number>()
    for (const type of cannonType) {
        for (const cannon of cannons[type]) {
            for (const group of Object.keys(cannon)) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                for (const [elementKey, elementValue] of Object.entries<CannonValue>(cannon[group])) {
                    maxDigits.set(
                        [type, group as keyof CannonEntity, elementKey],
                        Math.max(
                            maxDigits.get([type, group as keyof CannonEntity, elementKey]) ?? 0,
                            countDecimals(elementValue.value),
                        ),
                    )
                }
            }
        }
    }

    for (const [key, value] of maxDigits) {
        const [cannonType, cannonEntityKey, elementKey] = key
        if (value > 0) {
            for (const cannon of cannons[cannonType]) {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
                cannon[cannonEntityKey][elementKey].digits = value
            }
        }
    }

    for (const type of cannonType) {
        cannons[type].sort(({ name: a }, { name: b }) => {
            // Sort either by lb numeral value when values are different
            if (Number.parseInt(a, 10) !== Number.parseInt(b, 10)) {
                return Number.parseInt(a, 10) - Number.parseInt(b, 10)
            }

            // Or sort by string
            return a.localeCompare(b)
        })
    }

    await saveJsonAsync(commonPaths.fileCannon, cannons)
}
