/* eslint-env node */
module.exports = {
    extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "plugin:prettier/recommended"],
    ignorePatterns: [".eslintrc.cjs", ".gitignore", "build/", "lib/"],
    parser: "@typescript-eslint/parser",
    plugins: ["@typescript-eslint"],
    root: true,
    rules: {
        "prefer-template": "error",
        "prettier/prettier": "error",
    },
}
