// Correctness gate for legacy JavaScript; formatting changes are deliberately separate.
module.exports = [{
  ignores: ["node_modules/**", "logs/**", "coverage/**"]
}, {
  files: ["**/*.js", "**/*.cjs"],
  languageOptions: { ecmaVersion: "latest", sourceType: "commonjs" },
  rules: {
    "constructor-super": "error",
    "for-direction": "error",
    "getter-return": "error",
    "no-async-promise-executor": "error",
    "no-compare-neg-zero": "error",
    "no-cond-assign": ["error", "except-parens"],
    "no-const-assign": "error",
    "no-dupe-args": "error",
    "no-dupe-class-members": "error",
    "no-dupe-else-if": "error",
    "no-dupe-keys": "error",
    "no-duplicate-case": "error",
    "no-ex-assign": "error",
    "no-fallthrough": "error",
    "no-invalid-regexp": "error",
    "no-loss-of-precision": "error",
    "no-unexpected-multiline": "error",
    "no-unreachable": "error",
    "no-unsafe-finally": "error",
    "use-isnan": "error",
    "valid-typeof": "error"
  }
}];
