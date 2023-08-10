import { group as d3Group } from "d3-array"
import { readdir } from "node:fs/promises"
import path from "node:path"

import { getCommonPaths } from "./common/path.js"
import { cleanName } from "./common/api.js"
import { sortBy } from "./common/sort.js"
import { readJson, removeFileASync, saveJsonAsync } from "./common/file.js"
import { serverIds } from "./common/servers.js"
import { compressExt, unCompressSync } from "./common/compress.js"
import { capitalToCounty } from "./common/constants.js"
import { findNationShortNameById, nations, nationShortNamesPerServer } from "./common/nation.js"
import type { Group, Line, Ownership, Segment } from "./@types/ownership.js"
import type { APIPort } from "./@types/api-port.js"
import type { NationList, NationShortName, OwnershipNation } from "./@types/nations.js"
import type { PowerMapList } from "./@types/power-map.js"
import type { ServerId, ServerIdList } from "./@types/server.js"

const commonPaths = getCommonPaths()
const fileExtension = `.json.${compressExt}`

let ports = {} as Map<string, Port>
let portOwnershipPerDate = {} as PowerMapList
const fileBaseNameRegex = {} as ServerIdList<RegExp>
const fileNames = {} as ServerIdList<string[]>
let numPortsDates = {} as Array<OwnershipNation<number>>
let serverId: ServerId
let currentPort: APIPort
let currentDate: string
let nationsCurrentServer: NationShortName[]

interface Port {
    name: string
    region: string
    county: string
    data: Segment[]
    id?: string
}
type RegionGroup = Map<string, CountyGroup>
type CountyGroup = Map<string, Port[]>

/**
 * Sort file names
 * @param fileNames - File names
 * @returns Sorted file names
 */
const sortFileNames = (fileNames: string[]): string[] => {
    return fileNames.sort((a, b) => {
        const ba = path.basename(a)
        const bb = path.basename(b)
        if (ba < bb) {
            return -1
        }

        if (ba > bb) {
            return 1
        }

        return 0
    })
}

const getUnixTimestamp = (date: string): number => new Date(date).getTime()

const getObject = (date: string): Segment => {
    const dateF = getUnixTimestamp(date)
    return {
        timeRange: [dateF, dateF],
        val: findNationShortNameById(currentPort.Nation),
    }
}

const initData = (): void => {
    ports.set(currentPort.Id, {
        name: cleanName(currentPort.Name),
        region: currentPort.Location,
        county: capitalToCounty.get(currentPort.CountyCapitalName) ?? "",
        data: [getObject(currentDate)],
    })
}

const getPreviousNation = (): NationShortName | "" => {
    const portData = ports.get(currentPort.Id)
    if (portData) {
        const index = portData.data.length - 1 ?? 0
        return portData.data[index].val as NationShortName
    }

    return ""
}

const setNewNation = (): void => {
    // console.log("setNewNation -> ", ports.get(currentPort.Id));
    const portData = ports.get(currentPort.Id)
    if (portData) {
        portData.data.push(getObject(currentDate))
        ports.set(currentPort.Id, portData)
    }
}

const setNewEndDate = (): void => {
    const portData = ports.get(currentPort.Id)
    if (portData) {
        // console.log("setNewEndDate -> ", ports.get(currentPort.Id), values);
        portData.data[portData.data.length - 1].timeRange[1] = getUnixTimestamp(currentDate)
        ports.set(currentPort.Id, portData)
    }
}

/**
 * Parse data and construct ports Map
 * @param serverId - Server id
 * @param portData - Port data
 */
