const locale = "en-GB"

/**
 * {@link https://stackoverflow.com/questions/1026069/how-do-i-make-the-first-letter-of-a-string-uppercase-in-javascript}
 * @param   string - String
 * @returns Upper-cased string
 */
export const capitalizeFirstLetter = (string: string): string => string.charAt(0).toUpperCase() + string.slice(1)

/**
 * {@link https://github.com/30-seconds/30-seconds-of-code#round}
 * @param n - number
 * @param d - decimals
 * @returns Rounded number
 */
export const round = (n: number, d = 0): number => Number(Math.round(n * 10 ** d) / 10 ** d)

/**
 * Round to thousands
 * @param   x - Integer
 * @returns Rounded input
 */
export const roundToThousands = (x: number): number => round(x, 3)

const ordinalRules = new Intl.PluralRules(locale, { type: "ordinal" })
const suffixes = new Map([
    ["one", "st"],
    ["two", "nd"],
    ["few", "rd"],
    ["other", "th"],
])
const suffixesSuper = new Map([
    ["one", "ˢᵗ"],
    ["two", "ⁿᵈ"],
    ["few", "ʳᵈ"],
    ["other", "ᵗʰ"],
])

/**
 * Format ordinal
 * @param   n - Integer
 * @param   sup - True if superscript tags needed
 */
export function getOrdinal(n: number, sup = true) {
    const rule = ordinalRules.select(n)
    const suffix = sup ? suffixesSuper.get(rule) : suffixes.get(rule)
    return `${n}${suffix}`
}
