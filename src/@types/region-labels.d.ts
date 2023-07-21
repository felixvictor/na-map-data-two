import type { Point } from "../common"

export interface GeoJson {
    type: "FeatureCollection"
    features: FeaturesEntity[]
}
export interface FeaturesEntity {
    type: "Feature"
    id: string
    geometry: Geometry
}
export interface Geometry {
    type: "Point" | "Polygon"
    coordinates: Point[]
}
