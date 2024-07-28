import { FlatCompat } from "@eslint/eslintrc"
import eslint from "@eslint/js"
import prettierConfig from "eslint-config-prettier"
import nodePlugin from "eslint-plugin-n"
import globals from "globals"
import tseslint from "typescript-eslint"

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
})

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    nodePlugin.configs["flat/recommended"],
    prettierConfig,
    { ignores: [".gitignore", "eslint.config.mjs"] },
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
            "@typescript-eslint/consistent-type-imports": [
                "error",
                {
                    // 'inline-type-imports' | 'separate-type-imports';
                    fixStyle: "separate-type-imports",
                    // 'no-type-imports' | 'type-imports';
                    prefer: "type-imports",
                },
            ],
            "@typescript-eslint/no-extraneous-class": "off",
            "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
            "n/no-missing-import": "off",
            "n/no-unpublished-import": "off",
            "prefer-template": "error",
        },
    },
)
