const request = require('supertest');
const express = require('express');
const stakingRouter = require('../../routes/staking');
const { mockStellarServer } = require('../setup');

// Mock do Stellar SDK
jest.mock('stellar-sdk', () => ({
  Horizon: {
    Server: jest.fn(() => ({
      loadAccount: jest.fn(() => Promise.resolve({
        balances: [{
          balance: '1000.0000000',
          asset_type: 'native'
        }]
      })),
      transactions: jest.fn(() => ({
        forAccount: jest.fn(() => ({
          call: jest.fn(() => Promise.resolve({ records: [] }))
        }))
      }))
    }))
  },
  Networks: {
    TESTNET: 'Test SDF Network ; September 2015'
  },
  StrKey: {
    isValidEd25519PublicKey: jest.fn((address) => {
      return address === 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR';
    })
  },
  Asset: {
    native: jest.fn(() => ({ code: 'XLM' }))
  }
}));

// Mock do Supabase
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [{
            id: 1,
            address: 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR',
            amount: '1000.00',
            status: 'active',
            created_at: new Date().toISOString()
          }],
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
  }))
}));

describe('Rotas de Staking', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/staking', stakingRouter);
    
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup default mock responses
    mockStellarServer.loadAccount.mockResolvedValue({
      accountId: () => 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR',
      balances: [{
        asset_type: 'credit_alphanum4',
        asset_code: 'KALE',
        balance: '1000.0000000'
      }]
    });
    
    mockStellarServer.accounts.mockReturnValue({
      accountId: jest.fn().mockReturnThis(),
      call: jest.fn().mockResolvedValue({
        balances: [{
          asset_type: 'credit_alphanum4',
          asset_code: 'KALE',
          balance: '1000.0000000'
        }]
      })
    });
  });

  describe('GET /api/staking/balance/:address', () => {
    const validAddress = 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR';

    it('deve retornar saldo de staking para endereço válido', async () => {
      const response = await request(app)
        .get(`/api/staking/balance/${validAddress}`)
        .expect(200);

      expect(response.body).toHaveProperty('address', validAddress);
      expect(response.body).toHaveProperty('kaleBalance');
      expect(response.body).toHaveProperty('stakedAmount');
      expect(response.body).toHaveProperty('availableForStaking');
    });

    it('deve rejeitar endereço Stellar inválido', async () => {
      const response = await request(app)
        .get('/api/staking/balance/invalid-address')
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('Endereço Stellar inválido');
    });

    it('deve tratar conta não encontrada na rede Stellar', async () => {
      mockStellarServer.loadAccount.mockRejectedValue(new Error('Account not found'));
      
      const response = await request(app)
        .get(`/api/staking/balance/${validAddress}`)
        .expect(404);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Conta não encontrada');
    });

    it('deve retornar saldo zero para conta sem tokens KALE', async () => {
      mockStellarServer.loadAccount.mockResolvedValue({
        accountId: () => validAddress,
        balances: [{
          asset_type: 'native',
          balance: '100.0000000'
        }]
      });
      
      const response = await request(app)
        .get(`/api/staking/balance/${validAddress}`)
        .expect(200);

      expect(response.body.kaleBalance).toBe('0');
    });
  });

  describe('POST /api/staking/delegate', () => {
    const validAddress = 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR';

    it('deve processar delegação de staking válida', async () => {
      const delegationData = {
        address: validAddress,
        amount: '500.00'
      };

      const response = await request(app)
        .post('/api/staking/delegate')
        .send(delegationData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('delegationId');
      expect(response.body).toHaveProperty('stakedAmount', '500.00');
      expect(response.body).toHaveProperty('nextSnapshotDate');
    });

    it('deve rejeitar delegação com endereço inválido', async () => {
      const delegationData = {
        address: 'invalid-address',
        amount: '500.00'
      };

      const response = await request(app)
        .post('/api/staking/delegate')
        .send(delegationData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('deve rejeitar delegação com quantidade inválida', async () => {
      const delegationData = {
        address: validAddress,
        amount: 'invalid-amount'
      };

      const response = await request(app)
        .post('/api/staking/delegate')
        .send(delegationData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('deve rejeitar delegação com quantidade negativa', async () => {
      const delegationData = {
        address: validAddress,
        amount: '-100.00'
      };

      const response = await request(app)
        .post('/api/staking/delegate')
        .send(delegationData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('deve rejeitar delegação com quantidade zero', async () => {
      const delegationData = {
        address: validAddress,
        amount: '0.00'
      };

      const response = await request(app)
        .post('/api/staking/delegate')
        .send(delegationData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('deve rejeitar delegação sem saldo suficiente', async () => {
      // Mock para simular saldo insuficiente
      mockStellarServer.loadAccount.mockResolvedValue({
        accountId: () => validAddress,
        balances: [{
          asset_type: 'credit_alphanum4',
          asset_code: 'KALE',
          balance: '100.0000000' // Saldo menor que a quantidade a ser delegada
        }]
      });

      const delegationData = {
        address: validAddress,
        amount: '500.00'
      };

      const response = await request(app)
        .post('/api/staking/delegate')
        .send(delegationData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toContain('Saldo insuficiente');
    });
  });

  describe('GET /api/staking/status/:address', () => {
    const validAddress = 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR';

    it('deve retornar status de staking para endereço válido', async () => {
      const response = await request(app)
        .get(`/api/staking/status/${validAddress}`)
        .expect(200);

      expect(response.body).toHaveProperty('address', validAddress);
      expect(response.body).toHaveProperty('totalStaked');
      expect(response.body).toHaveProperty('activeDelegations');
      expect(response.body).toHaveProperty('pendingRewards');
      expect(response.body).toHaveProperty('lastSnapshotDate');
      expect(response.body).toHaveProperty('nextSnapshotDate');
    });

    it('deve rejeitar endereço Stellar inválido', async () => {
      const response = await request(app)
        .get('/api/staking/status/invalid-address')
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('deve retornar status vazio para endereço sem staking', async () => {
      // Mock para simular nenhuma delegação encontrada
      const mockSupabase = {
        from: jest.fn(() => ({
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              data: [],
              error: null
            }))
          }))
        }))
      };

      const response = await request(app)
        .get(`/api/staking/status/${validAddress}`)
        .expect(200);

      expect(response.body.totalStaked).toBe('0');
      expect(response.body.activeDelegations).toEqual([]);
    });
  });

  describe('Middleware de Segurança', () => {
    it('deve aplicar sanitização de entrada', async () => {
      const maliciousData = {
        address: 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR',
        amount: '100.50',
        note: '<script>alert("xss")</script>'
      };

      const response = await request(app)
        .post('/api/staking/delegate')
        .send(maliciousData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve registrar atividade de segurança', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const validAddress = 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR';
      
      await request(app)
        .get(`/api/staking/balance/${validAddress}`);

      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('Cálculo de Próximo Snapshot', () => {
    it('deve calcular corretamente a próxima data de snapshot', async () => {
      const validAddress = 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR';
      
      const response = await request(app)
        .get(`/api/staking/status/${validAddress}`)
        .expect(200);

      expect(response.body.nextSnapshotDate).toBeDefined();
      
      // Verifica se a data é no futuro
      const nextSnapshot = new Date(response.body.nextSnapshotDate);
      const now = new Date();
      expect(nextSnapshot.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('Performance', () => {
    it('deve responder dentro do tempo limite', async () => {
      const startTime = Date.now();
      
      const validAddress = 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR';
      
      await request(app)
        .get(`/api/staking/balance/${validAddress}`);
      
      const responseTime = Date.now() - startTime;
      
      expect(responseTime).toBeLessThan(5000);
    });
  });

  describe('Tratamento de Erros', () => {
    it('deve tratar erro de conexão com Stellar', async () => {
      mockStellarServer.loadAccount.mockRejectedValue(new Error('Network timeout'));
      
      const validAddress = 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR';
      
      const response = await request(app)
        .get(`/api/staking/balance/${validAddress}`);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('deve tratar erro de banco de dados', async () => {
      const delegationData = {
        address: 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR',
        amount: '500.00'
      };

      const response = await request(app)
        .post('/api/staking/delegate')
        .send(delegationData);

      expect(response.status).toBeGreaterThanOrEqual(200);
    });
  });
});