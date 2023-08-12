import { PortOwnership } from "./port-ownership.js"
import type { ServerId } from "./@types/server.js"

export class PortOwnershipIncrement extends PortOwnership {
    constructor(serverId: ServerId) {
        super(serverId)
    }
}
