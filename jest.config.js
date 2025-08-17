module.exports = {
  roots: ['<rootDir>/test'],
  moduleFileExtensions: ['js', 'json', 'ts'],
  testRegex: '.*\.spec\.ts$',
  transform: {
    '^.+\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['src/**/*.(t|j)s'],
  coverageDirectory: 'coverage',
  testEnvironment: 'node',
};
