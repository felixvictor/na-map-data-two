import type { UserConfig } from "@commitlint/types"
import { RuleConfigSeverity } from "@commitlint/types"

const config: UserConfig = {
    extends: ["@commitlint/config-conventional"],
    ignores: [(message) => message.includes("WIP")],
    rules: {
        "subject-case": [RuleConfigSeverity.Error, "never", ["start-case", "pascal-case", "upper-case"]],
        "type-enum": [
            RuleConfigSeverity.Error,
            "always",
            ["build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test"],
        ],
    },
}

export default config
