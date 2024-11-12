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
  }
};
