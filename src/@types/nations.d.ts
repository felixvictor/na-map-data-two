import type {
    attackerNationShortName,
    nationFullName,
    nationShortName,
    nationShortNameAlternative,
    portBattleNationShortName,
} from "./constants.js"
import type { ArrayIndex } from "./index.js"

export interface Nation {
    id: number
    short: NationShortName // Short name
    name: NationFullName // Name
    sortName: string // Name for sorting
    colours: string[]
}

export type NationShortName = (typeof nationShortName)[number]
export type NationShortNameList<T> = {
    [K in NationShortName]: T
}
export type PortBattleNationShortName = (typeof portBattleNationShortName)[number]
export type AttackerNationShortName = (typeof attackerNationShortName)[number]
export type NationShortNameAlternative = (typeof nationShortNameAlternative)[number]
export type NationFullName = (typeof nationFullName)[number]

export type NationListOptional<T> = {
    [K in NationShortName]?: ArrayIndex<T | undefined>
}
export type NationArrayList<T> = {
    [K in NationShortName]: ArrayIndex<T>
}
export type NationList<T> = T & {
    [K in NationShortName]: T
}
export type NationListAlternative<T> = {
    [K in NationShortName | NationShortNameAlternative]: T
}
export type OwnershipNation<T> = NationList<T> & {
    date: string
    keys?: NationShortName[]
}
