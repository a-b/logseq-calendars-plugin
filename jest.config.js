/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '^@logseq/libs$': '<rootDir>/test/__mocks__/@logseq/libs.ts'
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        isolatedModules: true,
        diagnostics: {
          ignoreCodes: [7016] // Ignore "Could not find a declaration file" errors
        }
      }
    ]
  },
  cacheDirectory: '.jest-cache',
  maxWorkers: process.env.CI ? 2 : '50%',
  collectCoverage: process.env.CI === 'true',
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov'],
  testTimeout: 10000,
  verbose: true
};
