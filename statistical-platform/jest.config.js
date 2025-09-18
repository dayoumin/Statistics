/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>'],
  testMatch: [
    '**/__tests__/**/*.(test|spec).(ts|tsx|js)',
    '**/?(*.)+(spec|test).(ts|tsx|js)',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/test-data/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testTimeout: 30000,
  maxWorkers: '50%',
  verbose: true,
  testPathIgnorePatterns: [
    '<rootDir>/e2e/',
    '<rootDir>/__tests__/statistics/r-spss-validation.test.ts',
    '<rootDir>/__tests__/statistics/nist-validation.test.ts',
    '<rootDir>/__tests__/statistics/python-direct-test.test.ts',
    '<rootDir>/lib/statistics/__tests__/method-mapping.test.ts',
    '<rootDir>/__tests__/statistics/statistical-validation.test.ts'
  ],
}