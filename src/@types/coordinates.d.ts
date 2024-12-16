export interface Distance extends Array<number> {
    0: number // From port id
    1: number // To port id
    2: number // Distance (in pixels)
}

export type Extent = [Point, Point]

export interface Coordinate {
    x: number // X coordinate
    y: number // Y coordinate
}

export type PointTuple = [number, number]
