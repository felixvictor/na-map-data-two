export interface Distance extends Array<number> {
    0: number // From port id
    1: number // To port id
    2: number // Distance (in pixels)
}

export interface Point extends Array<number> {
    0: number // X coordinate
    1: number // Y coordinate
}

export type Extent = [Point, Point]

export interface Coordinate {
    x: number // X coordinate
    y: number // Y coordinate
}
