import type { Server } from "../@types/server.js"

export const serverIds = ["eu2", "eu3"]
export const testServerIds = ["dev"]

// https://storage.googleapis.com/nacleanopenworldprodshards/config.txt
export const servers: Server[] = [
    { id: "eu2", name: "Peace", type: "PVE", icon: "peace" },
    { id: "eu3", name: "Main", type: "PVP", icon: "free" },
    { id: "dev", name: "Test", type: "PVP", icon: "test" },
]
