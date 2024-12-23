import * as fs from "fs"
import path from "path"
import { default as PNG } from "pngjs"

import type { APIPort } from "./@types/api-port.js"
import type { Distance, PointTuple } from "./@types/coordinates.js"
import { compressExt, unCompressSync } from "./common/compress.js"
import { distanceMapSize, mapSize } from "./common/constants.js"
import { convertCoordX, convertCoordY } from "./common/coordinates.js"
import { getAPIFilename, readJson, removeFileSync, saveJsonAsync } from "./common/file.js"
import { getCommonPaths } from "./common/path.js"
import { serverIds } from "./common/servers.js"
import { currentServerStartDate as serverDate } from "./common/time.js"

type Index = number
type PixelDistance = number
type SpotType = number
type QueueValue = [Index, PixelDistance]
type GridMap = SpotType[]

class Port {
    readonly #apiPorts: APIPort[]
    readonly #numPorts: number
    readonly #portIds: number[]

    constructor() {
        this.#apiPorts = this.getAPIPorts()
        this.#portIds = this.#apiPorts.map((port: APIPort) => Number(port.Id))
        this.#numPorts = this.#portIds.length
    }

    get apiPorts(): APIPort[] {
        return this.#apiPorts
    }

    get numPorts(): number {
        return this.#numPorts
    }

    getAPIPorts() {
        const fileName = getAPIFilename(`${serverIds[0]}-Ports-${serverDate}.json`)

        unCompressSync(`${fileName}.${compressExt}`)
        const ports = readJson(fileName) as APIPort[]
        removeFileSync(fileName)
        return ports
    }

    static getCoordinates(y: number, x: number, mapScale: number): PointTuple {
        return [Math.trunc(convertCoordY(x, y) * mapScale), Math.trunc(convertCoordX(x, y) * mapScale)]
    }
}

const commonPaths = getCommonPaths()
const completedPorts: number[] = []
const distances: Distance[] = []
const distancesFile = commonPaths.fileDistances
const mapFileName = path.resolve(commonPaths.dirSrc, "map", `frontline-map-${distanceMapSize}.png`)
const port = new Port()
let map: GridMap = [] as GridMap
let mapHeight = 0
let mapOffset = 0
let mapScale = 0
let mapWidth = 0
let neighbours: number[] = []
let pngData: Buffer
let FLAGS = 0
let LAND = 0
let VISITED = 0
let WATER = 0

const setBitFlags = (): void => {
    const bitsAvailable = 16
    const bitsForPortIds = Number(port.numPorts).toString(2).length + 1

    if (bitsForPortIds + 3 > bitsAvailable) {
        const errorMessage = `Too few bits: available ${bitsAvailable} bits, needed ${bitsForPortIds + 3} bits`
        throw new Error(errorMessage)
    }

    WATER = 1 << bitsForPortIds
    LAND = WATER << 1
    VISITED = LAND << 1
    FLAGS = LAND | WATER | VISITED
}

const readMap = (): void => {
    // Read map file
    const fileData = fs.readFileSync(mapFileName)
    // Read map file content as png
    const png = PNG.PNG.sync.read(fileData)

    mapHeight = png.height // y
    mapWidth = png.width // x
    mapScale = mapWidth / mapSize
    pngData = png.data
    mapOffset = Math.ceil(Math.log2(mapWidth))
    neighbours = [-mapWidth - 1, -mapWidth, -mapWidth + 1, -1, 1, mapWidth - 1, mapWidth, mapWidth + 1]

    console.log(mapHeight, mapWidth)
}

const mapInit = (): void => {
    /**
     * Convert png to map (black --\> spot type 'land', white --\> spot type 'water')
     */
    map = [...new Uint16Array(mapWidth * mapHeight)].map((_, index) => (pngData[index << 2] > 127 ? WATER : LAND))
}

/*
 * Add port id to port entrances
 */
