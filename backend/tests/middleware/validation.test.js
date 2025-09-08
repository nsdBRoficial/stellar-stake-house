const request = require('supertest');
const express = require('express');
const {
  validateStellarAddress,
  validateStellarAddressBody,
  validatePagination,
  validateHistoryFilters,
  validateStakingDelegation,
  sanitizeInput,
  securityLoggerMiddleware
} = require('../../middleware/validation');

describe('Middleware de Validação', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  describe('validateStellarAddress', () => {
    it('deve aceitar endereço Stellar válido', async () => {
      app.get('/test/:address', validateStellarAddress, (req, res) => {
        res.json({ success: true });
      });

      const validAddress = 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR';
      const response = await request(app)
        .get(`/test/${validAddress}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve rejeitar endereço Stellar inválido', async () => {
      app.get('/test/:address', validateStellarAddress, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test/invalid-address')
        .expect(400);

      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].msg).toContain('Endereço Stellar inválido');
    });

    it('deve rejeitar endereço vazio', async () => {
      app.get('/test/:address', validateStellarAddress, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test/')
        .expect(404); // Rota não encontrada para endereço vazio
    });
  });

  describe('validateStellarAddressBody', () => {
    it('deve aceitar endereço Stellar válido no body', async () => {
      app.post('/test', validateStellarAddressBody, (req, res) => {
        res.json({ success: true });
      });

      const validAddress = 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR';
      const response = await request(app)
        .post('/test')
        .send({ stellar_address: validAddress })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve rejeitar endereço Stellar inválido no body', async () => {
      app.post('/test', validateStellarAddressBody, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .post('/test')
        .send({ stellar_address: 'invalid-address' })
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('validatePagination', () => {
    it('deve aceitar parâmetros de paginação válidos', async () => {
      app.get('/test', validatePagination, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve rejeitar página negativa', async () => {
      app.get('/test', validatePagination, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test?page=-1&limit=10')
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });

    it('deve rejeitar limite muito alto', async () => {
      app.get('/test', validatePagination, (req, res) => {
        res.json({ success: true });
      });

      const response = await request(app)
        .get('/test?page=1&limit=1000')
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('validateStakingDelegation', () => {
    it('deve aceitar dados de delegação válidos', async () => {
      app.post('/test', validateStakingDelegation, (req, res) => {
        res.json({ success: true });
      });

      const validData = {
        address: 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR',
        amount: '100.50'
      };

      const response = await request(app)
        .post('/test')
        .send(validData)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve rejeitar quantidade inválida', async () => {
      app.post('/test', validateStakingDelegation, (req, res) => {
        res.json({ success: true });
      });

      const invalidData = {
        address: 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR',
        amount: 'invalid-amount'
      };

      const response = await request(app)
        .post('/test')
        .send(invalidData)
        .expect(400);

      expect(response.body.errors).toBeDefined();
    });
  });

  describe('sanitizeInput', () => {
    it('deve sanitizar entrada maliciosa', async () => {
      app.post('/test', sanitizeInput, (req, res) => {
        res.json({ body: req.body, query: req.query });
      });

      const maliciousData = {
        name: '<script>alert("xss")</script>',
        description: 'Normal text'
      };

      const response = await request(app)
        .post('/test?search=<img src=x onerror=alert(1)>')
        .send(maliciousData)
        .expect(200);

      // Verifica se o script foi removido
      expect(response.body.body.name).not.toContain('<script>');
      expect(response.body.query.search).not.toContain('<img');
    });

    it('deve preservar texto normal', async () => {
      app.post('/test', sanitizeInput, (req, res) => {
        res.json({ body: req.body });
      });

      const normalData = {
        name: 'João Silva',
        email: 'joao@example.com'
      };

      const response = await request(app)
        .post('/test')
        .send(normalData)
        .expect(200);

      expect(response.body.body.name).toBe('João Silva');
      expect(response.body.body.email).toBe('joao@example.com');
    });
  });

  describe('securityLoggerMiddleware', () => {
    it('deve registrar acesso a endpoint', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      app.get('/test', securityLoggerMiddleware, (req, res) => {
        res.json({ success: true });
      });

      await request(app)
        .get('/test')
        .expect(200);

      // Verifica se o log foi chamado
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });
});

// Testes de integração
describe('Integração de Middlewares', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
  });

  it('deve aplicar múltiplos middlewares em sequência', async () => {
    app.post('/test/:address', 
      validateStellarAddress,
      sanitizeInput,
      securityLoggerMiddleware,
      (req, res) => {
        res.json({ 
          success: true,
          address: req.params.address,
          body: req.body
        });
      }
    );

    const validAddress = 'GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR';
    const testData = {
      message: 'Teste de integração'
    };

    const response = await request(app)
      .post(`/test/${validAddress}`)
      .send(testData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.address).toBe(validAddress);
    expect(response.body.body.message).toBe('Teste de integração');
  });
});