import type { Feature, FeatureCollection, Point as GJPoint, GeometryCollection, MultiPoint, Position } from "geojson"
import polylabel from "polylabel"

import type {
    APIPort,
    PortElementsSlotGroupsEntity,
    PortPosition,
    PortRaidSpawnPointsEntity,
} from "./@types/api-port.js"
import type { Coordinate, PointTuple } from "./@types/coordinates.js"
import type { PbZone, PortBasic } from "./@types/ports.js"
import { cleanName } from "./common/api.js"
import { capitalToCounty, degreesHalfCircle, mapSize } from "./common/constants.js"
import { convertCoordX, convertCoordY, rotationAngleInDegrees } from "./common/coordinates.js"
import { getAPIFilename, readJson, saveJsonAsync } from "./common/file.js"
import { getCommonPaths } from "./common/path.js"
import { serverIds } from "./common/servers.js"
import { sortBy } from "./common/sort.js"
import { currentServerStartDate as serverDate } from "./common/time.js"

const commonPaths = getCommonPaths()

let apiPorts = [] as APIPort[]
let apiPortPos = new Map<number, Coordinate>()

const counties = new Map()
const regions = new Map()
const geoJsonRegions: FeatureCollection<MultiPoint> = { type: "FeatureCollection", features: [] }
const geoJsonCounties: FeatureCollection<MultiPoint> = { type: "FeatureCollection", features: [] }

// Adjust for openlayers (top left is not [0,0] but [0,mapSize])
const coordinateAdjust = (x: number | PointTuple | PointTuple[], y?: number): PointTuple | PointTuple[] => {
    if (Array.isArray(x)) {
        if (Array.isArray(x[0])) {
            return (x as PointTuple[]).map((element: PointTuple) => [element[0], mapSize - element[1]] as PointTuple)
        } else {
            return [(x as PointTuple)[0], mapSize - (x as PointTuple)[1]]
        }
    }

    if (y != null) {
        return [x, mapSize - y]
    }

    throw Error(`Wrong parameters x: ${x}, y: ${y}`)
}

const setAndSavePortData = async (): Promise<void> => {
    /**
     * Main port data
     */

    const ports = apiPorts
        .map((apiPort) => {
            /**
             * PortPosition of the port battle circle A
             */
            const circleAPos = [
                Math.trunc(convertCoordX(apiPort.PortBattleZonePositions[0].x, apiPort.PortBattleZonePositions[0].z)),
                Math.trunc(convertCoordY(apiPort.PortBattleZonePositions[0].x, apiPort.PortBattleZonePositions[0].z)),
            ] as PointTuple
            const { x, y } = apiPortPos.get(Number(apiPort.Id)) ?? { x: 0, y: 0 }
            const angle = Math.round(rotationAngleInDegrees([x, y], circleAPos))
            return {
                id: Number(apiPort.Id),
                name: cleanName(apiPort.Name),
                coordinates: [x, y],
                angle,
                region: apiPort.Location,
                countyCapitalName: cleanName(apiPort.CountyCapitalName),
                county: capitalToCounty.has(apiPort.CountyCapitalName)
                    ? capitalToCounty.get(apiPort.CountyCapitalName)
                    : "",
                countyCapital: apiPort.Name === apiPort.CountyCapitalName,
                shallow: apiPort.Depth === 1,
                brLimit: apiPort.PortBattleBRLimit,
                portPoints: apiPort.PortPoints,
                portBattleType: apiPort.PortBattleType,
            } as PortBasic
        })
        .sort(sortBy(["id"]))

    await saveJsonAsync(commonPaths.filePort, ports)
    await saveJsonAsync(
        commonPaths.filePortTwo,
        ports.map((port) => ({ ...port, coordinates: coordinateAdjust(port.coordinates) })),
    )
}

const getPBCircles = (portBattleZonePositions: PortPosition[]): PointTuple[] =>
    portBattleZonePositions.map((pbCircle) => [
        Math.trunc(convertCoordX(pbCircle.x, pbCircle.z)),
        Math.trunc(convertCoordY(pbCircle.x, pbCircle.z)),
    ])

const getForts = (portElementsSlotGroups: PortElementsSlotGroupsEntity[]): PointTuple[] =>
    portElementsSlotGroups
        .filter((portElement) => portElement.TemplateName === "Fort2")
        .flatMap((portElement): PointTuple[] =>
            portElement.PortElementsSlots.map((d) => [
                Math.trunc(convertCoordX(d.Position.x, d.Position.z)),
                Math.trunc(convertCoordY(d.Position.x, d.Position.z)),
            ]),
        )

const getTowers = (portElementsSlotGroups: PortElementsSlotGroupsEntity[]): PointTuple[] =>
    portElementsSlotGroups
        .filter((portElement) => portElement.TemplateName !== "Fort2")
        .flatMap((portElement): PointTuple[] =>
            portElement.PortElementsSlots.map((d) => [
                Math.trunc(convertCoordX(d.Position.x, d.Position.z)),
                Math.trunc(convertCoordY(d.Position.x, d.Position.z)),
            ]),
        )

