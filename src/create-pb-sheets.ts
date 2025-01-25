import { range } from "d3-array"
import Excel from "exceljs"
/**
 * Set default font
 * {@link https://github.com/exceljs/exceljs/issues/572#issuecomment-631788521}
 */
import StylesXform from "exceljs/lib/xlsx/xform/style/styles-xform.js"

import type { PortBasic } from "./@types/ports.js"
import type { ShipData } from "./@types/ships.js"
import { minDeepWaterBR } from "./common/constants.js"
import { readJson } from "./common/file.js"
import { getCommonPaths } from "./common/path.js"
import { sortBy } from "./common/sort.js"
import { currentServerStartDate } from "./common/time.js"

interface PortBR {
    name: string
    br: number
}

const commonPaths = getCommonPaths()

const maxNumberPlayers = 25
const columnWidth = 20
const rowHeight = 24
const numberRowsHeader = 4

const numberNumberFmt = "#"
const numberAlign: Partial<Excel.Alignment> = {
    horizontal: "right",
    indent: 1,
    vertical: "middle",
}
const numberStyle: Partial<Excel.Style> = {
    alignment: numberAlign,
    numFmt: numberNumberFmt,
}

const textNumberFmt = "@"
const textAlign: Partial<Excel.Alignment> = {
    horizontal: "left",
    indent: 1,
    vertical: "middle",
}
const textStyle: Partial<Excel.Style> = {
    alignment: textAlign,
    numFmt: textNumberFmt,
}

const columnsHeader = [
    { name: "Ship rate", width: 8, style: numberStyle },
    { name: "Ship name", width: 22, style: textStyle },
    { name: "Ship battle rating", width: 8, style: numberStyle },
    { name: "Number of players", width: 12, style: numberStyle },
    { name: "Total battle rating", width: 12, style: numberStyle },
]

const numberColumnsHeader = columnsHeader.length
const numberColumnsTotal = numberColumnsHeader + maxNumberPlayers

const isAIShip = (name: string): boolean => ["Basic", "Rooki", "Trade", "Tutor"].includes(name.slice(0, 5))

let workbook: Excel.Workbook
let portsDeepWater: PortBR[]
let portsShallowWater: PortBR[]
let dwShips: ShipData[]
let swShips: ShipData[]

const colourWhite = "00f1efe9"
const colourPrimaryWhite = "00edeae8"
const colourContrastWhite = "00e8e8e3"
const colourContrastNearWhite = "00e0e0d9"
const colourContrastLight = "00c2c1b3"
const colourContrastMiddle = "00858468"
const colourText = "0029281a"
const colourHighlight = "003bad8b"
const colourRed = "00b5467d"

const defaultFont: Partial<Excel.Font> = {
    bold: false,
    color: { argb: colourText },
    family: 2,
    italic: false,
    name: "Arial",
    outline: false,
    scheme: "minor",
    size: 11,
    strike: false,
    underline: false,
}

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
            xSplit: numberColumnsHeader,
            ySplit: numberRowsHeader,
        },
    ],
    properties: {
        defaultColWidth: columnWidth,
        defaultRowHeight: rowHeight,
    },
}

const setupData = () => {
    const portsOrig = readJson(commonPaths.filePort) as PortBasic[]
    const shipsOrig = readJson(commonPaths.fileShip) as ShipData[]

    portsDeepWater = portsOrig
        .filter((port) => !port.shallow)
        .map((port) => ({
            name: port.name,
            br: port.brLimit,
        }))
        .sort(sortBy(["name"]))

    portsShallowWater = portsOrig
        .filter((port) => port.shallow)
        .map((port) => ({
            name: port.name,
            br: port.brLimit,
        }))
        .sort(sortBy(["name"]))

    dwShips = shipsOrig
        .filter((ship) => !isAIShip(ship.name) && (ship.battleRating >= minDeepWaterBR || ship.name === "Mortar Brig"))
        .sort(sortBy(["class", "-battleRating", "name"]))

    swShips = shipsOrig
        .filter((ship) => !isAIShip(ship.name) && ship.isShallowWaterShip)
        .sort(sortBy(["class", "-battleRating", "name"]))
}

/**
/**
 * Returns fill pattern object
 * @param fgColour - Foreground colour
 * @returns Fill pattern
 */
const fillPattern = (fgColour: string): Excel.FillPattern => ({
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: fgColour },
})

/**
 * Returns font object with bold font
 * @param colour - Font colour
 * @returns Font object
 */
const fontColourBold = (colour: string): Partial<Excel.Font> => ({
    ...defaultFont,

    bold: true,
    color: { argb: colour },
})

const border: Partial<Excel.Borders> = {
    top: {
        style: "thin",
        color: { argb: colourContrastLight },
    },
    bottom: {
        style: "thin",
        color: { argb: colourContrastLight },
    },
}

const brTooHigh: Partial<Excel.Style> = {
    font: { ...fontColourBold(colourRed), size: 14 },
}

/**
 * Translates a column number into the Alpha equivalent used by Excel
 * {@link https://github.com/natergj/excel4node/blob/master/source/lib/utils.js}
 * @param colNum - Column number that is to be transalated
 * @returns The Excel alpha representation of the column number
 */
