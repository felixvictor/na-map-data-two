export type ObjectIndexer<T> = Record<string, T>
export type ArrayIndex<T> = T[] & Record<string, T[]>

declare module "collection" {}
