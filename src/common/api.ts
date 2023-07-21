import { capitalizeFirstLetter } from "./format"

export const cleanName = (name: string): string =>
    name
        .replace(/u([\da-f]{4})/gi, (match) => String.fromCodePoint(Number.parseInt(match.replace(/u/g, ""), 16)))
        .replace(/'/g, "’")
        .replace(" oak", " Oak")
        .replace(" (S)", "\u202F(S)")
        .trim()

export const cleanItemName = (name: string): string =>
    capitalizeFirstLetter(cleanName(name).toLocaleLowerCase().replace("east indian", "East Indian"))
