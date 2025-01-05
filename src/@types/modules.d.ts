import type { ModifiersEntity } from "./api-item.js"

export type APIModifierName = string
export type ModifierName = string

export type Module = [ModifierName, ModuleEntity[]]
export interface ModuleEntity {
    id: number
    name: string
    usageType: string
    moduleLevel: string
    properties?: ModulePropertiesEntity[]
    typeString: string
    hasSamePropertiesAsPrevious?: boolean
}

export interface ModuleConvertEntity extends ModuleEntity {
    ApiModifiers: ModifiersEntity[]
    sortingGroup: string
    permanentType: string
    moduleType: string
}

export interface ModulePropertiesEntity {
    modifier: ModifierName
    amount: number
    isPercentage: boolean
}

export interface CleanedModule {
    id: number
    name: string
    usageType: string
    moduleLevel: string
    properties?: ModulePropertiesEntity[]
    typeString: string
    hasSamePropertiesAsPrevious?: boolean
}
