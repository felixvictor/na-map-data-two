/** @type {import("prettier").Options} */
module.exports = {
    printWidth: 120,
    tabWidth: 4,
    semi: false,
    plugins: [require.resolve("prettier-plugin-organize-imports")],
}
