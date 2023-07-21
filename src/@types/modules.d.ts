import type { ModifiersEntity } from "./api-item.js"

export type APIModifierName = string
export type ModifierName = string

export type Module = [ModifierName, ModuleEntity[]]
export interface ModuleEntity {
    id: number
    name: string
    usageType: string
    moduleLevel: string
    properties: ModulePropertiesEntity[] | undefined
    type: string
    hasSamePropertiesAsPrevious?: boolean
}
export interface ModuleConvertEntity extends ModuleEntity {
    APImodifiers: ModifiersEntity[]
    sortingGroup: string
    permanentType: string
    moduleType: string
}

export interface ModulePropertiesEntity {
    modifier: ModifierName
    amount: number
    isPercentage: boolean
}

export type CleanedModule = {
    id: number
    name: string
    usageType: string
    moduleLevel: string
    properties: ModulePropertiesEntity[] | undefined
    type: string
    hasSamePropertiesAsPrevious?: boolean | undefined
}