const parseData = (serverId: ServerId, portData: APIPort[]): void => {
    // console.log("**** new currentDate", currentDate);

    const numPorts = {} as NationList<number>
    for (const nationShortname of nationsCurrentServer) {
        numPorts[nationShortname] = 0
    }

    const nationsForPowerMap = []

    for (currentPort of portData) {
        // Exclude free towns
        if (currentPort.Nation !== 9) {
            const currentNation = findNationShortNameById(currentPort.Nation)
            numPorts[currentNation] = Number(numPorts[currentNation]) + 1
            if (ports.get(currentPort.Id)) {
                // console.log("ports.get(currentPort.Id)");
                const oldNation = getPreviousNation()
                if (currentNation === oldNation) {
                    setNewEndDate()
                } else {
                    setNewNation()
                }
            } else {
                // console.log("!ports.get(currentPort.Id)");
                initData()
            }

            nationsForPowerMap.push(currentPort.Nation)
        }
    }

    // console.log(serverId, currentDate, nationsForPowerMap.length)
    portOwnershipPerDate.push([currentDate, nationsForPowerMap])

    const numPortsDate = {} as OwnershipNation<number>
    numPortsDate.date = currentDate
    for (const nationShortname of nationsCurrentServer) {
        numPortsDate[nationShortname] = numPorts[nationShortname]
    }

    numPortsDates.push(numPortsDate)
    // console.log("**** 138 -->", [serverId], ports[serverId].get("138"));
}

/**
 * Process all files
 * @param serverId - Server id
 * @param fileNames - File names
 * @returns Resolved promise
 */
const processFiles = async (serverId: ServerId, fileNames: string[]) => {
    for (const file of fileNames) {
        unCompressSync(file)

        const parsedFile = path.parse(file)
        const jsonFN = path.format({ dir: parsedFile.dir, name: parsedFile.name })
        const json = readJson<APIPort[]>(jsonFN)
        currentDate = (fileBaseNameRegex[serverId].exec(path.basename(file)) ?? [])[1]
        parseData(serverId, json)

        await removeFileASync(jsonFN)
    }
}

/**
 * Write out result
 * @param serverId - Server id
 */
const writeResult = async (serverId: ServerId): Promise<void> => {
    const groups = d3Group<Port, string, string>(
        [...ports.values()],
        (d) => d.region,
        (d) => d.county,
    ) as RegionGroup

    // Convert to data structure needed for timelines-chart
    // region
    // -- group (counties)
    //    -- label (ports)
    const grouped = [...groups]
        .map(
            ([regionKey, regionValue]) =>
                ({
                    region: regionKey,
                    data: [...regionValue]
                        .map(
                            ([countyKey, countyValue]) =>
                                ({
                                    group: countyKey,
                                    data: countyValue
                                        .map((port) => {
                                            return {
                                                label: port.name,
                                                data: port.data,
                                            } as Line
                                        })
                                        .sort(sortBy(["label"])),
                                }) as Group,
                        )
                        .sort(sortBy(["group"])),
                }) as Ownership,
        )
        .sort(sortBy(["region"]))

    await saveJsonAsync(path.resolve(commonPaths.dirGenServer, `${serverId}-ownership.json`), grouped)
    await saveJsonAsync(path.resolve(commonPaths.dirGenServer, `${serverId}-nation.json`), numPortsDates)
    await saveJsonAsync(path.resolve(commonPaths.dirGenServer, `${serverId}-power.json`), portOwnershipPerDate)
}

/**
 * Retrieve port data for nation/clan ownership
 * @param serverId - Server id
 */
const convertOwnership = async (serverId: ServerId): Promise<void> => {
    ports = new Map()
    numPortsDates = []
    portOwnershipPerDate = []
    nationsCurrentServer = nationShortNamesPerServer.get(serverId) ?? []

    try {
        const files = await readdir(commonPaths.dirAPI, { recursive: true, withFileTypes: true })
        fileNames[serverId] = files
            .filter((file) => file.isFile() && file.name.match(fileBaseNameRegex[serverId]))
            .map((file) => `${file.path}/${file.name}`)
        sortFileNames(fileNames[serverId])
        await processFiles(serverId, fileNames[serverId])
        await writeResult(serverId)
    } catch (error: unknown) {
        throw new Error(error as string)
    }
}

export const convertOwnershipData = async () => {
    for (serverId of serverIds) {
        fileBaseNameRegex[serverId] = new RegExp(`${serverId}-Ports-(20\\d{2}-\\d{2}-\\d{2})${fileExtension}`)
        await convertOwnership(serverId)
    }
}
