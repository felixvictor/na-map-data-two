import path from "node:path"

import type { APIItemGeneric } from "./@types/api-item.d.ts"
import type { APIPort } from "./@types/api-port.d.ts"
import type { APIShop } from "./@types/api-shop.d.ts"
import { compressAsync, compressExt } from "./common/compress.js"
import { serverBaseName, sourceBaseDir, sourceBaseUrl } from "./common/constants.js"
import { apiBaseFiles, baseAPIFilename, removeFileASync, saveJsonAsync } from "./common/file.js"
import { serverIds } from "./common/servers.js"
import { sortBy } from "./common/sort.js"
import { currentServerStartDate as serverDate } from "./common/time.js"

type APIType = APIItemGeneric | APIPort | APIShop
// http://api.shipsofwar.net/servers?apikey=1ZptRtpXAyEaBe2SEp63To1aLmISuJj3Gxcl5ivl&callback=setActiveRealms

/**
 * Delete API data (uncompressed and compressed)
 * @param fileName - File name
 */
const deleteAPIFiles = async (fileName: string): Promise<void> => {
    await removeFileASync(fileName)
    await removeFileASync(`${fileName}.${compressExt}`)
}

/**
 * Download Naval Action API data
 * @param url - Download url
 */
const readNAJson = async (url: URL): Promise<APIType[]> => {
    try {
        // eslint-disable-next-line n/no-unsupported-features/node-builtins
        const response = await fetch(url.toString())

        if (!response.ok) {
            throw new Error(`Cannot load ${url.href}: ${response.statusText}`)
        }

        const text = (await response.text()).replace(/^var .+ = /, "").replace(/;$/, "")
        return JSON.parse(text) as APIType[]
    } catch (error: unknown) {
        throw new Error(`Cannot load ${url.href}: ${error as string}`)
    }
}

/**
 * Load API data and save sorted data
 */
const getAPIDataAndSave = async (serverName: string, apiBaseFile: string, outfileName: string): Promise<boolean> => {
    const url = new URL(`${sourceBaseUrl}${sourceBaseDir}/${apiBaseFile}_${serverBaseName}${serverName}.json`)
    const data = await readNAJson(url)

    data.sort(sortBy(["Id"]))
    await saveJsonAsync(outfileName, data)
    await compressAsync(outfileName)

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
