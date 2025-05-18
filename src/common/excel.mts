import Excel from "exceljs"

export const colourWhite = "00f1efe9"
export const colourPrimaryWhite = "00edeae8"
export const colourContrastWhite = "00e8e8e3"
export const colourContrastNearWhite = "00e0e0d9"
export const colourContrastLight = "00c2c1b3"
export const colourContrastMiddle = "00858468"
export const colourText = "0029281a"
export const colourHighlight = "003bad8b"
export const colourRed = "00b5467d"

/**
 * Set default font
 * {@link https://github.com/exceljs/exceljs/issues/572#issuecomment-631788521}
 */
export const defaultFont: Partial<Excel.Font> = {
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

export const intNumberFmt = "#"
export const intAlign: Partial<Excel.Alignment> = {
    horizontal: "right",
    indent: 1,
    vertical: "middle",
}
export const intStyle: Partial<Excel.Style> = {
    alignment: intAlign,
    numFmt: intNumberFmt,
}

export const floatNumberFmt = "#,###0.000"
export const floatAlign: Partial<Excel.Alignment> = {
    horizontal: "right",
    indent: 1,
    vertical: "middle",
}
export const floatStyle: Partial<Excel.Style> = {
    alignment: floatAlign,
    numFmt: floatNumberFmt,
}

export const textNumberFmt = "@"
export const textAlign: Partial<Excel.Alignment> = {
    horizontal: "left",
    indent: 1,
    vertical: "middle",
}
export const textStyle: Partial<Excel.Style> = {
    alignment: textAlign,
    numFmt: textNumberFmt,
}

export const fillPattern = (fgColour: string): Excel.FillPattern => ({
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: fgColour },
})

export const fontColourBold = (colour: string): Partial<Excel.Font> => ({
    ...defaultFont,

    bold: true,
    color: { argb: colour },
})

export const border: Partial<Excel.Borders> = {
    top: {
        style: "thin",
        color: { argb: colourContrastMiddle },
    },
    bottom: {
        style: "thin",
        color: { argb: colourContrastMiddle },
    },
}

/**
 * Translates a column number into the Alpha equivalent used by Excel
 * {@link https://github.com/natergj/excel4node/blob/master/source/lib/utils.js}
 * @param colNumber - Column number that is to be transalated
 * @returns The Excel alpha representation of the column number
 */
export const getExcelAlpha = (colNumber: number): string => {
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

export const formula = (formula: string): Excel.CellFormulaValue => ({
    date1904: false,
    formula,
})
