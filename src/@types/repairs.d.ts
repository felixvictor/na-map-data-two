import type { ObjectIndexer } from "./index.js"

export interface Repair extends ObjectIndexer<RepairAmount> {
    armorRepair: RepairAmount
    sailRepair: RepairAmount
    crewRepair: RepairAmount
}
export interface RepairAmount {
    percent: number
    time: number
    volume: number
}
