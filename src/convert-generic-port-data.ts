import polylabel from "polylabel"
import { getCommonPaths } from "./common/path.js"
import { convertCoordX, convertCoordY, rotationAngleInDegrees } from "./common/coordinates.js"
import { cleanName } from "./common/api.js"
import { sortBy } from "./common/sort.js"
import { getAPIFilename, readJson, saveJsonAsync } from "./common/file.js"
import { degreesHalfCircle } from "./common/constants.js"
import { serverIds } from "./common/servers.js"
import { currentServerStartDate as serverDate } from "./common/time.js"
import { capitalToCounty } from "./@types/constants.js"
import type { Coordinate, Point } from "./@types/coordinates.js"
import type {
    APIPort,
    PortElementsSlotGroupsEntity,
    PortPosition,
    PortRaidSpawnPointsEntity,
} from "./@types/api-port.js"
import type { FeaturesEntity, GeoJson } from "./@types/region-labels.js"
import type { PbZone, PortBasic } from "./@types/ports.js"

const commonPaths = getCommonPaths()

let apiPorts = [] as APIPort[]
let apiPortPos: Map<number, Coordinate> = new Map()

const counties = new Map()
const regions = new Map()
const geoJsonRegions = { type: "FeatureCollection", features: [] } as GeoJson
const geoJsonCounties = { type: "FeatureCollection", features: [] } as GeoJson

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
            ] as Point
            const { x, y } = apiPortPos.get(Number(apiPort.Id))!
            const angle = Math.round(rotationAngleInDegrees([x, y], circleAPos))
            const coordinates = apiPortPos.get(Number(apiPort.Id))!
            return {
                id: Number(apiPort.Id),
                name: cleanName(apiPort.Name),
                coordinates: [coordinates.x, coordinates.y],
                angle,
                region: apiPort.Location,
                countyCapitalName: cleanName(apiPort.CountyCapitalName),
                county: capitalToCounty.has(apiPort.CountyCapitalName)
                    ? capitalToCounty.get(apiPort.CountyCapitalName)
                    : "",
                countyCapital: apiPort.Name === apiPort.CountyCapitalName,
                shallow: apiPort.Depth === 1,
                brLimit: apiPort.PortBattleBRLimit,
                capturable: !apiPort.NonCapturable,
                portPoints: apiPort.PortPoints,
                portBattleType: apiPort.PortBattleType,
            } as PortBasic
        })
        .sort(sortBy(["id"]))

    await saveJsonAsync(commonPaths.filePort, ports)
}

const getPBCircles = (portBattleZonePositions: PortPosition[]): Point[] =>
    portBattleZonePositions.map((pbCircle) => [
        Math.trunc(convertCoordX(pbCircle.x, pbCircle.z)),
        Math.trunc(convertCoordY(pbCircle.x, pbCircle.z)),
    ])

const getForts = (portElementsSlotGroups: PortElementsSlotGroupsEntity[]): Point[] =>
    portElementsSlotGroups
        .filter((portElement) => portElement.TemplateName === "Fort2")
        .flatMap((portElement): Point[] =>
            portElement.PortElementsSlots.map((d) => [
                Math.trunc(convertCoordX(d.Position.x, d.Position.z)),
                Math.trunc(convertCoordY(d.Position.x, d.Position.z)),
            ]),
        )

const getTowers = (portElementsSlotGroups: PortElementsSlotGroupsEntity[]): Point[] =>
    portElementsSlotGroups
        .filter((portElement) => portElement.TemplateName !== "Fort2")
        .flatMap((portElement): Point[] =>
            portElement.PortElementsSlots.map((d) => [
                Math.trunc(convertCoordX(d.Position.x, d.Position.z)),
                Math.trunc(convertCoordY(d.Position.x, d.Position.z)),
            ]),
        )

const getJoinCircle = (id: number, rotation: number): Point => {
    const { x: x0, y: y0 } = apiPortPos.get(id)!
    const distance = 5
    const degrees = degreesHalfCircle - rotation
    const radians = (degrees * Math.PI) / degreesHalfCircle
    const x1 = Math.trunc(x0 + distance * Math.sin(radians))
    const y1 = Math.trunc(y0 + distance * Math.cos(radians))

    return [x1, y1]
}

