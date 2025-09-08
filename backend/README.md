# Stellar Stake House - Backend

Backend da aplicação Stellar Stake House, uma plataforma de staking para tokens KALE na rede Stellar.

## 🚀 Tecnologias

- **Node.js** - Runtime JavaScript
- **Express.js** - Framework web
- **Supabase** - Banco de dados e autenticação
- **Stellar SDK** - Integração com a rede Stellar
- **Jest** - Framework de testes
- **dotenv** - Gerenciamento de variáveis de ambiente

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase configurada
- Acesso à rede Stellar (Testnet/Mainnet)

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd stellar-stake-house/backend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
# Servidor
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=sua_url_supabase
SUPABASE_KEY=sua_chave_supabase

# Stellar Network
STELLAR_NETWORK=TESTNET
STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org

# Token KALE
KALE_ASSET_ISSUER=seu_issuer_kale

# Recompensas
REWARD_RATE=0.001

# Segurança
JWT_SECRET=seu_jwt_secret_seguro
FRONTEND_URL=http://localhost:3000

# Staking
STAKING_TOKEN_CODE=KALE
STAKING_TOKEN_ISSUER=seu_issuer_kale
STAKING_POOL_ADDRESS=endereco_pool_staking
SNAPSHOT_INTERVAL_CRON=0 0 * * *
```

## 🏃‍♂️ Executando

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

### Testes
```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Executar testes com cobertura
npm run test:coverage

# Executar testes para CI/CD
npm run test:ci
```

### Monitoramento e Manutenção
```bash
# Verificar saúde do sistema
npm run health:check

# Monitorar performance
npm run monitor:performance

# Otimizar banco de dados
npm run optimize:database

# Analisar logs de segurança
npm run security:analyze
```

## 📁 Estrutura do Projeto

```
backend/
├── config/
│   ├── logger.js          # Configuração de logging de segurança
│   └── security.js        # Configurações de segurança centralizadas
├── middleware/
│   └── validation.js      # Middlewares de validação e sanitização
├── routes/
│   ├── auth.js           # Rotas de autenticação
│   ├── history.js        # Rotas de histórico
│   ├── rewards.js        # Rotas de recompensas
│   ├── security.js       # Rotas de monitoramento de segurança
│   ├── snapshots.js      # Rotas de snapshots
│   └── staking.js        # Rotas de staking
├── scripts/
│   ├── database-optimizer.js    # Script de otimização do banco
│   └── performance-monitor.js   # Script de monitoramento
├── services/
│   └── snapshotService.js       # Serviço de snapshots
├── tests/
│   ├── middleware/              # Testes de middlewares
│   ├── routes/                  # Testes de rotas
│   └── setup.js                 # Configuração de testes
├── logs/                        # Diretório de logs
├── reports/                     # Relatórios de performance
├── .env                         # Variáveis de ambiente
├── .env.example                 # Exemplo de variáveis
├── babel.config.js              # Configuração Babel
├── jest.config.js               # Configuração Jest
├── package.json                 # Dependências e scripts
└── server.js                    # Arquivo principal
```

## 🔐 Segurança

O projeto implementa várias camadas de segurança:

- **Validação de entrada**: Todos os dados são validados e sanitizados
- **Rate limiting**: Proteção contra ataques de força bruta
- **CORS configurado**: Controle de origem das requisições
- **Helmet**: Headers de segurança HTTP
- **Logging de segurança**: Monitoramento de atividades suspeitas
- **Sanitização XSS**: Proteção contra ataques de script

## 📊 Monitoramento

### Performance
O sistema monitora automaticamente:
- Uso de CPU e memória
- Tempo de resposta da API Stellar
- Performance do banco de dados
- Alertas de performance crítica

### Segurança
Logs de segurança incluem:
- Tentativas de autenticação falhadas
- IPs suspeitos
- Violações de rate limit
- Erros de validação

## 🧪 Testes

O projeto inclui testes abrangentes:

- **Testes unitários**: Middlewares e funções utilitárias
- **Testes de integração**: Rotas e APIs
- **Testes de segurança**: Validação e sanitização
- **Cobertura de código**: Meta de 70% de cobertura

### Executando Testes Específicos

```bash
# Testar apenas middlewares
npm test -- tests/middleware

# Testar apenas rotas
npm test -- tests/routes

# Testar arquivo específico
npm test -- tests/routes/rewards.test.js
```

## 🚀 Deploy

### Variáveis de Ambiente para Produção

Certifique-se de configurar:
- `NODE_ENV=production`
- `JWT_SECRET` com valor seguro
- URLs corretas para Supabase e Stellar
- `FRONTEND_URL` com domínio de produção

### Verificações Pré-Deploy

```bash
# Executar todos os testes
npm run test:ci

# Verificar saúde do sistema
npm run health:check

# Analisar segurança
npm run security:analyze
```

## 📈 Performance

### Otimizações Implementadas

- Cache de consultas frequentes
- Paginação em endpoints de listagem
- Rate limiting para proteção
- Conexões de banco otimizadas
- Monitoramento contínuo

### Métricas Importantes

- Tempo de resposta < 2s para 95% das requisições
- Uso de memória < 512MB em condições normais
- CPU < 70% em picos de tráfego

## 🤝 Contribuição

1. Faça fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### Padrões de Código

- Use ESLint para formatação
- Escreva testes para novas funcionalidades
- Mantenha cobertura de código > 70%
- Documente APIs com comentários JSDoc

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 🆘 Suporte

Para suporte e dúvidas:

- Abra uma issue no GitHub
- Consulte a documentação da API
- Verifique os logs de erro em `logs/`

## 🔄 Changelog

### v1.0.0
- ✅ Sistema de autenticação com Stellar
- ✅ Staking de tokens KALE
- ✅ Sistema de recompensas
- ✅ Snapshots automáticos
- ✅ Monitoramento de segurança
- ✅ Testes automatizados
- ✅ Documentação completa