import path from "node:path"

import type { APIPort } from "./@types/api-port.js"
import type { OwnershipNation } from "./@types/nations.js"
import type { Ownership, OwnershipPort, Segment } from "./@types/ownership.js"
import type { PowerMapList } from "./@types/power-map.js"
import type { ServerId } from "./@types/server.js"
import { cleanName } from "./common/api.js"
import { capitalToCounty } from "./common/constants.js"
import { getAPIFilename, readJson } from "./common/file.js"
import { currentServerStartDate as serverDate } from "./common/time.js"
import { PortOwnership } from "./port-ownership.js"

export class PortOwnershipIncrement extends PortOwnership {
    #apiPorts: APIPort[] = []
    #regionTimeline: Ownership[] = []

    constructor(serverId: ServerId) {
        super(serverId)
        void (async () => {
            await this.#convertOwnership()
        })()
    }

    // Get data and remove entries for current date
    getNumPortsPerNationPerDates() {
        const fileName = path.resolve(this.commonPaths.directoryGenServer, `${this.serverId}-nation.json`)
        const json = readJson(fileName) as OwnershipNation<number>[]
        return json.filter((ownership) => ownership.date !== this.currentDate)
    }

    // Get data and remove entries for current date
    getPortOwnershipPerDate() {
        const fileName = path.resolve(this.commonPaths.directoryGenServer, `${this.serverId}-power.json`)
        const json = readJson(fileName) as PowerMapList
        return json.filter((powerMap) => powerMap[0] !== this.currentDate)
    }

    #getTimelines() {
        return new Map<string, Segment[]>(
            this.#regionTimeline.flatMap((region) =>
                region.data.flatMap((county) => county.data.map((c) => [c.label, c.data])),
            ),
        )
    }

    getPorts() {
        const fileName = path.resolve(this.commonPaths.directoryGenServer, `${this.serverId}-ownership.json`)
        this.#regionTimeline = readJson(fileName) as Ownership[]
        const timelines = this.#getTimelines()

        return new Map<string, OwnershipPort>(
            this.#apiPorts
                .filter((apiPort) => apiPort.Nation !== 9)
                .map((apiPort) => {
                    const portName = cleanName(apiPort.Name)
                    return [
                        apiPort.Id,
                        {
                            name: portName,
                            region: apiPort.Location,
                            county: capitalToCounty.get(apiPort.CountyCapitalName) ?? "",
                            data: timelines.get(portName),
                        } as OwnershipPort,
                    ]
                }),
        )
    }

    #initData() {
        this.numPortsPerNationPerDates = this.getNumPortsPerNationPerDates()
        this.portOwnershipPerDate = this.getPortOwnershipPerDate()
        this.ports = this.getPorts()
    }

    async #processFile() {
        this.currentDate = serverDate
        this.#apiPorts = readJson(getAPIFilename(`${this.serverId}-Ports-${this.currentDate}.json`)) as APIPort[]
        this.#initData()
        this.parseData(this.#apiPorts)
        await this.writeResult()
    }

    /**
     * Retrieve port data for nation/clan ownership
     */
    async #convertOwnership() {
        await this.#processFile()
    }
}
