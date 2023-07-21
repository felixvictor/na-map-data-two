import * as fsPromises from "node:fs/promises"
import path from "node:path"

import { apiBaseFiles, baseAPIFilename, isNodeError, saveJsonAsync } from "./common/file.js"
import { serverBaseName, sourceBaseDir, sourceBaseUrl } from "./common/constants.js"
import { sortBy } from "./common/sort.js"
import { xzAsync } from "./common/compress.js"
import { serverIds } from "./common/servers.js"
import { currentServerStartDate as serverDate } from "./common/time.js"
import type { APIItemGeneric } from "./@types/api-item.d.ts"
import type { APIPort } from "./@types/api-port.d.ts"
import type { APIShop } from "./@types/api-shop.d.ts"

type APIType = APIItemGeneric | APIPort | APIShop
// http://api.shipsofwar.net/servers?apikey=1ZptRtpXAyEaBe2SEp63To1aLmISuJj3Gxcl5ivl&callback=setActiveRealms

/**
 * Delete file (ignore if file does not exist)
 * @param fileName - File name
 */
const deleteFile = async (fileName: string): Promise<void> => {
    try {
        await fsPromises.unlink(fileName)
    } catch (error: unknown) {
        if (isNodeError(error) && error.code !== "ENOENT") {
            throw new Error(`Error deleteFile ${fileName}`)
        }
    }
}

/**
 * Delete API data (uncompressed and compressed)
 * @param fileName - File name
 */
const deleteAPIFiles = async (fileName: string): Promise<void> => {
    await deleteFile(fileName)
    await deleteFile(`${fileName}.xz`)
}

/**
 * Download Naval Action API data
 * @param url - Download url
 */
const readNAJson = async (url: URL): Promise<Error | APIType[]> => {
    try {
        const response = await fetch(url.toString())
        if (response.ok) {
            const text = (await response.text()).replace(/^var .+ = /, "").replace(/;$/, "")
            return JSON.parse(text) as APIType[]
        }

        return new Error(`Cannot load ${url.href}: ${response.statusText}`)
    } catch (error: unknown) {
        throw new Error(error as string)
    }
}

/**
 * Load API data and save sorted data
 */
const getAPIDataAndSave = async (serverName: string, apiBaseFile: string, outfileName: string): Promise<boolean> => {
    const url = new URL(`${sourceBaseUrl}${sourceBaseDir}/${apiBaseFile}_${serverBaseName}${serverName}.json`)
    const data: Error | APIType[] = await readNAJson(url)

    if (data instanceof Error) {
        throw data
    }

    data.sort(sortBy(["Id"]))
    await saveJsonAsync(outfileName, data)
    await xzAsync("xz", outfileName)

    return true
}

/**
 * Load data for all servers and data files
 */
const loadData = async (baseAPIFilename: string): Promise<boolean> => {
    const deletePromise = []
    const getPromise = []
    for (const serverName of serverIds) {
        for (const apiBaseFile of apiBaseFiles) {
            const outfileName = path.resolve(baseAPIFilename, `${serverName}-${apiBaseFile}-${serverDate}.json`)

            deletePromise.push(deleteAPIFiles(outfileName))
            getPromise.push(getAPIDataAndSave(serverName, apiBaseFile, outfileName))
        }
    }

    await Promise.all(deletePromise)
    await Promise.all(getPromise)

    return true
}

void loadData(baseAPIFilename)