const getJoinCircle = (id: number, rotation: number): PointTuple => {
    const { x: x0, y: y0 } = apiPortPos.get(id) ?? { x: 0, y: 0 }
    const distance = 5
    const degrees = degreesHalfCircle - rotation
    const radians = (degrees * Math.PI) / degreesHalfCircle
    const x1 = Math.trunc(x0 + distance * Math.sin(radians))
    const y1 = Math.trunc(y0 + distance * Math.cos(radians))

    return [x1, y1]
}

const spawnPoints = new Set([1, 2])
const getSpawnPoints = (portRaidSpawnPoints: PortRaidSpawnPointsEntity[]): PointTuple[] =>
    portRaidSpawnPoints
        .filter((_, i) => spawnPoints.has(i))
        .map((raidPoint) => [
            Math.trunc(convertCoordX(raidPoint.Position.x, raidPoint.Position.z)),
            Math.trunc(convertCoordY(raidPoint.Position.x, raidPoint.Position.z)),
        ])

const getRaidCircles = (portRaidZonePositions: PortPosition[]): PointTuple[] =>
    portRaidZonePositions.map((raidCircle) => [
        Math.trunc(convertCoordX(raidCircle.x, raidCircle.z)),
        Math.trunc(convertCoordY(raidCircle.x, raidCircle.z)),
    ])

const getRaidPoints = (portRaidSpawnPoints: PortRaidSpawnPointsEntity[]): PointTuple[] =>
    portRaidSpawnPoints.map((raidPoint) => [
        Math.trunc(convertCoordX(raidPoint.Position.x, raidPoint.Position.z)),
        Math.trunc(convertCoordY(raidPoint.Position.x, raidPoint.Position.z)),
    ])

const setAndSavePBZones = async (): Promise<void> => {
    const ports = apiPorts
        .filter((port) => !port.NonCapturable)
        .map((port) => {
            const { x, y } = apiPortPos.get(Number(port.Id)) ?? { x: 0, y: 0 }
            return {
                id: Number(port.Id),
                position: [x, y],
                pbCircles: getPBCircles(port.PortBattleZonePositions),
                forts: getForts(port.PortElementsSlotGroups),
                towers: getTowers(port.PortElementsSlotGroups),
                joinCircle: getJoinCircle(Number(port.Id), Number(port.Rotation)),
                spawnPoints: getSpawnPoints(port.PortRaidSpawnPoints),
                raidCircles: getRaidCircles(port.PortRaidZonePositions),
                raidPoints: getRaidPoints(port.PortRaidSpawnPoints),
            } as PbZone
        })
        .sort(sortBy(["id"]))

    await saveJsonAsync(commonPaths.filePbZone, ports)
}

const setAndSavePBZonesGJ = async () => {
    /*
    const t = {
    id: 3,
    position: [4013, 1702],
    pbCircles: [
        [4002, 1700],
        [4028, 1709],
        [4016, 1682],
    ],
    forts: [[4022, 1694]],
    towers: [
        [4012, 1699],
        [4023, 1714],
    ],
    joinCircle: [4008, 1702],
    spawnPoints: [
        [3959, 1683],
        [3956, 1722],
    ],
    raidCircles: [
        [4006, 1700],
        [4017, 1714],
        [4026, 1687],
    ],
    raidPoints: [
        [3999, 1639],
        [3959, 1683],
        [3956, 1722],
        [4011, 1756],
    ],
}
     */
    const features: Feature[] = []
    apiPorts.map((port) => {
        const { x, y } = apiPortPos.get(Number(port.Id)) ?? { x: 0, y: 0 }
        const feature: Feature<GeometryCollection> = {
            type: "Feature",
            id: port.Id,
            geometry: {
                type: "GeometryCollection",
                geometries: [
                    // Center
                    {
                        type: "Point",
                        coordinates: coordinateAdjust(x, y) as Position,
                    },
                    // Port battle circles
                    {
                        type: "MultiPoint",
                        coordinates: coordinateAdjust(getPBCircles(port.PortBattleZonePositions)) as Position[],
                    },
                    // Forts
                    {
                        type: "MultiPoint",
                        coordinates: coordinateAdjust(getForts(port.PortElementsSlotGroups)) as Position[],
                    },
                    // Join circle
                    {
                        type: "Point",
                        coordinates: coordinateAdjust(
                            getJoinCircle(Number(port.Id), Number(port.Rotation)),
                        ) as Position,
                    },
                    // Spawn points
                    {
                        type: "MultiPoint",
                        coordinates: coordinateAdjust(getSpawnPoints(port.PortRaidSpawnPoints)) as Position[],
                    },
                ],
            },
            properties: { name: port.Name },
        }

        features.push(feature)
    })
    const geoJson: FeatureCollection = { type: "FeatureCollection", features }
    await saveJsonAsync(commonPaths.filePbZoneGJ, geoJson)
}

/**
 *
 * @param countyCapitalName - County capital name
 * @param portPos - Port screen x/y coordinates.
 */
