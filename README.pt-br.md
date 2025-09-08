# 🏠 Stellar Stake House

![Stellar Stake House Logo](./frontend/src/assets/logo.svg)

Uma plataforma revolucionária de staking na rede Stellar que permite aos usuários fazer stake de tokens e ganhar recompensas de forma segura e transparente.

## 🌐 Idioma / Language

- [English](./README.md) (Padrão)
- **Português (Brasil)**

## 📚 Documentação Completa

- [📋 Verificação Rápida](./VERIFICACAO-RAPIDA.md) - Verificação do status do sistema
- [🚀 Tutorial de Deploy](./TUTORIAL-DEPLOY.md) - Guia completo de deploy
- [🗄️ Guia do Supabase](./GUIA-SUPABASE.md) - Configuração do banco de dados
- [⚙️ Guia de Deploy de Contratos](./GUIA-DEPLOY-CONTRATOS.md) - Configuração de contratos inteligentes
- [📊 Análise Completa de Integração](./ANALISE-COMPLETA-INTEGRACAO.md) - Análise técnica

## 🌟 Características

- ✅ **Staking Seguro**: Sistema de staking baseado em contratos inteligentes Stellar Soroban
- ✅ **Recompensas Automáticas**: Distribuição automática de recompensas baseada em snapshots diários
- ✅ **Interface Intuitiva**: Dashboard moderno e responsivo com logo integrado
- ✅ **Múltiplas Carteiras**: Suporte para Freighter, Albedo e autenticação por passkey
- ✅ **Transparência Total**: Histórico completo de transações e recompensas
- ✅ **Marketplace de Pools**: Donos de projetos podem criar pools de recompensas personalizadas
- ✅ **Dashboard de Analytics**: Métricas detalhadas e insights de performance em tempo real
- ✅ **Contratos Inteligentes Soroban**: Execução descentralizada e segura na testnet
- ✅ **Sistema de Pools Avançado**: Criação e gerenciamento de pools com APY configurável
- ✅ **Integração Blockchain Completa**: Conectado diretamente aos contratos Stellar deployados
- ✅ **Interface Moderna**: UI responsiva construída com React e TailwindCSS
- ✅ **Segurança Avançada**: Implementação de melhores práticas de segurança
- ✅ **Suporte Multi-idioma**: Inglês (padrão) e Português (Brasil)

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Carteira Stellar (Freighter ou Albedo)

### Instalação

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/stellar-stake-house.git
cd stellar-stake-house

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas configurações

# Iniciar servidores de desenvolvimento
npm run dev
```

### Acessar a Aplicação

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3002
- **Banco de Dados**: Supabase (configurado)

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Supabase      │
│   React + Vite  │◄──►│  Node.js + API  │◄──►│   PostgreSQL    │
│   Port: 3000    │    │   Port: 3002    │    │   Cloud DB      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ Stellar Network │    │ Soroban Contract│    │   Analytics     │
│ Testnet/Mainnet │    │ Pool Management │    │   Dashboard     │
│ Freighter/Albedo│    │ CCSDD...HSXY    │    │   Real-time     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🛠️ Stack Tecnológico

### Frontend
- **React 18** - Framework de UI
- **Vite** - Ferramenta de build
- **TailwindCSS** - Estilização
- **React Router** - Navegação
- **Lucide React** - Ícones
- **i18n** - Internacionalização

### Backend
- **Node.js** - Runtime
- **Express** - Framework web
- **Supabase** - Banco de dados e autenticação
- **Stellar SDK** - Integração blockchain

### Blockchain
- **Stellar Network** - Plataforma blockchain
- **Soroban** - Contratos inteligentes
- **Freighter/Albedo** - Integração de carteiras

## 📱 Visão Geral das Funcionalidades

### Para Usuários
- Conectar carteiras Stellar (Freighter, Albedo, Passkey)
- Fazer stake de tokens em pools disponíveis
- Ganhar recompensas proporcionais
- Visualizar analytics detalhados e histórico
- Interface multi-idioma

### Para Donos de Projetos
- Criar pools de recompensas personalizadas
- Gerenciar parâmetros da pool (APY, duração, recompensas)
- Monitorar performance da pool
- Acessar analytics avançados

### Para Desenvolvedores
- API REST completa
- Integração com contratos inteligentes
- Documentação abrangente
- Suporte multi-ambiente

## 🔧 Configuração

### Variáveis de Ambiente

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3002
VITE_STELLAR_NETWORK=testnet
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima_supabase
VITE_POOL_REWARDS_CONTRACT_ID=CCSDDTQSALKJQ2SXXBS2VUSYD74QDHG22KFZRHMHTOCWDCMKO7JVHSXY
```

#### Backend (.env)
```env
PORT=3002
SUPABASE_URL=sua_url_supabase
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
STELLAR_NETWORK=testnet
POOL_REWARDS_CONTRACT_ID=CCSDDTQSALKJQ2SXXBS2VUSYD74QDHG22KFZRHMHTOCWDCMKO7JVHSXY
```

## 🧪 Testes

```bash
# Executar testes do frontend
cd frontend
npm test

# Executar testes do backend
cd backend
npm test

# Executar testes de integração
npm run test:integration
```

## 🚀 Deploy

### Frontend (Vercel/Netlify)
```bash
# Build para produção
npm run build

# Deploy no Vercel
vercel --prod

# Ou deploy no Netlify
netlify deploy --prod
```

### Backend (Railway/Heroku)
```bash
# Deploy no Railway
railway deploy

# Ou deploy no Heroku
git push heroku main
```

## 📊 Status Atual

- ✅ **Frontend**: 100% funcional com suporte multi-idioma
- ✅ **Backend**: Todas as APIs funcionando corretamente
- ✅ **Banco de Dados**: Supabase configurado e operacional
- ✅ **Contratos Inteligentes**: Deployados na testnet Stellar
- ✅ **Documentação**: Completa e atualizada
- ✅ **Internacionalização**: Suporte para inglês e português

## 🤝 Contribuindo

1. Faça um fork do repositório
2. Crie uma branch de feature (`git checkout -b feature/funcionalidade-incrivel`)
3. Commit suas mudanças (`git commit -m 'Adiciona funcionalidade incrível'`)
4. Push para a branch (`git push origin feature/funcionalidade-incrivel`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🔗 Links

- **Demo ao Vivo**: [Em Breve]
- **Documentação**: [GitHub Wiki]
- **Contrato Inteligente**: [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CCSDDTQSALKJQ2SXXBS2VUSYD74QDHG22KFZRHMHTOCWDCMKO7JVHSXY)
- **Suporte**: [GitHub Issues]

## 🙏 Agradecimentos

- Stellar Development Foundation
- Plataforma de contratos inteligentes Soroban
- Comunidades React e Vite
- Todos os contribuidores e testadores

---

**Construído com ❤️ na Rede Stellar**

*Última atualização: Janeiro 2024*