import path from "node:path"

import { fileEmpty, fileExistsAsync } from "./common/file.js"
import { getCommonPaths } from "./common/path.js"
import { serverIds } from "./common/servers.js"
import { PortOwnershipComplete } from "./port-ownership-complete.js"
import { PortOwnershipIncrement } from "./port-ownership-increment.js"

const commonPaths = getCommonPaths()

export const convertOwnershipData = async () => {
    for (const serverId of serverIds) {
        const filename = path.resolve(commonPaths.dirGenServer, `${serverId}-ownership.json`)
        if ((await fileExistsAsync(filename)) && !fileEmpty(filename)) {
            new PortOwnershipIncrement(serverId)
        } else {
            new PortOwnershipComplete(serverId)
        }
    }
}
