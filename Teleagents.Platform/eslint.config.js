//  @ts-check

import { tanstackConfig } from "@tanstack/eslint-config"
import prettierConfig from "eslint-config-prettier"

export default [
  ...tanstackConfig,
  prettierConfig,
  {
    rules: {
      "import/order": "off",
      "sort-imports": "off",
      "import/newline-after-import": "off",
    },
  },
]
