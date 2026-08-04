import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      // `.next/**` no alcanza: `next.config.ts` permite buildear a un directorio
      // alternativo con NEXT_DIST_DIR (truco de Windows para no pelear con el
      // `.next` que bloquea el dev server), y esos directorios quedaban dentro
      // del alcance del linter. Como `npm run lint` corre `eslint` sin path, se
      // lintaba el JS GENERADO: 36.777 problemas de build output tapando los ~23
      // reales de `src/`. El glob cubre `.next`, `.next-build`, `.next-verify` y
      // cualquier otro que se use en el futuro.
      ".next*/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
