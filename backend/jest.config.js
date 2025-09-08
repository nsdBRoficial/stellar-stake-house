module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Diretórios de teste
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Arquivos de setup
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Cobertura de código
  collectCoverage: true,
  collectCoverageFrom: [
    'routes/**/*.js',
    'middleware/**/*.js',
    'config/**/*.js',
    'services/**/*.js',
    '!**/node_modules/**',
    '!**/tests/**',
    '!**/coverage/**'
  ],
  
  // Diretório de relatórios de cobertura
  coverageDirectory: 'coverage',
  
  // Formatos de relatório de cobertura
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json-summary'
  ],
  
  // Limites de cobertura desabilitados temporariamente
  // coverageThreshold: {
  //   global: {
  //     branches: 30,
  //     functions: 30,
  //     lines: 30,
  //     statements: 30
  //   }
  // },
  
  // Timeout para testes
  testTimeout: 10000,
  
  // Configurações de mock
  clearMocks: true,
  restoreMocks: true,
  
  // Transformações
  transform: {
    '^.+\\.js$': 'babel-jest'
  },
  
  // Módulos a serem ignorados
  modulePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/coverage/'
  ],
  
  // Configuração de verbose para saída detalhada
  verbose: true,
  
  // Detectar arquivos abertos
  detectOpenHandles: true,
  
  // Forçar saída após testes
  forceExit: true,
  
  // Configurações específicas para diferentes tipos de teste
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/**/*.test.js'],
      testEnvironment: 'node'
    }
  ],
  
  // Configuração de relatórios
  reporters: [
    'default',
    [
      'jest-html-reporters',
      {
        publicPath: './coverage',
        filename: 'test-report.html',
        expand: true
      }
    ]
  ],
  
  // Configurações de mock para módulos específicos
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1'
  },
  
  // Configuração para arquivos estáticos
  moduleFileExtensions: ['js', 'json', 'node'],
  
  // Configuração de setup global
  globalSetup: undefined,
  globalTeardown: undefined,
  
  // Configuração de cache
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache'
};