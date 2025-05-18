import Excel from "exceljs"
import StylesXform from "exceljs/lib/xlsx/xform/style/styles-xform.js"

import type { APIItemGeneric, APIShip } from "./@types/api-item.js"
import type { ShipData } from "./@types/ships.js"
import { getApiItems } from "./common/common.js"
import { degreesFullCircle, degreesHalfCircle } from "./common/constants.js"
import {
    border,
    colourContrastLight,
    colourContrastMiddle,
    colourContrastNearWhite,
    colourWhite,
    defaultFont,
    fillPattern,
    floatAlign,
    floatNumberFmt,
    floatStyle,
    fontColourBold,
    formula,
    getExcelAlpha,
    intAlign,
    intNumberFmt,
    intStyle,
    textAlign,
    textNumberFmt,
    textStyle,
} from "./common/excel.mjs"
import { readJson } from "./common/file.js"
import { round } from "./common/format.js"
import { getCommonPaths } from "./common/path.js"
import { sortBy } from "./common/sort.js"
import { currentServerStartDate } from "./common/time.js"

const commonPaths = getCommonPaths()

const columnWidth = 12
const rowHeight = 24

const columnsHeader = [
    { name: "Ship rate", width: 8, style: intStyle },
    { name: "Ship name", width: 22, style: textStyle },
    { name: "Ship battle rating", width: 8, style: intStyle },
    { name: "Max speed", width: 12, style: floatStyle },
    { name: "Degree", width: 10, style: intStyle },
    { name: "Current", width: 10, style: floatStyle },
    { name: "Proposal", width: 10, style: floatStyle },
]

let workbook: Excel.Workbook
let shipData: ShipData[]

// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
const origStylesXformInit = StylesXform.prototype.init
// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
StylesXform.prototype.init = function () {
    // eslint-disable-next-line prefer-rest-params,@typescript-eslint/no-unsafe-argument
    Reflect.apply(origStylesXformInit, this, arguments)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call
    this._addFont(defaultFont)
}

const wsOptions: Partial<Excel.AddWorksheetOptions> = {
    views: [
        {
            activeCell: "A1",
            showGridLines: false,
            state: "frozen",
        },
    ],
    properties: {
        defaultColWidth: columnWidth,
        defaultRowHeight: rowHeight,
    },
}

let apiShipData: Map<number, APIShip>
const setupData = () => {
    const apiItems: APIItemGeneric[] = getApiItems()

    apiShipData = new Map(
        apiItems
            .filter((item) => item.ItemType === "Ship" && !item.NotUsed)
            .map((ship) => [ship.Id, ship as unknown as APIShip]),
    )

    shipData = (readJson(commonPaths.fileShip) as ShipData[]).sort(sortBy(["name"]))
}

const addFloatToCell = (cell: Excel.Cell, value: Excel.CellFormulaValue | number) => {
    cell.value = value
    cell.alignment = floatAlign
    cell.numFmt = floatNumberFmt
    cell.border = border
}

const addIntToCell = (cell: Excel.Cell, value: Excel.CellFormulaValue | number) => {
    cell.value = value
    cell.alignment = intAlign
    cell.numFmt = intNumberFmt
    cell.border = border
}

const addTextToCell = (cell: Excel.Cell, text: string) => {
    cell.value = text
    cell.alignment = textAlign
    cell.numFmt = textNumberFmt
    cell.border = border
}

