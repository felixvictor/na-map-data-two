import { cannonEntityType, cannonType, peneDistance } from "./constants"
import type { ObjectIndexer } from "./index"

export type CannonType = (typeof cannonType)[number]
export type CannonTypeList<T> = {
    [K in CannonType]: T
}
export type CannonFamily = string
export type CannonEntityType = (typeof cannonEntityType)[number]
export type PeneDistance = (typeof peneDistance)[number]

type Cannon = {
    [K in CannonType]: CannonEntity[]
}
export interface CannonEntity {
    [index: string]: string | CannonDamage | CannonFamily | CannonGeneric | CannonPenetration
    name: string
    family: CannonFamily
    damage: CannonDamage
    generic: CannonGeneric
    penetration: CannonPenetration
}
export type CannonElementIndex = CannonValue | undefined
export interface CannonDamage extends ObjectIndexer<CannonElementIndex> {
    basic: CannonValue
    "reload time": CannonValue
    splinter: CannonValue
    "per second": CannonValue
    penetration?: CannonValue
}
export interface CannonTraverse extends ObjectIndexer<CannonElementIndex> {
    up: CannonValue
    down: CannonValue
}
export interface CannonDispersion extends ObjectIndexer<CannonElementIndex> {
    horizontal: CannonValue
    vertical: CannonValue
}
export interface CannonGeneric extends ObjectIndexer<CannonElementIndex> {
    weight: CannonValue
    crew: CannonValue
}
export type CannonPenetration = {
    [K in PeneDistance]: CannonValue
}
export interface CannonValue {
    value: number
    digits?: number
}
