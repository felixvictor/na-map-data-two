/**
 * Simple sort of numbers a and b
 */
export const simpleNumberSort = (a: number | undefined, b: number | undefined): number => (a && b ? a - b : 0)

/**
 * Simple sort of strings a and b
 * @param   a - String a
 * @param   b - String b
 * @returns Sort result
 */
export const simpleStringSort = (a: string | undefined, b: string | undefined): number =>
    a && b ? a.localeCompare(b) : 0

/**
 * Sort by a list of properties (in left-to-right order)
 */
export const sortBy =
    <T, K extends keyof T>(propertyNames: K[]) =>
    (a: T, b: T): number => {
        let r = 0
        propertyNames.some((propertyName: K) => {
            let sign = 1

            // property starts with '-' when sort is descending
            if (String(propertyName).startsWith("-")) {
                sign = -1
                propertyName = String(propertyName).slice(1) as K
            }

            if (Number.isNaN(Number(a[propertyName])) && Number.isNaN(Number(b[propertyName]))) {
                r = String(a[propertyName]).localeCompare(String(b[propertyName])) * sign
            } else {
                r = (Number(a[propertyName]) - Number(b[propertyName])) * sign
            }

            return r !== 0
        })

        return r
    }
