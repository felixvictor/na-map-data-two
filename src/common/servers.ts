import type { Server, ServerId, ServerType } from "../@types/server.js"

export const serverIds = ["eu1", "eu2", "eu3"]!

// If changed check also webpack.config
export const servers: Server[] = [
    { id: "eu1", name: "War", type: "PVP", icon: "war" },
    { id: "eu2", name: "Peace", type: "PVE", icon: "peace" },
    { id: "eu3", name: "Main", type: "PVP", icon: "free" },
]

/* testbed
   server_base_name="clean"
   source_base_url="http://storage.googleapis.com/nacleandevshards/"
   server_names=(dev)
*/

export const getServerType = (serverId: ServerId): ServerType => servers.find((server) => server.id === serverId)!.type
