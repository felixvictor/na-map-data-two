export interface Group {
    group: string
    data: Line[]
}

export interface Line {
    label: string
    data: Segment[]
}

export interface Segment {
    timeRange: [TS, TS]
    val: Val
}

export type TS = Date | number

// eslint-disable-next-line unicorn/prevent-abbreviations
export type Val = number | string

export interface Ownership {
    region: string
    data: Group[]
}

export interface OwnershipRegion {
    name: string
    region: string
    county: string
}

export interface OwnershipPort extends OwnershipRegion {
    data: Segment[]
    id?: string
}

export type RegionGroup = Map<string, CountyGroup>
export type CountyGroup = Map<string, OwnershipPort[]>
