import { cDashEn } from "./constants.js"
import { capitalizeFirstLetter } from "./format.js"

export const cleanName = (name: string): string =>
    name
        .replaceAll(/u([\da-f]{4})/gi, (match) => String.fromCodePoint(Number.parseInt(match.replaceAll("u", ""), 16)))
        .replaceAll("'", "’")
        .replaceAll(" - ", ` ${cDashEn} `)
        .replace(" oak", " Oak")
        .replace("  ", " ")
        .trim()

export const cleanItemName = (name: string): string => capitalizeFirstLetter(cleanName(name).toLocaleLowerCase())
