// @ts-check
import tseslint from 'typescript-eslint';
import { config as nestjsConfig } from '../../packages/config/eslint/nestjs.js';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  ...nestjsConfig,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
);