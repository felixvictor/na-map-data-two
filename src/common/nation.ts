import { simpleStringSort, sortBy } from "./sort.js"
import type { Nation } from "../@types/nations.js"
import { NationShortName } from "../@types/nations.js"

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
    {
        id: 5,
        short: "VP",
        name: "Verenigde Provinciën",
        sortName: "Verenigde Provinciën",
        colours: ["#9d3841", "#3b5688", "#cec1c1"],
    },
    { id: 6, short: "DK", name: "Danmark-Norge", sortName: "Danmark-Norge", colours: ["#9c294b", "#cec1c1"] },
    { id: 7, short: "SE", name: "Sverige", sortName: "Sverige", colours: ["#287099", "#cdad28"] },
    {
        id: 8,
        short: "US",
        name: "United States",
        sortName: "United States",
        colours: ["#282873", "#cec1c1", "#a72e47"],
    },
    { id: 9, short: "FT", name: "Free Town", sortName: "Free Town", colours: ["#cec1c1"] },
    { id: 10, short: "RU", name: "Russian Empire", sortName: "Russian Empire", colours: ["#284e98", "#cec1c1"] },
    { id: 11, short: "DE", name: "Kingdom of Prussia", sortName: "Prussia", colours: ["#352828", "#cec1c1"] },
    { id: 12, short: "PL", name: "Commonwealth of Poland", sortName: "Poland", colours: ["#c22839", "#cec1c1"] },
    { id: 13, short: "CN", name: "China", sortName: "China", colours: ["#cdad3b", "#ce2828"] },
]

export const nationShortNamesPerServer = new Map([
    [
        "eu1",
        nations
            .filter((nation) => nation.id !== 9)
            .map((nation) => nation.short)

    ],
    [
        "eu2",
        nations
            .filter((nation) => nation.id !== 9)
            .map((nation) => nation.short)
    ],
    [
        "eu3",
        nations
            .filter((nation) => nation.id < 5)
            .map((nation) => nation.short)
    ], // NT, PR, ES, FR, GB
])
export const nationShortName: string[] = nations.map((nation) => nation.short).sort(simpleStringSort)
export const portBattleNationShortName: string[] = [...nationShortName, ""]
export const attackerNationShortName: string[] = [...portBattleNationShortName, "n/a"]
export const nationShortNameAlternative: string[] = nations.map((nation) => `${nation.short}a`).sort(simpleStringSort)
export const nationFullName: string[] = nations.sort(sortBy(["sortName"])).map((nation) => nation.name)
export const nationMap = new Map<number, Nation>(nations.map((nation) => [nation.id, nation]))

export const findNationById = (nationId: number): Nation | undefined => nationMap.get(nationId)
export const findNationShortNameById = (nationId: number): NationShortName => nationMap.get(nationId)?.short ?? ""
