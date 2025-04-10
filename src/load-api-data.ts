import * as console from "node:console"
import path from "node:path"

import type { APIItemGeneric } from "./@types/api-item.d.ts"
import type { APIPort } from "./@types/api-port.d.ts"
import type { APIShop } from "./@types/api-shop.d.ts"
import { compressAsync, compressExtension } from "./common/compress.js"
import {
    serverBaseName,
    sourceBaseDirectory,
    sourceBaseUrl,
    testServerBaseName,
    testSourceBaseDirectory,
} from "./common/constants.js"
import { apiBaseFiles, baseAPIFilename, removeFileASync, saveJsonAsync } from "./common/file.js"
import { serverIds } from "./common/servers.js"
import { sortBy } from "./common/sort.js"
import { currentServerStartDate as serverDate } from "./common/time.js"

type APIType = APIItemGeneric | APIPort | APIShop
// http://api.shipsofwar.net/servers?apikey=1ZptRtpXAyEaBe2SEp63To1aLmISuJj3Gxcl5ivl&callback=setActiveRealms

/**
 * Delete API data (uncompressed and compressed)
 */
const deleteAPIFiles = async (fileName: string): Promise<void> => {
    await removeFileASync(fileName)
    await removeFileASync(`${fileName}.${compressExtension}`)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const fetchWithRetry = async (url: URL, options?: { tries: number }): Promise<string> => {
    const { tries } = { tries: 3, ...options }
    let attempt = 0
    const fib = [3, 5]
    const controller = new AbortController()
    const signal = controller.signal

    while (attempt <= tries) {
        try {
            const response = await fetch(url.toString(), { signal })

            if (!response.ok) {
                throw new Error(`Cannot load ${url.href}: ${response.statusText}`)
            }

            return await response.text()
        } catch (error: unknown) {
            if (attempt === tries) {
                controller.abort()
                throw error // If it's the last attempt, re-throw the error
            } else {
                const waitTime = fib[attempt]
                console.log(
                    `Attempt ${attempt + 1} of ${tries + 1} to load ${url.href} failed. Retrying in ${waitTime} seconds.`,
                )
                console.error(error)

                await sleep(waitTime * 1000)
                attempt++

                // Generate the next Fibonacci number
                fib.push((fib.at(-1) ?? 0) + (fib.at(-2) ?? 0))
            }
        }
    }

    controller.abort()
    throw new Error(`All ${tries + 1} attempts to load ${url.href} failed.`)
}

/**
 * Download Naval Action API data
 * {@link https://dev.to/thanhphuchuynh/efficient-retries-implementing-fibonacci-backoff-in-javascript-fetch-requests-2h4p}
 */
const readNAJson = async (url: URL): Promise<APIType[]> => {
    const data = await fetchWithRetry(url)
    const text = data.replace(/^var .+ = /, "").replace(/;$/, "")
    return JSON.parse(text) as APIType[]
}

/**
 * Load API data and save sorted data
 */
const getAPIDataAndSave = async (
    serverName: string,
    apiBaseFile: string,
    outfileName: string,
    test = false,
): Promise<boolean> => {
    const url = test
        ? new URL(
              path.join(testSourceBaseDirectory, `${apiBaseFile}_${testServerBaseName}${serverName}.json`),
              sourceBaseUrl,
          )
        : new URL(path.join(sourceBaseDirectory, `${apiBaseFile}_${serverBaseName}${serverName}.json`), sourceBaseUrl)
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
    for (const serverName of serverIds) {
        for (const apiBaseFile of apiBaseFiles) {
            const outfileName = path.resolve(baseAPIFilename, `${serverName}-${apiBaseFile}-${serverDate}.json`)

            await deleteAPIFiles(outfileName)
            await getAPIDataAndSave(serverName, apiBaseFile, outfileName)
        }
    }

    return true
}

void loadData(baseAPIFilename)
