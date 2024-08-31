import fs from "node:fs"
import path from "node:path"
import type { ElementCompact } from "xml-js"
import convert from "xml-js"

import type { Cannon, CannonEntity, CannonPenetration, CannonType, CannonValue } from "./@types/cannons.js"
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
    const fileName = path.resolve(commonPaths.dirModules, baseFileName)
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
        // noinspection OverlyComplexBooleanExpressionJS
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
])

const cannons = {} as Cannon
for (const type of cannonType) {
    cannons[type] = []
}

const defenseFamily = new Set(["fort", "tower"])
const familyIgnored = ["standard", "unicorn", "useless"]

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
            .replace(/^(\d+) - (\w+)$/g, "$1 ($2)")
            .replace(/^(\d+) (\w+)$/g, "$1 ($2)")
            .replace(/^Tower (\d+)$/g, "$1 (Tower)")
            // Edinorog are 18lb now
            .replace("24 (Edinorog)", "18 (Edinorog)")
            .replace(" (Medium)", "")

    const cannon = {} as CannonEntity
    for (const [value, { group, element }] of dataMapping) {
        if (!Object.hasOwn(cannon, group)) {
            // @ts-expect-error typing multi-dim objects
            cannon[group] = {}
        }

        // @ts-expect-error typing multi-dim objects
        cannon[group][element] = {
            value: Number(
                (fileData.Attributes.Pair.find((pair) => pair.Key._text === value)?.Value.Value as TextEntity)._text,
            ),
        } as CannonValue
    }

    // Calculate penetrations
    const type = getType()
    const penetrations = new Map<number, number>(
        (
            fileData.Attributes.Pair.find((pair: PairEntity) => pair.Key._text === "CANNON_PENETRATION_DEGRADATION")
                ?.Value.Value as TangentEntity[]
        ).map((penetration) => [Number(penetration.Time._text) * 1000, Number(penetration.Value._text)]),
    )

    const interpolate = (lowerDist: number, higherDist: number, targetDist: number): number => {
        const lowerPene = penetrations.get(lowerDist) ?? 1
        const higherPene = penetrations.get(higherDist) ?? 1
        return lowerPene + ((targetDist - lowerDist) * (higherPene - lowerPene)) / (higherDist - lowerDist)
    }

    if (type === "long") {
        penetrations.set(100, interpolate(0, 1100, 100))
        penetrations.set(1000, interpolate(0, 1100, 1000))
        penetrations.set(1250, interpolate(1100, 1500, 1250))
    } else if (type === "medium") {
        penetrations.set(750, interpolate(700, 800, 750))
        penetrations.set(1000, interpolate(800, 1500, 1000))
        penetrations.set(1250, interpolate(800, 1500, 1250))
    } else {
        penetrations.set(750, interpolate(700, 800, 750))
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

    cannon.name = getName()
    cannon.family = getFamily(cannon.name)
    if (
        !familyIgnored.includes(cannon.family) &&
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
    getBaseFileNames(commonPaths.dirModules)

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
                // @ts-expect-error typing multi-dim objects
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
                // @ts-expect-error typing multi-dim objects
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
