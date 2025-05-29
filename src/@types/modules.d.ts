import type { ModifiersEntity } from "./api-item.js"

export type APIModifierName = string
export type ModifierName = string

export type Module = [ModifierName, ModuleEntity[]]
export interface ModuleEntityFlatHierarchy {
    name: string
    hierarchyName: string
    hierarchyString: string
    parentString: string
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
    scoreValue?: number
    pointsNeed?: number
}

export interface ModuleConvertEntity extends ModuleEntity {
    apiModifiers: ModifiersEntity[]
    moduleType: string
    sortingOverrideTemplateType: "" | "hidden"
}

export interface ModuleEntityProperties {
    modifier: ModifierName
    amount: number
    isPercentage: boolean
}
