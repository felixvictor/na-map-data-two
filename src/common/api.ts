import { capitalizeFirstLetter } from "./format.js"

const portNameMapping = new Map([
    ["Kemps Bay", "Kemp's Bay"],
    ["Watling", "Watlings"],
    ["Atwood", "Atwoods"],
    ["La Anguilla", "La Anguila"],
    ["Sant Iago", "Santiago de Cuba"],
    ["Manzanilla", "Manzanillo"],
    ["Cocodrillo", "Cocodrilo"],
    ["Monte Cristi", "Montecristi"],
    ["La Orchila", "La Orchilla"],
    ["Ambergrease Caye", "Ambergrease Cay"],
    ["Cuyo", "El Cuyo"],
    ["Triangles", "Triangulo"],
])

export const cleanName = (name: string): string => {
    if (portNameMapping.has(name)) {
        name = portNameMapping.get(name) ?? ""
    }

    return name
        .replaceAll(/u([\da-f]{4})/gi, (match) => String.fromCodePoint(Number.parseInt(match.replaceAll("u", ""), 16)))
        .replaceAll("'", "’")
        .replace(" oak", " Oak")
        .replace(" (S)", "${cSpaceNarrowNoBreaking}(S)")
        .trim()
}

export const cleanItemName = (name: string): string =>
    capitalizeFirstLetter(cleanName(name).toLocaleLowerCase().replace("east indian", "East Indian"))