const getExcelAlpha = (colNumber: number): string => {
    let remaining = colNumber
    const aCharCode = 65
    let columnName = ""
    while (remaining > 0) {
        const module_ = (remaining - 1) % 26
        columnName = String.fromCodePoint(aCharCode + module_) + columnName
        remaining = (remaining - 1 - module_) / 26
    }

    return columnName
}

const formula = (formula: string): Excel.CellFormulaValue => ({
    formula,
    date1904: false,
})

/**
 * Fill worksheet
 * @param sheet - Worksheet
 * @param ships - Ship data
 * @param ports - port data
 */
function fillSheet(sheet: Excel.Worksheet, ships: ShipData[], ports: PortBR[]): void {
    const numberRowsTotal = numberRowsHeader + ships.length
    let row: Excel.Row
    let cell: Excel.Cell

    const setColumns = (): void => {
        // Format first columns
        for (const column of columnsHeader) {
            const index = columnsHeader.indexOf(column)
            const col = sheet.getColumn(index + 1)
            col.width = column.width
            col.style = column.style
        }

        // Player names
        for (const column of range(numberColumnsHeader + 1, numberColumnsHeader + maxNumberPlayers)) {
            const col = sheet.getColumn(column)
            col.width = columnWidth
            col.style = textStyle
        }
    }

    // ***** Columns *****
    setColumns()

    // ***** Rows *****
    // General description row
    let currentRowNumber = 1
    row = sheet.getRow(currentRowNumber)
    row.alignment = textAlign
    row.numFmt = textNumberFmt

    sheet.mergeCells(currentRowNumber, 1, currentRowNumber, 3)
    sheet.getCell(currentRowNumber, 1).value = "Port battle calculator by Felix Victor"
    sheet.mergeCells(currentRowNumber, 4, currentRowNumber, 5)
    sheet.getCell(currentRowNumber, 4).value = {
        text: "Game Labs Forum",
        hyperlink: "https://forum.game-labs.net/topic/23980-yet-another-map-naval-action-map/",
    }

    // Port description row
    currentRowNumber += 1
    row = sheet.getRow(currentRowNumber)
    row.alignment = textAlign
    row.numFmt = textNumberFmt
    row.fill = fillPattern(colourContrastNearWhite)

    sheet.getCell(currentRowNumber, 1).value = "Port"
    sheet.getCell(currentRowNumber, 2).value = "1. Select port"
    sheet.getCell(currentRowNumber, 2).style.font = fontColourBold(colourHighlight)
    sheet.getCell(currentRowNumber, numberColumnsHeader - 1).value = "Max BR"
    sheet.getCell(currentRowNumber, numberColumnsHeader).numFmt = numberNumberFmt

    // Column description row
    currentRowNumber += 1
    row = sheet.getRow(currentRowNumber)
    row.alignment = textAlign
    row.numFmt = textNumberFmt

    row.fill = fillPattern(colourContrastMiddle)
    row.font = fontColourBold(colourContrastNearWhite)

    sheet.getCell(currentRowNumber, 1).value = "Rate"
    sheet.getCell(currentRowNumber, 2).value = "Column"
    sheet.getCell(currentRowNumber, 3).value = "BR"
    sheet.getCell(currentRowNumber, 4).value = "# Players"
    sheet.getCell(currentRowNumber, 5).value = "BR total"

    sheet.mergeCells(currentRowNumber, numberColumnsHeader + 1, currentRowNumber, numberColumnsHeader + 2)
    sheet.getCell(currentRowNumber, numberColumnsHeader + 1).value = "Player names"

    // Total row
    currentRowNumber += 1
    row = sheet.getRow(currentRowNumber)
    row.fill = fillPattern(colourContrastMiddle)

    cell = sheet.getCell(currentRowNumber, numberColumnsHeader - 1)
    cell.value = formula(
        `SUM(${getExcelAlpha(numberColumnsHeader - 1)}${numberRowsHeader + 1}:${getExcelAlpha(
            numberColumnsHeader - 1,
        )}${numberRowsTotal})`,
    )
    cell.alignment = numberAlign
    cell.numFmt = numberNumberFmt
    cell.font = fontColourBold(colourText)
    cell.fill = fillPattern(colourContrastLight)

    cell = sheet.getCell(currentRowNumber, numberColumnsHeader)
    cell.value = formula(
        `SUM(${getExcelAlpha(numberColumnsHeader)}${numberRowsHeader + 1}:${getExcelAlpha(numberColumnsHeader)}${numberRowsTotal})`,
    )
    cell.alignment = numberAlign
    cell.numFmt = numberNumberFmt
    cell.font = fontColourBold(colourText)
    cell.fill = fillPattern(colourContrastLight)

    sheet.mergeCells(currentRowNumber, numberColumnsHeader + 1, currentRowNumber, numberColumnsTotal)
    cell = sheet.getCell(currentRowNumber, numberColumnsHeader + 1)
    cell.value = "2. Enter player names"
    cell.alignment = textAlign
    cell.numFmt = textNumberFmt
    cell.fill = fillPattern(colourContrastMiddle)
    cell.font = fontColourBold(colourHighlight)

    // Ship rows
    const fgColourShip = [colourWhite, colourContrastWhite]
    const fgColourPlayer = [colourWhite, colourPrimaryWhite]
    for (const ship of ships) {
        currentRowNumber += 1
        row = sheet.getRow(currentRowNumber)

        cell = sheet.getCell(currentRowNumber, 1)
        cell.value = ship.class
        cell.alignment = numberAlign
        cell.numFmt = numberNumberFmt
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
        cell.alignment = numberAlign
        cell.numFmt = numberNumberFmt
        cell.border = border
        cell.fill = fillPattern(fgColourShip[ship.class % 2])

        cell = sheet.getCell(currentRowNumber, numberColumnsHeader - 1)
        cell.value = formula(
            `COUNTA(${getExcelAlpha(numberColumnsHeader + 1)}${currentRowNumber}:${getExcelAlpha(
                numberColumnsTotal,
            )}${currentRowNumber})`,
        )

        cell.alignment = numberAlign
        cell.numFmt = numberNumberFmt
        cell.border = border
        cell.fill = fillPattern(fgColourShip[ship.class % 2])

        cell = sheet.getCell(currentRowNumber, numberColumnsHeader)
        cell.value = formula(
            `${getExcelAlpha(numberColumnsHeader - 2)}${currentRowNumber}*${getExcelAlpha(
                numberColumnsHeader - 1,
            )}${currentRowNumber}`,
        )
        cell.alignment = numberAlign
        cell.numFmt = numberNumberFmt
        cell.border = border
        cell.fill = fillPattern(fgColourShip[ship.class % 2])

        for (let playerCell = numberColumnsHeader + 1; playerCell <= numberColumnsTotal; playerCell++) {
            cell = sheet.getCell(currentRowNumber, playerCell)
            cell.alignment = textAlign
            cell.numFmt = textNumberFmt
            cell.border = border
            cell.fill = fillPattern(fgColourPlayer[ship.class % 2])
        }
    }

    // BR too high colour
    sheet.addConditionalFormatting({
        ref: `${getExcelAlpha(numberColumnsHeader)}${numberRowsHeader}`,
        rules: [
            {
                type: "expression",
                priority: 1,
                formulae: [
                    `AND(NOT(ISBLANK(${getExcelAlpha(numberColumnsHeader)}${numberRowsHeader - 2})),
                ${getExcelAlpha(numberColumnsHeader)}${numberRowsHeader} >
                ${getExcelAlpha(numberColumnsHeader)}${numberRowsHeader - 2})`,
                ], // formula that returns nonzero or 0
                style: brTooHigh,
            },
        ],
    })

    // Port select dropdown
    for (const port of ports) {
        const index = ports.indexOf(port)
        sheet.getCell(index + 1, numberColumnsTotal + 1).value = port.name
        sheet.getCell(index + 1, numberColumnsTotal + 2).value = port.br
    }

    sheet.getCell("B2").dataValidation = {
        type: "list",
        allowBlank: true,
        prompt: "Select port from dropdown",
        error: "Invalid choice",
        formulae: [
            `=${getExcelAlpha(numberColumnsTotal + 1)}1:${getExcelAlpha(numberColumnsTotal + 1)}${ports.length}`,
        ],
    }

    sheet.getCell(2, numberColumnsHeader).value = formula(
        `VLOOKUP(B2,${getExcelAlpha(numberColumnsTotal + 1)}1:${getExcelAlpha(numberColumnsTotal + 2)}${ports.length},2,0)`,
    )

    // Sample values
    sheet.getCell(numberRowsHeader + 1, numberColumnsHeader + 1).value = "Fritz"
    sheet.getCell(numberRowsHeader + 1, numberColumnsHeader + 2).value = "Franz"
    sheet.getCell(numberRowsHeader + 1, numberColumnsHeader + 3).value = "Klaus"
    sheet.getCell(numberRowsHeader + 2, numberColumnsHeader + 1).value = "x"
    sheet.getCell(numberRowsHeader + 2, numberColumnsHeader + 2).value = "X"
    sheet.getCell(numberRowsHeader + 2, numberColumnsHeader + 3).value = "x"
}

/**
 * Create excel spreadsheet
 */
const createPortBattleSheets = async (): Promise<void> => {
    const date = new Date(currentServerStartDate)

    workbook = new Excel.Workbook()

    workbook.creator = "Felix Victor"
    workbook.lastModifiedBy = "Felix Victor"
    workbook.created = date
    workbook.modified = date
    workbook.lastPrinted = date

    const dwSheet = workbook.addWorksheet("Deep water port", wsOptions)
    const swSheet = workbook.addWorksheet("Shallow water port", wsOptions)

    fillSheet(dwSheet, dwShips, portsDeepWater)
    fillSheet(swSheet, swShips, portsShallowWater)

    await workbook.xlsx.writeFile(commonPaths.filePbSheet)
}

export const createPortBattleSheet = async (): Promise<void> => {
    setupData()
    await createPortBattleSheets()
}
