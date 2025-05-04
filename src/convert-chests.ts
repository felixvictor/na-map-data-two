import type {
    APIGenericLootTableItem,
    APIItemGeneric,
    APILootTableItem,
    APITimeBasedConvertibleItem,
    ItemsEntity,
} from "./@types/api-item.js"
import type { Chest, ChestItem } from "./@types/loot.js"
import { cleanName } from "./common/api.js"
import { getApiItems } from "./common/common.js"
import { saveJsonAsync } from "./common/file.js"
import { getCommonPaths } from "./common/path.js"
import { sortBy } from "./common/sort.js"

const secondsPerHour = 3600

let apiItems: APIItemGeneric[]
let itemNames: Map<number, string>

const getLootItemName = (name: string, type: string): string => {
    let cleanedName = cleanName(name)

    if (type === "Recipe" && !cleanedName.endsWith("Blueprint")) {
        cleanedName += " Blueprint"
    }

    return cleanedName
}

const getLootItems = (types: string[]) =>
    apiItems.filter((item) => !item.NotUsed && types.includes(item.ItemType)) as unknown as APIGenericLootTableItem[]

const getChestItemsChance = (chestLootTableId: number): number => {
    const lootTable = apiItems.filter((item) => Number(item.Id) === chestLootTableId) as unknown as APILootTableItem[]
    return lootTable[0]?.Items?.[0]?.Chance
}

const getChestItems = (chestItems: ItemsEntity[]): ChestItem[] =>
    chestItems.map((item) => ({
        id: Number(item.Template),
        name: itemNames.get(Number(item.Template)) ?? "",
        amount:
            Number(item.Stack.Min) === 1 && Number(item.Stack.Max) === 1
                ? undefined
                : { min: Number(item.Stack.Min), max: Number(item.Stack.Max) },
        group: Number(item.Group),
    }))

const getChestItemsFromChestLootTable = (chestLootTableId: number): ChestItem[] =>
    apiItems.filter((item) => Number(item.Id) === chestLootTableId).flatMap((item) => getChestItems(item.Items ?? []))

const convertChests = async (): Promise<void> => {
    const commonPaths = getCommonPaths()

    const chests = getLootItems(["TimeBasedConvertibleItem"]) as unknown as APITimeBasedConvertibleItem[]
    const data: Chest[] = chests
        .map(
            (item) =>
                ({
                    id: Number(item.Id),
                    name: cleanName(item.Name),
                    weight: Number(item.ItemWeight),
                    lifetime: Number(item.LifetimeSeconds) / secondsPerHour,
                    itemGroup: item.ExtendedLootTable.map((lootChestLootTableId) => ({
                        chance: getChestItemsChance(lootChestLootTableId),
                        items: getChestItemsFromChestLootTable(lootChestLootTableId).sort(sortBy(["id"])),
                    })).sort(sortBy(["chance"])),
                }) as Chest,
        )
        .sort(sortBy(["id"]))

    await saveJsonAsync(commonPaths.fileChest, data)
}

export const convertLootData = (): void => {
    apiItems = getApiItems()
    itemNames = new Map(apiItems.map((item) => [Number(item.Id), getLootItemName(item.Name, item.ItemType)]))

    void convertChests()
}
