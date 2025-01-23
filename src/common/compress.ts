import { exec, execSync } from "node:child_process"
import path from "node:path"

import { apiBaseFiles, fileExists, fileExistsAsync, getAPIFilename, removeFileSync } from "./file.js"
import { serverIds } from "./servers.js"
import { currentServerStartDate } from "./time.js"

const commandCompress = "brotli --rm"
const commandUnCompress = "brotli --decompress"
export const compressExtension = "br"

const getFileNameWithoutFirstExtension = (fileName: string) => {
    const parsedFileName = path.parse(fileName)
    return path.format({ dir: parsedFileName.dir, name: parsedFileName.name })
}

const doExec = async (command: string, fileName: string) => {
    const fileExists = await fileExistsAsync(fileName)

    if (fileExists) {
        exec(`${command} ${fileName}`)
    }
}

export const compressAsync = async (fileName: string) => {
    await doExec(commandCompress, fileName)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const unCompressAsync = async (fileName: string) => {
    await doExec(commandUnCompress, fileName)
}

const compressSync = (fileName: string): void => {
    if (fileExists(fileName)) {
        execSync(`${commandCompress} ${fileName}`)
    }
}

export const unCompressSync = (fileName: string): void => {
    if (!fileExists(getFileNameWithoutFirstExtension(fileName))) {
        execSync(`${commandUnCompress} ${fileName}`)
    }
}

const loopApiFiles = (toCompress = true, toRemove = false): void => {
    for (const serverName of serverIds) {
        for (const apiBaseFile of apiBaseFiles) {
            const fileName = getAPIFilename(`${serverName}-${apiBaseFile}-${currentServerStartDate}.json`)
            if (toRemove) {
                removeFileSync(fileName)
            } else if (toCompress) {
                compressSync(fileName)
            } else {
                unCompressSync(`${fileName}.${compressExtension}`)
            }
        }
    }
}

export const compressApiJson = (): void => {
    loopApiFiles(true, false)
}

export const unCompressApiJson = (): void => {
    loopApiFiles(false, false)
}

export const removeApiJson = (): void => {
    loopApiFiles(false, true)
}
