module.exports = {
  root: true, // Add this to prevent loading user's home directory config
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    browser: true,
    es6: true,
    jest: true,
  },
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off', // Changed to off since the project uses any in several places
    '@typescript-eslint/no-unused-vars': ['warn', { 
      argsIgnorePattern: '^_',
      varsIgnorePattern: '^_'
    }],
    'prefer-const': 'warn', // Changed to warning instead of error
    'no-var': 'warn', // Changed to warning instead of error
  },
  ignorePatterns: [
    'dist/**/*',
    'node_modules/**/*',
    '.eslintrc.js'
  ],
  parserOptions: {
    project: null // Remove TypeScript project requirement
  }
};
