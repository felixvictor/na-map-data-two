import fs, { promises as fsPromises } from "node:fs"
import path from "node:path"

import { getCommonPaths } from "./path.js"
import { currentServerDateMonth, currentServerDateYear } from "./time.js"

export const apiBaseFiles = ["ItemTemplates", "Ports", "Shops"]

// https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/node/globals.d.ts
interface ErrnoException extends Error {
    errno?: number
    code?: string
    path?: string
    syscall?: string
    stack?: string
}

export const fileExists = (fileName: string): boolean => {
    const stat = fs.statSync(fileName, { throwIfNoEntry: false })
    return !!stat?.isFile()
}

export const fileEmpty = (fileName: string): boolean => {
    const stat = fs.statSync(fileName, { throwIfNoEntry: false })
    return stat?.size === 0
}

export const fileExistsAsync = async (fileName: string): Promise<boolean> =>
    await fsPromises
        .stat(fileName)
        .then((stats) => stats.isFile())
        .catch(() => false)

/**
 * Make directories (recursive)
 */
export const makeDirectoryAsync = async (directory: string) => {
    try {
        await fsPromises.mkdir(directory, { recursive: true })
    } catch (error: unknown) {
        putError(error as string)
    }
}

const saveTextFileAsync = async (fileName: string, data: string) => {
    try {
        await fsPromises.writeFile(fileName, data, { encoding: "utf8" })
    } catch (error: unknown) {
        putError(error as string)
    }
}

export const saveTextFileSync = (fileName: string, data: string): void => {
    fs.writeFileSync(fileName, data, { encoding: "utf8" })
}

export const saveJsonAsync = async (fileName: string, data: object): Promise<void> => {
    await makeDirectoryAsync(path.dirname(fileName))
    await saveTextFileAsync(fileName, JSON.stringify(data))
}

export const readTextFile = (fileName: string): string => {
    let data = ""
    try {
        data = fs.readFileSync(fileName, { encoding: "utf8" })
    } catch (error: unknown) {
        if (isNodeError(error as Error) && (error as ErrnoException).code === "ENOENT") {
            console.error("File", fileName, "not found")
        } else {
            putError(error as string)
        }
    }

    return data
}

export const readJson = (fileName: string): unknown => {
    try {
        return JSON.parse(readTextFile(fileName))
    } catch (error: unknown) {
        throw new Error(`Cannot parse ${fileName}\nError: ${error as string}`)
    }
}

export const removeFileSync = (fileName: string) => {
    fs.rmSync(fileName, { force: true })
}

export const removeFileASync = async (fileName: string) => {
    try {
        await fsPromises.rm(fileName, { force: true })
    } catch (error: unknown) {
        putError(error as string)
    }
}

export const isNodeError = (error: unknown): error is ErrnoException => error instanceof Error
export const putError = (error: string): void => {
    console.error("Request failed -->", error)
}

export const baseAPIFilename = path.resolve(
    getCommonPaths().directoryAPI,
    currentServerDateYear,
    currentServerDateMonth,
)
export const getAPIFilename = (jsonFilename: string) => path.resolve(baseAPIFilename, jsonFilename)
