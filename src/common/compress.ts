import { exec, execSync } from "node:child_process"
import { default as fs } from "node:fs"
import { promisify } from "node:util"

import { serverIds } from "./servers"
import { apiBaseFiles, getAPIFilename } from "./file"
import { currentServerStartDate } from "./time"

const execP = promisify(exec)

/**
 * {@link https://stackoverflow.com/a/57708635}
 */
const fileExistsAsync = async (fileName: string): Promise<boolean> =>
    Boolean(await fs.promises.stat(fileName).catch(() => false))

export const xzAsync = async (command: string, fileName: string): Promise<boolean> => {
    const fileExists = await fileExistsAsync(fileName)

    if (fileExists) {
        await execP(`${command} ${fileName}`)
    }

    return true
}

export const xz = (command: string, fileName: string): void => {
    if (fs.existsSync(fileName)) {
        execSync(`${command} ${fileName}`)
    }
}

const loopApiFiles = (command: string): void => {
    const ext = command === "xz" ? "json" : "json.xz"

    for (const serverName of serverIds) {
        for (const apiBaseFile of apiBaseFiles) {
            const fileName = getAPIFilename(`${serverName}-${apiBaseFile}-${currentServerStartDate}.${ext}`)
            xz(command, fileName)
        }
    }
}

export const compressApiData = (): void => {
    loopApiFiles("xz")
}

export const uncompressApiData = (): void => {
    loopApiFiles("unxz")
}
