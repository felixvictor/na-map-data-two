import { default as fs, promises as fsPromises } from "node:fs"
import path from "node:path"

import { currentServerDateMonth, currentServerDateYear } from "./time"
import { getCommonPaths } from "./path"

export const apiBaseFiles = ["ItemTemplates", "Ports", "Shops"]

// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/globals.d.ts
interface ErrnoException extends Error {
    errno?: number
    code?: string
    path?: string
    syscall?: string
    stack?: string
}
export const fileExists = (fileName: string): boolean => fs.existsSync(fileName)

/**
 * Make directories (recursive)
 */
export const makeDirAsync = async (dir: string): Promise<void> => {
    await fsPromises.mkdir(dir, { recursive: true })
}

// eslint-disable-next-line @typescript-eslint/ban-types
export const saveJsonAsync = async (fileName: string, data: object): Promise<void> => {
    await makeDirAsync(path.dirname(fileName))
    await fsPromises.writeFile(fileName, JSON.stringify(data), { encoding: "utf8" })
}

export const saveTextFile = (fileName: string, data: string): void => {
    fs.writeFileSync(fileName, data, { encoding: "utf8" })
}

export const isNodeError = (error: unknown): error is ErrnoException => error instanceof Error

export const readTextFile = (fileName: string): string => {
    let data = ""
    try {
        data = fs.readFileSync(fileName, { encoding: "utf8" })
    } catch (error: unknown) {
        if (isNodeError(error as Error) && (error as ErrnoException).code === "ENOENT") {
            console.error("File", fileName, "not found")
        } else {
            putFetchError(error as string)
        }
    }

    return data
}

// export const readJson = (fileName: string): Record<string, string | number>[] => JSON.parse(readTextFile(fileName))
export const readJson = <T>(fileName: string): T => JSON.parse(readTextFile(fileName)) as T

/**
 * Write error to console
 */
export const putFetchError = (error: string): void => {
    console.error("Request failed -->", error)
}

export const baseAPIFilename = path.resolve(getCommonPaths().dirAPI, currentServerDateYear, currentServerDateMonth)
export const getAPIFilename = (jsonFilename: string) => path.resolve(baseAPIFilename, jsonFilename)