const setPorts = (): void => {
    for (const {
        Id,
        EntrancePosition: { z: y, x },
    } of port.apiPorts) {
        const [portY, portX] = Port.getCoordinates(y, x, mapScale)
        map[getIndex(portY, portX)] = Number(Id)
    }
}

/**
 *  Set map borders as visited
 */
const setBorders = (): void => {
    // Define outer bounds (map grid covers [0, mapSize-1])
    const minY = 0
    const maxY = mapHeight - 1
    const minX = 0
    const maxX = mapWidth - 1

    for (let y = minY; y <= maxY; y += maxY) {
        for (let x = minX; x <= maxX; x += 1) {
            // Visit
            map[getIndex(y, x)] |= VISITED
        }
    }

    for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += maxX) {
            // Visit
            map[getIndex(y, x)] |= VISITED
        }
    }
}

const resetVisitedSpots = (): void => {
    const minY = 1
    const maxY = mapHeight - 2
    const minX = 1
    const maxX = mapWidth - 2

    for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
            // Reset visit
            map[getIndex(y, x)] &= ~VISITED
        }
    }
}

/**
 * Find the shortest paths between start port and all other ports (breadth first search).
 */
const findPaths = (
    startPortId: number, // Start port id
    startY: number, // Start port y position
    startX: number, // Start port x position
): void => {
    const foundPortIds: number[] = []
    resetVisitedSpots()

    // Add start port
    const startIndex = getIndex(startY, startX)
    completedPorts.push(startPortId)
    // Visit
    map[startIndex] |= VISITED

    // Queue holds unchecked positions ([index, distance from start port])
    let queue: QueueValue[] = [[startIndex, 0]]
    let queueOffset = 0

    while (foundPortIds.length + completedPorts.length < port.numPorts && queue.length > 0) {
        // eslint-disable-next-line prefer-const
        let [index, pixelDistance] = queue[queueOffset]
        queueOffset++

        if (queueOffset * 2 >= queue.length) {
            queue = queue.slice(queueOffset)
            queueOffset = 0
        }

        const spot = map[index] & ~FLAGS

        // Check if port is found
        if (spot > startPortId) {
            // console.log([startPortId, portId, index, pixelDistance])
            distances.push([startPortId, spot, pixelDistance])
            foundPortIds.push(spot)
        }

        pixelDistance++

        // Check all eight neighbour positions
        for (const neighbour of neighbours) {
            const neighbourIndex: Index = index + neighbour
            // Add not visited non-land neighbour index
            if (map[neighbourIndex] <= WATER) {
                // Visit
                map[neighbourIndex] |= VISITED
                queue.push([neighbourIndex, pixelDistance])
            }
        }
    }

    // Check for missing ports
    if (foundPortIds.length + completedPorts.length < port.numPorts) {
        console.error("Only", foundPortIds.length + completedPorts.length, "of all", port.numPorts, "ports found!")
    }
}

/**
 *  Calculate distances between all ports
 */
const getAndSaveDistances = async (): Promise<void> => {
    try {
        console.time("findPath")
        for (const fromPort of port.apiPorts.sort((a: APIPort, b: APIPort) => Number(a.Id) - Number(b.Id))) {
            const fromPortId = Number(fromPort.Id)
            const {
                EntrancePosition: { z: y, x },
                Name: name,
            } = fromPort
            const [fromPortY, fromPortX] = Port.getCoordinates(y, x, mapScale)

            findPaths(fromPortId, fromPortY, fromPortX)

            console.timeLog("findPath", `${fromPortId} ${name} (${fromPortY}, ${fromPortX})`)
        }

        console.timeEnd("findPath")

        await saveJsonAsync(
            distancesFile,
            distances.sort((a, b) => {
                if (a[0] === b[0]) {
                    return a[1] - b[1]
                }

                return a[0] - b[0]
            }),
        )
    } catch (error: unknown) {
        console.error("Map distance error:", error)
    }
}

const getIndex = (y: number, x: number): Index => (y << mapOffset) + x

setBitFlags()
readMap()
mapInit()
setPorts()
setBorders()
await getAndSaveDistances()
