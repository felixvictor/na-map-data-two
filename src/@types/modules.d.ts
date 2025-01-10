import type { ModifiersEntity } from "./api-item.js"

export type APIModifierName = string
export type ModifierName = string

export type Module = [ModifierName, ModuleEntity[]]
export interface ModuleEntityHierarchy {
    type: string
    typeParent: string | undefined
    sortingGroup?: string
    permanentType?: string
    typeString: string
}
export interface ModuleEntity extends ModuleEntityHierarchy {
    id: number
    name: string
    usageType: string
    moduleLevel: string
    properties?: ModulePropertiesEntity[]
    hasSamePropertiesAsPrevious?: boolean
}

export interface ModuleConvertEntity extends ModuleEntity {
    ApiModifiers: ModifiersEntity[]

    moduleType: string
}

export interface ModulePropertiesEntity {
    modifier: ModifierName
    amount: number
    isPercentage: boolean
}
