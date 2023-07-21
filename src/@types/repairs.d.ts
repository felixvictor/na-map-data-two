import type { ObjectIndexer } from "./index"

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
