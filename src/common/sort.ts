/**
 * Sort by a list of properties (in left-to-right order)
 */
type sortArg<T> = keyof T | `-${string & keyof T}`
export const sortBy =
    <T extends object>(propertyNames: sortArg<T>[]) =>
    (a: T, b: T): number => {
        let r = 0
        propertyNames.some((propertyName: sortArg<T>) => {
            let key = propertyName as keyof T
            let sign = 1

            // property starts with '-' when sort is descending
            if (String(propertyName).startsWith("-")) {
                sign = -1
                key = String(key).slice(1) as keyof T
            }

            if (Number.isNaN(Number(a[key])) && Number.isNaN(Number(b[key]))) {
                r = simpleStringSort(String(a[key]), String(b[key])) * sign
            } else {
                r = simpleNumberSort(Number(a[key]), Number(b[key])) * sign
            }

            return r !== 0
        })

        return r
    }

/**
 * Simple sort of strings a and b
 * @param   a - String a
 * @param   b - String b
 * @returns Sort result
 */
export const simpleStringSort = (a: string | undefined, b: string | undefined): number =>
    a && b ? a.localeCompare(b) : 0

/**
 * Simple sort of numbers a and b
 */
export const simpleNumberSort = (a: number | undefined, b: number | undefined): number => (a && b ? a - b : 0)
