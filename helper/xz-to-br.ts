import path from "node:path"
import { readdir } from "node:fs/promises"

import { getCommonPaths } from "../src/common/path.js"
import { compressAsync } from "../src/common/compress.js"
import { execSync } from "node:child_process"

const commonPaths = getCommonPaths()

const unCompress = async (fileName: string) => {
    execSync(`unxz ${fileName}`)
}

const reCompressFile = async (fileName: string) => {
    await unCompress(fileName)
    const parsedFile = path.parse(fileName)
    const json = path.format({ dir: parsedFile.dir, name: parsedFile.name })
    await compressAsync(json)
}

try {
    const files = await readdir(commonPaths.dirAPI, { recursive: true, withFileTypes: true })
    for (const file of files) {
        console.log("loop", file.name)
        if (file.isFile() && path.parse(file.name).ext === ".xz") {
            await reCompressFile(`${file.path}/${file.name}`)
        }
    }
} catch (err) {
    console.error(err)
}
