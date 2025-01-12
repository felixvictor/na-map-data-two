import type { ModifiersEntity } from "./api-item.js"

export type APIModifierName = string
export type ModifierName = string

export type Module = [ModifierName, ModuleEntity[]]
export interface ModuleEntityFlatHierarchy {
    name: string
    typeHierarchyString: string
    parentType?: string
    data?: ModuleEntity
    moduleIds?: number[]
}

export interface ModuleEntity {
    id: number
    name: string
    sortingGroup?: string
    permanentType?: string
    usageType: string
    moduleLevel: string
    properties?: ModuleEntityProperties[]
    hasSamePropertiesAsPrevious?: boolean
}

export interface ModuleConvertEntity extends ModuleEntity {
    ApiModifiers: ModifiersEntity[]
    moduleType: string
}

export interface ModuleEntityProperties {
    modifier: ModifierName
    amount: number
    isPercentage: boolean
}
