/**
 * Test if object is empty
 * {@link https://stackoverflow.com/a/32108184}
 * @param   object - Object
 * @returns True if object is empty
 */
export const isEmpty = (object: Record<string, unknown> | unknown | undefined): boolean =>
    object !== undefined && Object.getOwnPropertyNames(object).length === 0
