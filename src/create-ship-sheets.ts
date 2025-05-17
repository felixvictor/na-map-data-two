import { range } from "d3-array"
import Excel from "exceljs"
import StylesXform from "exceljs/lib/xlsx/xform/style/styles-xform.js"

import type { ShipData } from "./@types/ships.js"
import { degreesFullCircle } from "./common/constants.js"
import {
    border,
    colourContrastMiddle,
    colourContrastNearWhite,
    colourContrastWhite,
    colourWhite,
    defaultFont,
    fillPattern,
    floatAlign,
    floatNumberFmt,
    fontColourBold,
    intAlign,
    intNumberFmt,
    intStyle,
    textAlign,
    textNumberFmt,
    textStyle,
} from "./common/excel.mjs"
import { readJson } from "./common/file.js"
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

const setupData = () => {
    shipData = (readJson(commonPaths.fileShip) as ShipData[]).sort(sortBy(["name"]))
}

const fgColourShip = [colourWhite, colourContrastWhite]

function fillSheet(sheet: Excel.Worksheet, ship: ShipData): void {
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

    // Ship row
    currentRowNumber += 1

    cell = sheet.getCell(currentRowNumber, 1)
    cell.value = ship.class
    cell.alignment = intAlign
    cell.numFmt = intNumberFmt
    cell.border = border
    cell.fill = fillPattern(fgColourShip[ship.class % 2])

    cell = sheet.getCell(currentRowNumber, 2)
    cell.value = ship.name
    cell.alignment = textAlign
    cell.numFmt = textNumberFmt
    cell.border = border
    cell.fill = fillPattern(fgColourShip[ship.class % 2])

    cell = sheet.getCell(currentRowNumber, 3)
    cell.value = ship.battleRating
    cell.alignment = intAlign
    cell.numFmt = intNumberFmt
    cell.border = border
    cell.fill = fillPattern(fgColourShip[ship.class % 2])

    currentRowNumber += 1
    cell = sheet.getCell(currentRowNumber, 1)
    cell.value = "Degrees"
    cell.alignment = textAlign
    cell.numFmt = textNumberFmt
    cell.border = border

    cell = sheet.getCell(currentRowNumber, 2)
    cell.value = "Current"
    cell.alignment = textAlign
    cell.numFmt = textNumberFmt
    cell.border = border

    cell = sheet.getCell(currentRowNumber, 3)
    cell.value = "Proposal"
    cell.alignment = textAlign
    cell.numFmt = textNumberFmt
    cell.border = border

    currentRowNumber += 1
    for (const [index, speed] of ship.speedDegrees.entries()) {
        cell = sheet.getCell(currentRowNumber, 1)
        cell.value = (index * degreesFullCircle) / ship.speedDegrees.length
        cell.alignment = textAlign
        cell.numFmt = textNumberFmt
        cell.border = border
        for (const column of [2, 3]) {
            cell = sheet.getCell(currentRowNumber, column)
            cell.value = speed
            cell.alignment = floatAlign
            cell.numFmt = floatNumberFmt
            cell.border = border
        }
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
