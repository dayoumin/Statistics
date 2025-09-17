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
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      // any 타입 사용 금지 (타입 안전성 강화)
      "@typescript-eslint/no-explicit-any": "error",

      // 미사용 변수도 warning으로 (개발 중)
      "@typescript-eslint/no-unused-vars": ["warn", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],

      // React hooks 의존성 warning으로
      "react-hooks/exhaustive-deps": "warn",

      // 빈 인터페이스 허용
      "@typescript-eslint/no-empty-interface": "off",

      // 빈 함수 허용
      "@typescript-eslint/no-empty-function": "off",

      // console 사용 허용 (개발 중)
      "no-console": "off",

      // React display name 끄기
      "react/display-name": "off",

      // React에서 React import 필수 아님 (React 17+)
      "react/react-in-jsx-scope": "off",
    }
  }
];

export default eslintConfig;
