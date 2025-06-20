import fs from "node:fs"
import { readdir } from "node:fs/promises"
import path from "node:path"

import type { APIPort } from "./@types/api-port.js"
import type { ServerId } from "./@types/server.js"
import { unCompressSync } from "./common/compress.js"
import { readJson, removeFileASync } from "./common/file.js"
import { getCommonPaths } from "./common/path.js"
import { simpleStringSort } from "./common/sort.js"
import { PortOwnership } from "./port-ownership.js"

const commonPaths = getCommonPaths()

export class PortOwnershipComplete extends PortOwnership {
    #fileNames = [] as string[]
    #serverStart = Date.parse("2025-04-10")

    constructor(serverId: ServerId) {
        super(serverId)
        void (async () => {
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

    getDateString(fileName: string) {
        return fileName.match(this.fileBaseNameRegex)?.[1]
    }

    isAPIPortFileSinceServerStart(file: fs.Dirent) {
        if (!file.isFile()) {
            return false
        }

        const dateString = this.getDateString(file.name)

        if (dateString === undefined) {
            return false
        }

        return Date.parse(dateString) >= this.#serverStart
    }

    async #getFilenames() {
        const files = await readdir(commonPaths.directoryAPI, { recursive: true, withFileTypes: true })
        this.#fileNames = files
            .filter((file) => this.isAPIPortFileSinceServerStart(file))
            .map((file) => path.join(file.parentPath, file.name))
            .sort((a, b) => simpleStringSort(path.basename(a), path.basename(b)))
    }

    async #processFiles() {
        for (const fileName of this.#fileNames) {
            this.currentDate = this.getDateString(path.basename(fileName)) ?? ""

            unCompressSync(fileName)
            const parsedFileName = path.parse(fileName)
            const jsonFN = path.format({ dir: parsedFileName.dir, name: parsedFileName.name })
            const apiPorts = readJson(jsonFN) as APIPort[]
            this.parseData(apiPorts)
            await removeFileASync(jsonFN)
        }
    }
}
