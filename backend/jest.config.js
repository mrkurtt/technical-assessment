/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  collectCoverage: true,
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov"],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/index.ts",
    "!src/types/**",
    "!src/**/*.d.ts",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  // Set up environment variables for tests
  setupFiles: ["./tests/setup.js"],
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/tests/db.test.ts",
    "/utils/db.ts",
  ],
  testPathIgnorePatterns: ["/node_modules/", "/dist/", "/tests/db.test.ts"],
};
