import path from "node:path"

import { group as d3Group } from "d3-array"

import type { APIPort } from "./@types/api-port.js"
import type { NationList, NationShortName, OwnershipNation } from "./@types/nations.js"
import type {
    Group,
    Line,
    Ownership,
    OwnershipPort,
    OwnershipRegion,
    RegionGroup,
    Segment,
} from "./@types/ownership.js"
import type { PowerMapList } from "./@types/power-map.js"
import type { ServerId } from "./@types/server.js"
import { cleanName } from "./common/api.js"
import { compressExt } from "./common/compress.js"
import { capitalToCounty } from "./common/constants.js"
import { getAPIFilename, readJson, saveJsonAsync } from "./common/file.js"
import { findNationShortNameById, nationShortNamesPerServer } from "./common/nation.js"
import { getCommonPaths } from "./common/path.js"
import { sortBy } from "./common/sort.js"
import { currentServerStartDate as serverDate } from "./common/time.js"

export class PortOwnership {
    #currentPort = {} as APIPort
    #portRegionData = new Map<string, OwnershipRegion>()
    #numPortsPerNationPerDates = [] as OwnershipNation<number>[]
    #portOwnershipPerDate = [] as PowerMapList
    #ports = new Map<string, OwnershipPort>()
    currentDate = ""
    fileBaseNameRegex = {} as RegExp
    readonly commonPaths = getCommonPaths()
    readonly #nationsCurrentServer = [] as NationShortName[]
    readonly serverId = "" as ServerId
    readonly fileExtension = `.json.${compressExt}`

    constructor(serverId: ServerId) {
        this.serverId = serverId
        this.fileBaseNameRegex = new RegExp(`${serverId}-Ports-(20(\\d{2})-(\\d{2})-(\\d{2}))${this.fileExtension}`)
        this.#nationsCurrentServer = nationShortNamesPerServer.get(serverId) ?? []
        this.#getRegionData()
    }

    set numPortsPerNationPerDates(numPortsPerNationPerDates: OwnershipNation<number>[]) {
        this.#numPortsPerNationPerDates = numPortsPerNationPerDates
    }

    set portOwnershipPerDate(portOwnershipPerDate: PowerMapList) {
        this.#portOwnershipPerDate = portOwnershipPerDate
    }

    set ports(ports: Map<string, OwnershipPort>) {
        this.#ports = ports
    }

    #getRegionData() {
        const lastPortData = readJson(getAPIFilename(`${this.serverId}-Ports-${serverDate}.json`)) as APIPort[]
        this.#portRegionData = new Map(
            lastPortData.map((port) => [
                port.Id,
                {
                    name: cleanName(port.Name),
                    region: port.Location,
                    county: capitalToCounty.get(cleanName(port.CountyCapitalName)) ?? "",
                },
            ]),
        )
    }

    #getUnixTimestamp(date: string): number {
        return new Date(date).getTime()
    }

    #getNewSegment(): Segment {
        const dateF = this.#getUnixTimestamp(this.currentDate)
        return {
            timeRange: [dateF, dateF],
            val: findNationShortNameById(this.#currentPort.Nation),
        }
    }

    #initData(): void {
        this.#ports.set(this.#currentPort.Id, {
            name: this.#portRegionData.get(this.#currentPort.Id)?.name ?? "",
            region: this.#portRegionData.get(this.#currentPort.Id)?.region ?? "",
            county: this.#portRegionData.get(this.#currentPort.Id)?.county ?? "",
            data: [this.#getNewSegment()],
        })
    }

    #getPreviousNation(): NationShortName {
        const portData = this.#ports.get(this.#currentPort.Id)

        if (portData) {
            const index = portData.data.length - 1
            return portData.data[index].val as NationShortName
        }

        return ""
    }

    #setNewNation(): void {
        const portData = this.#ports.get(this.#currentPort.Id)

        if (portData) {
            portData.data.push(this.#getNewSegment())
            this.#ports.set(this.#currentPort.Id, portData)
        }
    }

    #setNewEndDate(): void {
        const portData = this.#ports.get(this.#currentPort.Id)

        if (portData) {
            portData.data[portData.data.length - 1].timeRange[1] = this.#getUnixTimestamp(this.currentDate)
            this.#ports.set(this.#currentPort.Id, portData)
        }
    }

    #setTimeline(currentNation: string) {
        if (this.#ports.has(this.#currentPort.Id)) {
            const oldNation = this.#getPreviousNation()
            if (currentNation === oldNation) {
                this.#setNewEndDate()
            } else {
                this.#setNewNation()
            }
        } else {
            this.#initData()
        }
    }

    /**
     * Parse data and construct ports Map
     */
    parseData(apiPorts: APIPort[]) {
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
        this.#portOwnershipPerDate.push([this.currentDate, nationPerPorts])

        const numPortsDate = {} as OwnershipNation<number>
        numPortsDate.date = this.currentDate
        for (const nationShortname of this.#nationsCurrentServer) {
            numPortsDate[nationShortname] = numPortsPerNation[nationShortname]
        }

        this.#numPortsPerNationPerDates.push(numPortsDate)
    }

    #getTimelineGroup() {
        const groups = d3Group(
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

    async writeResult() {
        await saveJsonAsync(
            path.resolve(this.commonPaths.dirGenServer, `${this.serverId}-ownership.json`),
            this.#getTimelineGroup(),
        )
        await saveJsonAsync(
            path.resolve(this.commonPaths.dirGenServer, `${this.serverId}-nation.json`),
            this.#numPortsPerNationPerDates,
        )
        await saveJsonAsync(
            path.resolve(this.commonPaths.dirGenServer, `${this.serverId}-power.json`),
            this.#portOwnershipPerDate,
        )
    }
}
