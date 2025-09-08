require('dotenv').config();

// Mock do Supabase para testes
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: [],
        error: null
      })),
      order: jest.fn(() => ({
        data: [],
        error: null
      }))
    })),
    insert: jest.fn(() => ({
      data: [{ id: 1 }],
      error: null
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: [{ id: 1 }],
        error: null
      }))
    }))
  }))
};

// Mock do createClient
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}));

// Mock para Stellar SDK em testes
const mockStellarServer = {
  loadAccount: jest.fn(),
  accounts: () => ({
    accountId: jest.fn().mockReturnThis(),
    call: jest.fn()
  }),
  transactions: () => ({
    forAccount: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    call: jest.fn()
  })
};

// Configurações globais para testes
global.testConfig = {
  supabase: mockSupabase,
  mockStellarServer,
  testTimeout: 10000
};

// Setup antes de todos os testes
beforeAll(async () => {
  console.log('🧪 Configurando ambiente de testes...');
});

// Cleanup após todos os testes
afterAll(async () => {
  console.log('🧹 Limpando ambiente de testes...');
});

// Reset de mocks antes de cada teste
beforeEach(() => {
  jest.clearAllMocks();
});

module.exports = {
  supabase: mockSupabase,
  mockStellarServer
};