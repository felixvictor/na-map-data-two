import path from "node:path"

import { PortOwnership } from "./port-ownership.js"
import { getAPIFilename, readJson } from "./common/file.js"
import { cleanName } from "./common/api.js"
import { currentServerStartDate as serverDate } from "./common/time.js"
import { capitalToCounty } from "./common/constants.js"
import type { APIPort } from "./@types/api-port.js"
import type { ServerId } from "./@types/server.js"
import type { OwnershipNation } from "./@types/nations.js"
import type { PowerMapList } from "./@types/power-map.js"
import type { Ownership, Port, Segment } from "./@types/ownership.js"

export class PortOwnershipIncrement extends PortOwnership {
    #apiPorts: APIPort[] = []
    #regionTimeline: Ownership[] = []

    constructor(serverId: ServerId) {
        super(serverId)
        ;(async () => {
            await this.#convertOwnership()
        })()
    }

    // Get data and remove entries for current date
    getNumPortsPerNationPerDates() {
        const fileName = path.resolve(this.commonPaths.dirGenServer, `${this.serverId}-nation.json`)
        const json = readJson<Array<OwnershipNation<number>>>(fileName)
        return json.filter((ownership) => ownership.date !== this.currentDate)
    }

    // Get data and remove entries for current date
    getPortOwnershipPerDate() {
        const fileName = path.resolve(this.commonPaths.dirGenServer, `${this.serverId}-power.json`)
        const json = readJson<PowerMapList>(fileName)
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
        const fileName = path.resolve(this.commonPaths.dirGenServer, `${this.serverId}-ownership.json`)
        this.#regionTimeline = readJson<Ownership[]>(fileName)
        const timelines = this.#getTimelines()
        const ports = new Map<string, Port>(
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
                        } as Port,
                    ]
                }),
        )
        console.log("ports", ports.size)
        return ports
    }

    #initData() {
        this.numPortsPerNationPerDates = this.getNumPortsPerNationPerDates()
        this.portOwnershipPerDate = this.getPortOwnershipPerDate()
        this.ports = this.getPorts()
    }

    async #processFile() {
        this.currentDate = serverDate
        console.log("currentDate", this.currentDate)
        this.#apiPorts = readJson<APIPort[]>(getAPIFilename(`${this.serverId}-Ports-${this.currentDate}.json`))
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
