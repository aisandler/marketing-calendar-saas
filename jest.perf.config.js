/** @type {import('@jest/types').Config.InitialOptions} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/tests/performance/setupPerformanceTests.ts'],
  testMatch: ['**/*.perf.test.ts?(x)'],
  verbose: true,
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      isolatedModules: true,
    },
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/src/tests/__mocks__/fileMock.js',
  },
  collectCoverage: false, // Disable coverage for performance tests
  maxWorkers: 1, // Run tests serially for consistent performance measurements
  testTimeout: 30000, // 30 seconds timeout for performance tests
  reporters: [
    'default',
    ['jest-junit', {
      outputDirectory: './performance-reports',
      outputName: 'junit-perf.xml',
      classNameTemplate: '{classname}',
      titleTemplate: '{title}',
      ancestorSeparator: ' › ',
      addFileAttribute: true,
    }],
  ],
}; 