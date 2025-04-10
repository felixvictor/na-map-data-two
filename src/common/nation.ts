import type { Nation, NationShortName } from "../@types/nations.js"
import { simpleStringSort, sortBy } from "./sort.js"

export const nations: Nation[] = [
    { id: 0, short: "NT", name: "Neutral", sortName: "Neutral", colours: ["#cec1c1"] },
    { id: 1, short: "PR", name: "Pirates", sortName: "Pirates", colours: ["#352828", "#cec1c1"] },
    { id: 2, short: "ES", name: "España", sortName: "España", colours: ["#9b3438", "#c5a528"] },
    { id: 3, short: "FR", name: "France", sortName: "France", colours: ["#284e98", "#b5423a", "#cec1c1"] },
    {
        id: 4,
        short: "GB",
        name: "Great Britain",
        sortName: "Great Britain",
        colours: ["#284180", "#cec1c1", "#b13443"],
    },
    { id: 5, short: "FT", name: "Free Town", sortName: "Free Town", colours: ["#cec1c1"] },
]

export const nationShortNamesPerServer = new Map([
    ["eu1", nations.filter((nation) => nation.short !== "NT").map((nation) => nation.short)],
])
export const nationShortName: string[] = nations.map((nation) => nation.short).sort(simpleStringSort)
export const portBattleNationShortName: string[] = [...nationShortName, ""]
export const attackerNationShortName: string[] = [...portBattleNationShortName, "n/a"]
export const nationShortNameAlternative: string[] = nations.map((nation) => `${nation.short}a`).sort(simpleStringSort)
export const nationFullName: string[] = nations.sort(sortBy(["sortName"])).map((nation) => nation.name)
export const nationMap = new Map<number, Nation>(nations.map((nation) => [nation.id, nation]))

export const findNationById = (nationId: number): Nation | undefined => nationMap.get(nationId)
export const findNationShortNameById = (nationId: number): NationShortName => nationMap.get(nationId)?.short ?? ""
