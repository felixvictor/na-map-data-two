import { nationMap } from "../@types/constants.js"
import type { Nation } from "../@types/nations.js"

/**
 * Find Nation object based on nation id
 */
export const findNationById = (nationId: number): Nation | undefined => nationMap.get(nationId)
