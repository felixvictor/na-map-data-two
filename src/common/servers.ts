import type { Server } from "../@types/server.js"

export const serverIds = ["eu3", "eu2"]

// https://storage.googleapis.com/nacleanopenworldprodshards/config.txt
export const servers: Server[] = [
    { id: "eu3", name: "Caribbean", type: "PVP", icon: "free" },
    { id: "eu2", name: "Peace", type: "PVE", icon: "peace" },
]
