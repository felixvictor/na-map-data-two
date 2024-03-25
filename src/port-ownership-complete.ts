import { readdir } from "node:fs/promises"
import path from "node:path"

import type { APIPort } from "./@types/api-port.js"
import type { ServerId } from "./@types/server.js"
import { unCompressSync } from "./common/compress.js"
import { readJson, removeFileASync } from "./common/file.js"
import { getCommonPaths } from "./common/path.js"
import { PortOwnership } from "./port-ownership.js"

const commonPaths = getCommonPaths()

export class PortOwnershipComplete extends PortOwnership {
    #fileNames = [] as string[]

    constructor(serverId: ServerId) {
        super(serverId)
        ;(async () => {
            await this.#convertOwnership()
        })()
    }

    /**
     * Retrieve port data for nation/clan ownership
     */
    async #convertOwnership() {
        await this.#getFilenames()
        await this.#processFiles()
        await this.writeResult()
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
            .filter((file) => file.isFile() && file.name.match(this.fileBaseNameRegex))
            .map((file) => `${file.path}/${file.name}`)
        this.#sortFileNames()
    }

    async #processFiles() {
        for (const fileName of this.#fileNames) {
            this.currentDate = (this.fileBaseNameRegex.exec(path.basename(fileName)) ?? [])[1]

            unCompressSync(fileName)
            const parsedFileName = path.parse(fileName)
            const jsonFN = path.format({ dir: parsedFileName.dir, name: parsedFileName.name })
            const apiPorts = readJson<APIPort[]>(jsonFN)
            this.parseData(apiPorts)
            await removeFileASync(jsonFN)
        }
    }
}
