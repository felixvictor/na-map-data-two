import eslint from "@eslint/js"
import eslintConfigPrettier from "eslint-config-prettier"
import nodePlugin from "eslint-plugin-n"
import eslintPluginUnicorn from "eslint-plugin-unicorn"
import globals from "globals"
import typescriptEslint from "typescript-eslint"

export default typescriptEslint.config(
    eslint.configs.recommended,
    ...typescriptEslint.configs.strictTypeChecked,
    ...typescriptEslint.configs.stylisticTypeChecked,
    eslintPluginUnicorn.configs["flat/recommended"],
    nodePlugin.configs["flat/recommended"],
    eslintConfigPrettier,
    { ignores: [".gitignore", "eslint.config.mjs", "build/"] },
    {
        languageOptions: {
            globals: {
                ...globals.es2021,
                ...globals.node,
            },
            parserOptions: {
                project: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            "@typescript-eslint/no-extraneous-class": "off",
            "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
            curly: ["error", "all"],
            "n/no-missing-import": "off",
            "n/no-unpublished-import": "off",
            "prefer-template": "error",
        },
    },
)