const setCountyFeature = (countyCapitalName: string, portPos: PointTuple): void => {
    const countyName = capitalToCounty.has(countyCapitalName) ? capitalToCounty.get(countyCapitalName) : ""
    if (countyName === "") {
        return
    }

    if (counties.has(countyName)) {
        const countyGJ: Feature<MultiPoint> | undefined = geoJsonCounties.features.find(
            (countyFeature) => countyFeature.id === countyName,
        )
        countyGJ?.geometry.coordinates.push(portPos)
    } else {
        counties.set(countyName, countyName)

        const feature: Feature<MultiPoint> = {
            type: "Feature",
            id: countyName,
            geometry: {
                type: "MultiPoint",
                coordinates: [portPos],
            },
            properties: { name: countyName },
        }
        geoJsonCounties.features.push(feature)
    }
}

/**
 *
 * @param locationName - Location name
 * @param portPos - Port screen x/y coordinates.
 */
const setRegionFeature = (locationName: string, portPos: PointTuple): void => {
    // noinspection DuplicatedCode
    if (regions.has(locationName)) {
        geoJsonRegions.features
            .filter((region) => region.id === locationName)
            .some((region) => region.geometry.coordinates.push(portPos))
    } else {
        regions.set(locationName, locationName)

        const feature: Feature<MultiPoint> = {
            type: "Feature",
            id: locationName,
            geometry: {
                type: "MultiPoint",
                coordinates: [portPos],
            },
            properties: { name: locationName },
        }
        geoJsonRegions.features.push(feature)
    }
}

const setAndSaveCountyRegionData = async (): Promise<void> => {
    for (const apiPort of apiPorts) {
        const { x, y } = apiPortPos.get(Number(apiPort.Id)) ?? { x: 0, y: 0 }
        setCountyFeature(apiPort.CountyCapitalName, [x, y])
        setRegionFeature(apiPort.Location, [x, y])
    }

    await saveJsonAsync(`${commonPaths.dirGenGeneric}/regions.json`, geoJsonRegions)
    await saveJsonAsync(`${commonPaths.dirGenGeneric}/counties.json`, geoJsonCounties)

    const regionLabels: Feature<GJPoint>[] = []
    for (const region of geoJsonRegions.features) {
        // @ts-expect-error polylabel params
        const label = polylabel([region.geometry.coordinates], 1) as number[] & { distance: number }
        regionLabels.push({
            type: region.type,
            id: region.id,
            geometry: {
                type: "Point",
                coordinates: label.map((coordinate) => Math.trunc(coordinate)),
            },
            properties: region.properties,
        })
    }

    await saveJsonAsync(`${commonPaths.dirGenGeneric}/region-labels.json`, regionLabels)

    const countyLabels: Feature<GJPoint>[] = []
    for (const county of geoJsonCounties.features) {
        // @ts-expect-error polylabel params
        const label = polylabel([county.geometry.coordinates], 1) as number[] & { distance: number }

        countyLabels.push({
            type: county.type,
            id: county.id,
            geometry: {
                type: "Point",
                coordinates: label.map((coordinate) => Math.trunc(coordinate)),
            },
            properties: county.properties,
        })
    }

    await saveJsonAsync(`${commonPaths.dirGenGeneric}/county-labels.json`, countyLabels)
}

// const getPortName = (portId: number): string => apiPorts.find(({ Id }) => Number(Id) === portId)?.Name ?? "n/a"

/**
 * Find all port with the same distance to two or more ports
 */
/*
const getEquidistantPorts = async (): Promise<void> => {
    const distancesFile = path.resolve(commonPaths.dirGenGeneric, `distances-${distanceMapSize}.json`)
    const distances = (readJson(distancesFile) as unknown) as Distance[]
    const distancesMap = new Map()

    distances.forEach(distance => {
        // const newPortRelation = [distance[0], distance[1]];
        const newPortRelation = `${getPortName(distance[0])} -> ${getPortName(distance[1])}`
        // const key = `${distance[2]}-${distance[0]}`;
        const key = `${getPortName(distance[0])} (${distance[2]})`

        let portRelations = distancesMap.get(key)
        if (portRelations) {
            portRelations.push(newPortRelation)
        } else {
            portRelations = [newPortRelation]
        }

        distancesMap.set(key, portRelations)
    })

    const out = [...distancesMap].filter(([, values]) => values.length > 1)
    await saveJsonAsync("equidistant-ports.json", out)
}
*/

export const convertGenericPortData = (): void => {
    apiPorts = readJson(getAPIFilename(`${serverIds[0]}-Ports-${serverDate}.json`)) as APIPort[]

    apiPortPos = new Map(
        apiPorts.map((apiPort) => [
            Number(apiPort.Id),
            {
                x: Math.trunc(convertCoordX(apiPort.Position.x, apiPort.Position.z)),
                y: Math.trunc(convertCoordY(apiPort.Position.x, apiPort.Position.z)),
            },
        ]),
    )

    void setAndSavePortData()
    void setAndSavePBZones()
    void setAndSavePBZonesGJ()
    void setAndSaveCountyRegionData()
}
