import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { defineConfig } from 'eslint/config';
import eslintPluginPrettier from 'eslint-plugin-prettier/recommended';

export default defineConfig([
  {
    ignores: ['node_modules', 'lib', 'src'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    plugins: { js },
    extends: ['js/recommended'],
    languageOptions: {
      globals: {
        ...globals.node,
        wx: true,
        App: true,
        Page: true,
        getCurrentPages: true,
        getApp: true,
        Component: true,
        Behavior: true,
        requirePlugin: true,
        requireMiniProgram: true,
      },
    },
  },
  tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/ban-types': 'off',
      // 使用ts-ignore不再报错
      '@typescript-eslint/ban-ts-comment': 'off',
      // 允许使用 const self = this，用于this赋值
      '@typescript-eslint/no-this-alias': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
    },
  },
  eslintPluginPrettier,
]);
