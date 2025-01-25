import type { APIItemGeneric } from "../@types/api-item.js"
import type { APIPort } from "../@types/api-port.js"
import type { APIShop } from "../@types/api-shop.js"
import type { ServerId } from "../@types/server.js"
import { getAPIFilename, readJson } from "./file.js"
import { serverIds } from "./servers.js"
import { currentServerStartDate as serverDate } from "./time.js"

/**
 * Test if object is empty
 * {@link https://stackoverflow.com/a/32108184}
 * @param   object - Object
 * @returns True if object is empty
 */
export const isEmpty = (object: Record<string, unknown> | undefined): boolean =>
    object !== undefined && Object.getOwnPropertyNames(object).length === 0

export const getApiItems = (serverId = serverIds[0]) =>
    readJson(getAPIFilename(`${serverId}-ItemTemplates-${serverDate}.json`)) as APIItemGeneric[]

export const getApiPorts = (serverId = serverIds[0]) =>
    readJson(getAPIFilename(`${serverId}-Ports-${serverDate}.json`)) as APIPort[]

export const getApiPortsFromDate = (serverId: ServerId, date: string) =>
    readJson(getAPIFilename(`${serverId}-Ports-${date}.json`)) as APIPort[]

export const getApiShops = (serverId = serverIds[0]) =>
    readJson(getAPIFilename(`${serverId}-Shops-${serverDate}.json`)) as APIShop[]