const spawnPoints = new Set([1, 2])
const getSpawnPoints = (portRaidSpawnPoints: PortRaidSpawnPointsEntity[]): Point[] =>
    portRaidSpawnPoints
        .filter((raidPoint, i) => spawnPoints.has(i))
        .map((raidPoint) => [
            Math.trunc(convertCoordX(raidPoint.Position.x, raidPoint.Position.z)),
            Math.trunc(convertCoordY(raidPoint.Position.x, raidPoint.Position.z)),
        ])

const getRaidCircles = (portRaidZonePositions: PortPosition[]): Point[] =>
    portRaidZonePositions.map((raidCircle) => [
        Math.trunc(convertCoordX(raidCircle.x, raidCircle.z)),
        Math.trunc(convertCoordY(raidCircle.x, raidCircle.z)),
    ])

const getRaidPoints = (portRaidSpawnPoints: PortRaidSpawnPointsEntity[]): Point[] =>
    portRaidSpawnPoints.map((raidPoint) => [
        Math.trunc(convertCoordX(raidPoint.Position.x, raidPoint.Position.z)),
        Math.trunc(convertCoordY(raidPoint.Position.x, raidPoint.Position.z)),
    ])

const setAndSavePBZones = async (): Promise<void> => {
    const ports = apiPorts
        .filter((port) => !port.NonCapturable)
        .map((port) => {
            const { x, y } = apiPortPos.get(Number(port.Id))!
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

/**
 *
 * @param countyCapitalName - County capital name
 * @param portPos - Port screen x/y coordinates.
 */
const setCountyFeature = (countyCapitalName: string, portPos: Point): void => {
    const county = capitalToCounty.has(countyCapitalName) ? capitalToCounty.get(countyCapitalName) : ""
    if (county !== "") {
        // noinspection DuplicatedCode
        if (counties.has(county)) {
            geoJsonCounties.features
                .filter((countyFeature) => countyFeature.id === county)
                .some((countyFeature) => countyFeature.geometry.coordinates.push(portPos))
        } else {
            counties.set(county, county)

            const feature = {
                type: "Feature",
                id: county,
                geometry: {
                    type: "Polygon",
                    coordinates: [portPos],
                },
            } as FeaturesEntity
            geoJsonCounties.features.push(feature)
        }
    }
}

/**
 *
 * @param location - Location name
 * @param portPos - Port screen x/y coordinates.
 */
const setRegionFeature = (location: string, portPos: Point): void => {
    // noinspection DuplicatedCode
    if (regions.has(location)) {
        geoJsonRegions.features
            .filter((region) => region.id === location)
            .some((region) => region.geometry.coordinates.push(portPos))
    } else {
        regions.set(location, location)

        const feature = {
            type: "Feature",
            id: location,
            geometry: {
                type: "Polygon",
                coordinates: [portPos],
            },
        } as FeaturesEntity
        geoJsonRegions.features.push(feature)
    }
}

const setAndSaveCountyRegionData = async (): Promise<void> => {
    for (const apiPort of apiPorts) {
        const { x, y } = apiPortPos.get(Number(apiPort.Id))!
        setCountyFeature(apiPort.CountyCapitalName, [x, y])
        setRegionFeature(apiPort.Location, [x, y])
    }

    await saveJsonAsync(`${commonPaths.dirGenGeneric}/regions.json`, geoJsonRegions)
    await saveJsonAsync(`${commonPaths.dirGenGeneric}/counties.json`, geoJsonCounties)

    for (const region of geoJsonRegions.features) {
        // @ts-expect-error polylabel
        const label = polylabel([region.geometry.coordinates], 1) as number[] & { distance: number }
        region.geometry.type = "Point"

        region.geometry.coordinates = [label.map((coordinate) => Math.trunc(coordinate)) as Point]
    }

    await saveJsonAsync(`${commonPaths.dirGenGeneric}/region-labels.json`, geoJsonRegions)

    for (const county of geoJsonCounties.features) {
        // @ts-expect-error polylabel
        const label = polylabel([county.geometry.coordinates], 1) as number[] & { distance: number }
        county.geometry.type = "Point"
        county.geometry.coordinates = [label.map((coordinate) => Math.trunc(coordinate)) as Point]
    }

    await saveJsonAsync(`${commonPaths.dirGenGeneric}/county-labels.json`, geoJsonCounties)
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
    apiPorts = readJson(getAPIFilename(`${serverIds[0]}-Ports-${serverDate}.json`))

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
