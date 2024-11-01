import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat.js"
import utc from "dayjs/plugin/utc.js"

dayjs.extend(customParseFormat)
dayjs.extend(utc)

export const serverMaintenanceHour = 10
const baseTimeInTicks = 621_355_968_000_000_000

const getServerStartDateTime = (day: number): dayjs.Dayjs => {
    let serverStart = dayjs().utc().hour(serverMaintenanceHour).minute(0).second(0)
    const now = dayjs().utc()

    // adjust reference server time if needed
    if ((day < 0 && now.isBefore(serverStart)) || (day > 0 && now.isAfter(serverStart))) {
        serverStart = dayjs.utc(serverStart).add(day, "day")
    }

    return serverStart
}

/**
 * Get current server start (date and time)
 */
export const getCurrentServerStart = (): dayjs.Dayjs => getServerStartDateTime(-1)

/**
 * Get next server start (date and time)
 */
export const getNextServerStart = (): dayjs.Dayjs => getServerStartDateTime(1)

export const currentServerStartDateTime = getCurrentServerStart().format("YYYY-MM-DD HH:mm")
export const currentServerStartDate = getCurrentServerStart().format("YYYY-MM-DD")
export const previousServerStartDate = getCurrentServerStart().add(-1, "day").format("YYYY-MM-DD")
export const currentServerDateYear = String(dayjs(currentServerStartDate).year())
export const currentServerDateMonth = String(dayjs(currentServerStartDate).month() + 1).padStart(2, "0")

export const getTimeFromTicks = (timeInTicks: number): string => {
    return dayjs.utc((timeInTicks - baseTimeInTicks) / 10_000).format("YYYY-MM-DD HH:mm")
}