const fillSheet = (sheet: Excel.Worksheet, ship: ShipData): void => {
    let cell: Excel.Cell

    const setColumns = (): void => {
        // Format first columns
        for (const column of columnsHeader) {
            const index = columnsHeader.indexOf(column)
            const col = sheet.getColumn(index + 1)
            col.width = column.width
            col.style = column.style
        }
    }

    // ***** Columns *****
    setColumns()

    // ***** Rows *****
    // Column description row
    let currentRowNumber = 1

    const row: Excel.Row = sheet.getRow(currentRowNumber)
    row.alignment = textAlign
    row.numFmt = textNumberFmt
    row.fill = fillPattern(colourContrastMiddle)
    row.font = fontColourBold(colourContrastNearWhite)

    sheet.getCell(currentRowNumber, 1).value = "Rate"
    sheet.getCell(currentRowNumber, 2).value = "Name"
    sheet.getCell(currentRowNumber, 3).value = "BR"
    sheet.getCell(currentRowNumber, 4).value = "Max speed"
    sheet.getCell(currentRowNumber, 5).value = "Degree"
    sheet.getCell(currentRowNumber, 6).value = "Current speed"
    sheet.getCell(currentRowNumber, 7).value = "Proposed speed"
    sheet.getCell(currentRowNumber, 8).value = "Current"
    sheet.getCell(currentRowNumber, 9).value = "Proposal"

    // Ship row
    currentRowNumber += 1

    cell = sheet.getCell(currentRowNumber, 1)
    addIntToCell(cell, ship.class)
    cell.fill = fillPattern(colourWhite)

    cell = sheet.getCell(currentRowNumber, 2)
    addTextToCell(cell, ship.name)
    cell.fill = fillPattern(colourWhite)

    cell = sheet.getCell(currentRowNumber, 3)
    addIntToCell(cell, ship.battleRating)
    cell.fill = fillPattern(colourWhite)

    cell = sheet.getCell(currentRowNumber, 4)
    addFloatToCell(cell, ship.speed.max)
    cell.fill = fillPattern(colourWhite)

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const apiShip = apiShipData.get(ship.id)!
    for (const [index, speed] of apiShip.Specs.SpeedToWind.reverse().entries()) {
        const degrees = (index * degreesFullCircle) / ship.speedDegrees.length
        cell = sheet.getCell(currentRowNumber, 5)
        addIntToCell(cell, degrees)

        for (const column of [6, 7]) {
            cell = sheet.getCell(currentRowNumber, column)
            addFloatToCell(cell, formula(`$${getExcelAlpha(4)}$2*$${getExcelAlpha(column + 2)}${currentRowNumber}/100`))
            cell.fill = fillPattern(colourContrastLight)
        }
        for (const column of [8, 9]) {
            cell = sheet.getCell(currentRowNumber, column)
            addIntToCell(cell, round(speed, 2) * 100)
            cell.fill = column === 9 ? fillPattern(colourWhite) : fillPattern(colourContrastLight)
        }
        currentRowNumber++
    }

    let referenceIndex = currentRowNumber - 2
    for (const [index] of apiShip.Specs.SpeedToWind.slice(1, -1).entries()) {
        const degrees = degreesHalfCircle + ((index + 1) * degreesFullCircle) / ship.speedDegrees.length
        cell = sheet.getCell(currentRowNumber, 5)
        addIntToCell(cell, degrees)

        for (const column of [6, 7]) {
            cell = sheet.getCell(currentRowNumber, column)
            addFloatToCell(cell, formula(`$${getExcelAlpha(4)}$2*$${getExcelAlpha(column + 2)}${currentRowNumber}/100`))
            cell.fill = fillPattern(colourContrastLight)
        }
        for (const column of [8, 9]) {
            cell = sheet.getCell(currentRowNumber, column)
            addIntToCell(cell, formula(`${getExcelAlpha(column)}${referenceIndex}`))
            cell.fill = fillPattern(colourContrastLight)
        }

        referenceIndex--
        currentRowNumber++
    }
}

/**
 * Create excel spreadsheet
 */
const createShipSheets = async (): Promise<void> => {
    const date = new Date(currentServerStartDate)

    workbook = new Excel.Workbook()

    workbook.creator = "Felix Victor"
    workbook.lastModifiedBy = "Felix Victor"
    workbook.created = date
    workbook.modified = date
    workbook.lastPrinted = date

    for (const ship of shipData) {
        const sheet = workbook.addWorksheet(ship.name, wsOptions)

        fillSheet(sheet, ship)
    }

    await workbook.xlsx.writeFile(commonPaths.fileShipSheet)
}

export const createShipWorkbook = async (): Promise<void> => {
    setupData()
    await createShipSheets()
}
