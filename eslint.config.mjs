import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

// eslint-config-next was dropped: every version pulls in fast-glob -> micromatch
// -> braces, which has an unpatched advisory (and its bundled eslint-plugin-react
// crashed under eslint 10 anyway). This covers the rules that mattered.
const eslintConfig = defineConfig([
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts", "spotify-service/**"]),
  ...tseslint.configs.recommended,
  reactHooks.configs.flat.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      // React Compiler rules. The site doesn't run the compiler, and the R3F
      // components mutate Three.js objects in useFrame on purpose.
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
  {
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
]);

export default eslintConfig;
