import type { Server, ServerId, ServerType } from "../@types/server.js"

export const serverIds = ["eu1", "eu2", "eu3"]
export const testServerIds = ["dev"]

// If changed check also webpack.config
export const servers: Server[] = [
    { id: "eu1", name: "War", type: "PVP", icon: "war" },
    { id: "eu2", name: "Peace", type: "PVE", icon: "peace" },
    { id: "eu3", name: "Main", type: "PVP", icon: "free" },
    { id: "dev", name: "Test", type: "PVP", icon: "test" },
]

export const getServerType = (serverId: ServerId): ServerType =>
    servers.find((server) => server.id === serverId)?.type ?? "PVP"
