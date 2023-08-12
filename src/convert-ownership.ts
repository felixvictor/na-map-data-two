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
import { findNationShortNameById, nationShortNamesPerServer } from "./common/nation.js"
import type { Group, Line, Ownership, Segment } from "./@types/ownership.js"
import type { APIPort } from "./@types/api-port.js"
import type { NationList, NationShortName, OwnershipNation } from "./@types/nations.js"
import type { PowerMapList } from "./@types/power-map.js"
import type { ServerId } from "./@types/server.js"

const commonPaths = getCommonPaths()
const fileExtension = `.json.${compressExt}`

interface Port {
    name: string
    region: string
    county: string
    data: Segment[]
    id?: string
}
type RegionGroup = Map<string, CountyGroup>
type CountyGroup = Map<string, Port[]>

class PortOwnership {
    #currentDate = ""
    #currentPort = {} as APIPort
    #fileBaseNameRegex = {} as RegExp
    #fileNames = [] as string[]
    #nationsCurrentServer = [] as NationShortName[]
    #numPortsPerNationPerDates = [] as Array<OwnershipNation<number>>
    #portOwnershipPerDate = [] as PowerMapList
    #ports = new Map<string, Port>()
    #serverId = "" as ServerId

    constructor(serverId: ServerId) {
        ;(async () => {
            this.#serverId = serverId
            this.#fileBaseNameRegex = new RegExp(`${serverId}-Ports-(20(\\d{2})-(\\d{2})-(\\d{2}))${fileExtension}`)
            this.#nationsCurrentServer = nationShortNamesPerServer.get(serverId) ?? []
            await this.#convertOwnership()
        })()
    }

    /**
     * Retrieve port data for nation/clan ownership
     */
    async #convertOwnership() {
        try {
            await this.#getFilenames()
            await this.#processFiles()
            await this.#writeResult()
        } catch (error: unknown) {
            throw new Error(error as string)
        }
    }

    #sortFileNames(): string[] {
        return this.#fileNames.sort((a, b) => {
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

    async #getFilenames() {
        const files = await readdir(commonPaths.dirAPI, { recursive: true, withFileTypes: true })
        this.#fileNames = files
            .filter((file) => file.isFile() && file.name.match(this.#fileBaseNameRegex))
            .map((file) => `${file.path}/${file.name}`)
        this.#sortFileNames()
    }

    #getUnixTimestamp(date: string): number {
        return new Date(date).getTime()
    }

    #getNewSegment(): Segment {
        const dateF = this.#getUnixTimestamp(this.#currentDate)
        return {
            timeRange: [dateF, dateF],
            val: findNationShortNameById(this.#currentPort.Nation),
        }
    }

    #initData(): void {
        this.#ports.set(this.#currentPort.Id, {
            name: cleanName(this.#currentPort.Name),
            region: this.#currentPort.Location,
            county: capitalToCounty.get(this.#currentPort.CountyCapitalName) ?? "",
            data: [this.#getNewSegment()],
        })
    }

    #getPreviousNation(): NationShortName | "" {
        const portData = this.#ports.get(this.#currentPort.Id)
        if (portData) {
            const index = portData.data.length - 1 ?? 0
            return portData.data[index].val as NationShortName
        }

        return ""
    }

    #setNewNation(): void {
        // console.log("setNewNation -> ", ports.get(currentPort.Id));
        const portData = this.#ports.get(this.#currentPort.Id)
        if (portData) {
            portData.data.push(this.#getNewSegment())
            this.#ports.set(this.#currentPort.Id, portData)
        }
    }

    #setNewEndDate(): void {
        const portData = this.#ports.get(this.#currentPort.Id)
        if (portData) {
            // console.log("setNewEndDate -> ", ports.get(currentPort.Id), values);
            portData.data[portData.data.length - 1].timeRange[1] = this.#getUnixTimestamp(this.#currentDate)
            this.#ports.set(this.#currentPort.Id, portData)
        }
    }

    #setTimeline(currentNation: string) {
        if (this.#ports.get(this.#currentPort.Id)) {
            const oldNation = this.#getPreviousNation()
            if (currentNation === oldNation) {
                this.#setNewEndDate()
            } else {
                this.#setNewNation()
            }
        } else {
            // console.log("!ports.get(currentPort.Id)");
            this.#initData()
        }
    }

    /**
     * Parse data and construct ports Map
     */
    #parseData(apiPorts: APIPort[]) {
        // console.log("**** new currentDate", currentDate);

        const nationPerPorts = [] as number[]
        const numPortsPerNation = {} as NationList<number>
        for (const nationShortname of this.#nationsCurrentServer) {
            numPortsPerNation[nationShortname] = 0
        }

        // Loop all ports excluding free towns
        for (this.#currentPort of apiPorts.filter((apiPort) => apiPort.Nation !== 9)) {
            const currentNation = findNationShortNameById(this.#currentPort.Nation)
            numPortsPerNation[currentNation] = Number(numPortsPerNation[currentNation]) + 1
            nationPerPorts.push(this.#currentPort.Nation)
            this.#setTimeline(currentNation)
        }

        // console.log(serverId, currentDate, nationPerPorts.length)
        this.#portOwnershipPerDate.push([this.#currentDate, nationPerPorts])

        const numPortsDate = {} as OwnershipNation<number>
        numPortsDate.date = this.#currentDate
        for (const nationShortname of this.#nationsCurrentServer) {
            numPortsDate[nationShortname] = numPortsPerNation[nationShortname]
        }

        this.#numPortsPerNationPerDates.push(numPortsDate)
        // console.log("**** 138 -->", [serverId], ports[serverId].get("138"));
    }

    /**
     * Process all files
     */
    async #processFiles() {
        for (const file of this.#fileNames) {
            unCompressSync(file)

            const parsedFile = path.parse(file)
            const jsonFN = path.format({ dir: parsedFile.dir, name: parsedFile.name })
            const apiPorts = readJson<APIPort[]>(jsonFN)
            this.#currentDate = (this.#fileBaseNameRegex.exec(path.basename(file)) ?? [])[1]
            this.#parseData(apiPorts)

            await removeFileASync(jsonFN)
        }
    }

    #getTimelineGroup() {
        const groups = d3Group<Port, string, string>(
            [...this.#ports.values()],
            (d) => d.region,
            (d) => d.county,
        ) as RegionGroup

        // Convert to data structure needed for timelines-chart
        // region
        // -- group (counties)
        //    -- label (ports)
        return [...groups]
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
    }

    async #writeResult() {
        await saveJsonAsync(
            path.resolve(commonPaths.dirGenServer, `${this.#serverId}-ownership.json`),
            this.#getTimelineGroup(),
        )
        await saveJsonAsync(
            path.resolve(commonPaths.dirGenServer, `${this.#serverId}-nation.json`),
            this.#numPortsPerNationPerDates,
        )
        await saveJsonAsync(
            path.resolve(commonPaths.dirGenServer, `${this.#serverId}-power.json`),
            this.#portOwnershipPerDate,
        )
    }
}
export const convertOwnershipData = async () => {
    for (const serverId of serverIds) {
        await new PortOwnership(serverId)
    }
}
