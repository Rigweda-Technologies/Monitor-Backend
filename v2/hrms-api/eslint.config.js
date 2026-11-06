// Correctness gate for the JavaScript v2 service. Formatting is intentionally separate.
export default [
  { ignores: ['node_modules/**', 'generated/**', 'logs/**', 'coverage/**', 'reports/**'] },
  {
    files: ['**/*.js', '**/*.cjs'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    rules: {
      'constructor-super': 'error', 'for-direction': 'error', 'getter-return': 'error',
      'no-async-promise-executor': 'error', 'no-compare-neg-zero': 'error',
      'no-cond-assign': ['error', 'except-parens'], 'no-const-assign': 'error',
      'no-dupe-args': 'error', 'no-dupe-class-members': 'error', 'no-dupe-else-if': 'error',
      'no-dupe-keys': 'error', 'no-duplicate-case': 'error', 'no-ex-assign': 'error',
      'no-fallthrough': 'error', 'no-import-assign': 'error', 'no-invalid-regexp': 'error',
      'no-loss-of-precision': 'error', 'no-self-assign': 'error', 'no-unexpected-multiline': 'error',
      'no-unreachable': 'error', 'no-unsafe-finally': 'error', 'no-unsafe-negation': 'error',
      'use-isnan': 'error', 'valid-typeof': 'error'
    }
  },
  { files: ['**/*.cjs'], languageOptions: { sourceType: 'commonjs' } }
];
