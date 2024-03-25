/* eslint-env node */
module.exports = {
    extends: [
        "eslint:recommended",
        "plugin:@typescript-eslint/strict",
        "plugin:@typescript-eslint/stylistic",
        "prettier",
    ],
    env: {
        node: true,
    },
    ignorePatterns: [".gitignore", "build/", "lib/"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    root: true,
}
