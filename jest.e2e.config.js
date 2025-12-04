export default {
  clearMocks: true,
  transform: {},
  testEnvironment: "node",
  coverageProvider: "v8",
  testMatch: ["<rootDir>/tests/e2e/**/*.test.js"],
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },
  cache: false,
  maxWorkers: 1,
  testTimeout: 30000,
};
