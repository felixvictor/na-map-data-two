import { cDashEn, cSpaceNarrowNoBreaking } from "./constants.js"
import { capitalizeFirstLetter } from "./format.js"

export const levelDivider = `${cSpaceNarrowNoBreaking}${cDashEn}${cSpaceNarrowNoBreaking}`

export const cleanName = (name: string): string =>
    name
        .replaceAll(/u([\da-f]{4})/gi, (match) => String.fromCodePoint(Number.parseInt(match.replaceAll("u", ""), 16)))
        .replaceAll("'", "’")
        .replaceAll(" - ", levelDivider)
        .replace(" oak", " Oak")
        .replace("  ", " ")
        .trim()

export const cleanItemName = (name: string): string => capitalizeFirstLetter(cleanName(name).toLocaleLowerCase())
