import type { Feature, FeatureCollection, Point as GJPoint, MultiPoint } from "geojson"
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
import { getApiPorts } from "./common/common.js"
import { capitalToCounty, degreesHalfCircle } from "./common/constants.js"
import { convertCoordX, convertCoordY, coordinateAdjust, rotationAngleInDegrees } from "./common/coordinates.js"
import { saveJsonAsync } from "./common/file.js"
import { getCommonPaths } from "./common/path.js"
import { sortBy } from "./common/sort.js"

const commonPaths = getCommonPaths()

let apiPorts = [] as APIPort[]
let apiPortPos = new Map<number, Coordinate>()

const counties = new Set<string>()
const regions = new Set<string>()
const geoJsonRegions: FeatureCollection<MultiPoint> = { type: "FeatureCollection", features: [] }
const geoJsonCounties: FeatureCollection<MultiPoint> = { type: "FeatureCollection", features: [] }

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
                coordinates: coordinateAdjust([x, y]),
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
        .filter((_, index) => spawnPoints.has(index))
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
                position: coordinateAdjust([x, y]),
                pbCircles: coordinateAdjust(getPBCircles(port.PortBattleZonePositions)),
                forts: coordinateAdjust(getForts(port.PortElementsSlotGroups)),
                towers: coordinateAdjust(getTowers(port.PortElementsSlotGroups)),
                joinCircle: coordinateAdjust(getJoinCircle(Number(port.Id), Number(port.Rotation))),
                spawnPoints: getSpawnPoints(port.PortRaidSpawnPoints),
                raidCircles: getRaidCircles(port.PortRaidZonePositions),
                raidPoints: getRaidPoints(port.PortRaidSpawnPoints),
            } as PbZone
        })
        .sort(sortBy(["id"]))

    await saveJsonAsync(commonPaths.filePbZone, ports)
}

/**
 *
 * @param countyCapitalName - County capital name
 * @param portPos - Port screen x/y coordinates.
 */
const setCountyFeature = (countyCapitalName: string, portPos: PointTuple): void => {
    const countyName = capitalToCounty.get(countyCapitalName) ?? ""
    if (countyName === "") {
        return
    }

    if (counties.has(countyName)) {
        const countyGJ: Feature<MultiPoint> | undefined = geoJsonCounties.features.find(
            (countyFeature) => countyFeature.id === countyName,
        )
        countyGJ?.geometry.coordinates.push(portPos)
    } else {
        counties.add(countyName)

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
    if (regions.has(locationName)) {
        const regionGJ: Feature<MultiPoint> | undefined = geoJsonRegions.features.find(
            (region) => region.id === locationName,
        )
        regionGJ?.geometry.coordinates.push(portPos)
    } else {
        regions.add(locationName)

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

    await saveJsonAsync(`${commonPaths.directoryGenGeneric}/regions.json`, geoJsonRegions)
    await saveJsonAsync(`${commonPaths.directoryGenGeneric}/counties.json`, geoJsonCounties)

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

    await saveJsonAsync(`${commonPaths.directoryGenGeneric}/region-labels.json`, regionLabels)

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

    await saveJsonAsync(`${commonPaths.directoryGenGeneric}/county-labels.json`, countyLabels)
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
    apiPorts = getApiPorts()

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
    void setAndSaveCountyRegionData()
}
