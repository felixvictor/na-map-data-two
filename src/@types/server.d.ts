import type { serverIds } from "../common/servers.js"

export type ServerId = (typeof serverIds)[number]
export type ServerType = "PVE" | "PVP"
export type ServerIdList<T> = Record<ServerId, T>

export interface Server {
    id: ServerId
    name: string
    type: ServerType
    icon: string
}
