import { PortOwnership } from "./port-ownership.js"
import type { ServerId } from "./@types/server.js"

export class PortOwnershipComplete extends PortOwnership {
    constructor(serverId: ServerId) {
        super(serverId)
    }
}
