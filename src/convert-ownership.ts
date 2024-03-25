import path from "node:path"

import { fileExistsAsync } from "./common/file.js"
import { getCommonPaths } from "./common/path.js"
import { serverIds } from "./common/servers.js"
import { PortOwnershipComplete } from "./port-ownership-complete.js"
import { PortOwnershipIncrement } from "./port-ownership-increment.js"

const commonPaths = getCommonPaths()

export const convertOwnershipData = async () => {
    for (const serverId of serverIds) {
        const fileExists = await fileExistsAsync(path.resolve(commonPaths.dirGenServer, `${serverId}-ownership.json`))
        if (fileExists) {
            new PortOwnershipIncrement(serverId)
        } else {
            new PortOwnershipComplete(serverId)
        }
    }
}
