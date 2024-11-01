import type {
    attackerNationShortName,
    nationFullName,
    nationShortName,
    nationShortNameAlternative,
    portBattleNationShortName,
} from "../common/nation.js"
import type { ArrayIndex } from "./index.js"

export interface Nation {
    id: number
    short: NationShortName // Short name
    name: NationFullName // Name
    sortName: string // Name for sorting
    colours: string[]
}

export type NationShortName = (typeof nationShortName)[number]
export type NationShortNameList<T> = Record<NationShortName, T>
export type PortBattleNationShortName = (typeof portBattleNationShortName)[number]
export type AttackerNationShortName = (typeof attackerNationShortName)[number]
export type NationShortNameAlternative = (typeof nationShortNameAlternative)[number]
export type NationFullName = (typeof nationFullName)[number]

export type NationListOptional<T> = Partial<Record<NationShortName, ArrayIndex<T | undefined>>>
export type NationArrayList<T> = Record<NationShortName, ArrayIndex<T>>
export type NationList<T> = T & Record<NationShortName, T>
export type NationListAlternative<T> = Record<NationShortName, T>
export type OwnershipNation<T> = NationList<T> & {
    date: string
    keys?: NationShortName[]
}
