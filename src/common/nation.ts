import { nationMap } from "../@types/constants"
import type { Nation } from "../@types/nations"

/**
 * Find Nation object based on nation id
 */
export const findNationById = (nationId: number): Nation | undefined => nationMap.get(nationId)
