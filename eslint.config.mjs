import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { FlatCompat } from '@eslint/eslintrc'

// eslint-config-next 15 still ships an eslintrc-style preset; FlatCompat
// translates it for ESLint 9.
const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) })

const config = [
  {
    ignores: ['.next/**', 'node_modules/**', 'coverage/**', 'project_venv/**', 'next-env.d.ts'],
  },
  ...compat.extends('next/core-web-vitals'),
  {
    rules: {
      'react-hooks/exhaustive-deps': 'warn',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': 'off',
    },
  },
]

export default config
