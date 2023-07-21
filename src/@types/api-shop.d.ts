// https://jvilk.com/MakeTypes/

/****************************
 * Shops
 */

export interface APIShop {
    Id: string
    Created: string
    Modified: string
    RegularItems: RegularItemsEntity[]
    ResourcesProduced: ProducedOrConsumedEntity[]
    ResourcesAdded: AddedEntity[]
    ResourcesConsumed: ProducedOrConsumedEntity[]
}
interface RegularItemsEntity {
    TemplateId: number
    Quantity: number
    SellPrice: number
    BuyPrice: number
    BuyContractQuantity: number
    SellContractQuantity: number
}
interface ProducedOrConsumedEntity {
    Key: number
    Value: number
}
interface AddedEntity {
    Template: number
    Amount: number
    Chance: number
    IsTrading: boolean
    Source: string
}
