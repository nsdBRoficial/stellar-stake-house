# 🚀 Tutorial de Deploy - Stellar Stake House

![Stellar Stake House Logo](./frontend/src/assets/logo.svg)

Guia completo para fazer deploy da aplicação Stellar Stake House em produção.

## ✅ **STATUS ATUAL: SISTEMA PRONTO PARA DEPLOY**

- ✅ Frontend desenvolvido e testado
- ✅ Backend com todas as APIs funcionais
- ✅ Banco de dados Supabase configurado
- ✅ Contratos Soroban deployados na testnet
- ✅ Logo integrado em todas as páginas
- ✅ Documentação completa e atualizada

# Tutorial Completo: Stellar Stake House - Deploy e Próximos Passos

## 📋 Índice
1. [Verificação do Estado Atual](#verificação-do-estado-atual)
2. [Como Executar o Projeto Localmente](#como-executar-o-projeto-localmente)
3. [Configuração de Ambientes](#configuração-de-ambientes)
4. [Deploy com Docker](#deploy-com-docker)
5. [Próximos Passos](#próximos-passos)
6. [Troubleshooting](#troubleshooting)

---

## 🔍 Verificação do Estado Atual

### ✅ O que já está implementado:

#### Frontend (React + Vite + TailwindCSS)
- ✅ Interface completa de autenticação com carteiras Stellar
- ✅ Dashboard principal com visualização de staking
- ✅ Páginas de histórico e recompensas
- ✅ Sistema de notificações
- ✅ Design responsivo e moderno
- ✅ Integração com Freighter Wallet

#### Backend (Node.js + Express)
- ✅ API REST completa
- ✅ Autenticação JWT
- ✅ Integração com Supabase
- ✅ Sistema de snapshots automáticos
- ✅ Cálculo de recompensas
- ✅ Middleware de segurança
- ✅ Sistema de logs
- ✅ Monitoramento de performance

#### Banco de Dados (Supabase/PostgreSQL)
- ✅ Schema completo implementado
- ✅ Tabelas para usuários, staking, recompensas, snapshots
- ✅ Índices otimizados
- ✅ Políticas de segurança RLS

#### DevOps e Deploy
- ✅ Dockerfiles para produção e desenvolvimento
- ✅ Docker Compose para diferentes ambientes
- ✅ Nginx configurado como load balancer
- ✅ Pipeline CI/CD com GitHub Actions
- ✅ Scripts de deploy automatizados
- ✅ Configurações de ambiente (.env)

---

## 🏃‍♂️ Como Executar o Projeto Localmente

## 📋 Pré-requisitos

- ✅ Node.js 18+ instalado
- ✅ Docker configurado (opcional)
- ✅ Conta no Vercel/Netlify (frontend)
- ✅ Conta no Railway/Heroku (backend)
- ✅ Projeto Supabase configurado e funcionando
- ✅ Contratos Stellar deployados
- ✅ Variáveis de ambiente configuradas

### Verificação dos Pré-requisitos
```bash
# Verificar se o Node.js está instalado (versão 18+)
node --version

# Verificar se o npm está instalado
npm --version

# Verificar se o Docker está instalado (opcional)
docker --version
docker-compose --version
```

### Método 1: Execução Tradicional (Desenvolvimento)

#### 1. Configurar o Backend
```bash
# Navegar para o diretório do backend
cd backend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar o arquivo .env com suas configurações
# Você precisa configurar:
# - SUPABASE_URL
# - SUPABASE_ANON_KEY
# - JWT_SECRET
# - SESSION_SECRET
```

#### 2. Configurar o Frontend
```bash
# Em outro terminal, navegar para o frontend
cd frontend

# Instalar dependências
npm install

# Copiar arquivo de ambiente
cp .env.example .env

# Editar o .env com a URL do backend
# VITE_API_URL=http://localhost:3001
```

#### 3. Executar os Serviços
```bash
# Terminal 1: Backend
cd backend
npm run dev
# Servidor rodando em: http://localhost:3001

# Terminal 2: Frontend
cd frontend
npm run dev
# Aplicação rodando em: http://localhost:5173
```

### Método 2: Execução com Docker (Recomendado)

#### 1. Configurar Ambientes
```bash
# Copiar arquivos de ambiente
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Editar os arquivos .env conforme necessário
```

#### 2. Executar com Docker Compose
```bash
# Para desenvolvimento
docker-compose -f docker-compose.dev.yml up --build

# Para produção local
docker-compose up --build
```

#### 3. Verificar se está funcionando
```bash
# Verificar containers rodando
docker ps

# Verificar logs
docker-compose logs -f

# Acessar:
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# Nginx: http://localhost (se usando produção)
```

---

## ⚙️ Configuração de Ambientes

### 🔧 Configuração do Supabase

1. **Criar conta no Supabase**
   - Acesse: https://supabase.com
   - Crie uma conta gratuita
   - Crie um novo projeto

2. **Configurar o banco de dados**
   ```sql
   -- Execute o script em database/schema.sql no SQL Editor do Supabase
   -- Isso criará todas as tabelas necessárias
   ```

3. **Obter credenciais**
   - Vá em Settings > API
   - Copie a URL do projeto - https://psqcaaydgginbomikotq.supabase.co
   - Copie a chave anon/public - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcWNhYXlkZ2dpbmJvbWlrb3RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcyODIwMzYsImV4cCI6MjA3Mjg1ODAzNn0.fsUEy9nQFViIcrj84djS30eQAFRlGHqK_bhuMY_yrY8
   - Copie a chave service_role (para o backend) - eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcWNhYXlkZ2dpbmJvbWlrb3RxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzI4MjAzNiwiZXhwIjoyMDcyODU4MDM2fQ.8124CA6-GUXzA-U2XmMkd63bbKMAuB_k6NBeHBEE53U

4. **Configurar RLS (Row Level Security)**
   ```sql
   -- Habilitar RLS nas tabelas sensíveis
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;
   ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
   
   -- Criar políticas de acesso
   -- (Políticas já estão no schema.sql)
   ```

### 🌟 Configuração da Stellar Network

1. **Para Testnet (Desenvolvimento)**
   ```env
   STELLAR_NETWORK=testnet
   STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
   ```

2. **Para Mainnet (Produção)**
   ```env
   STELLAR_NETWORK=mainnet
   STELLAR_HORIZON_URL=https://horizon.stellar.org
   ```

### 🔐 Configuração de Segurança

1. **Gerar segredos seguros**
   ```bash
   # Gerar JWT_SECRET
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   
   # Gerar SESSION_SECRET
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. **Configurar CORS**
   ```env
   # Para desenvolvimento
   CORS_ORIGIN=http://localhost:5173
   
   # Para produção
   CORS_ORIGIN=https://seudominio.com
   ```

---

## 🐳 Deploy com Docker

### Deploy Local (Teste de Produção)

```bash
# 1. Construir e executar
./deploy.sh dev

# 2. Verificar se está funcionando
curl http://localhost:3001/health
curl http://localhost:3000

# 3. Verificar logs
docker-compose logs -f
```

### Deploy em Servidor (VPS/Cloud)

#### 1. Preparar o servidor
```bash
# Instalar Docker e Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### 2. Clonar o projeto
```bash
git clone https://github.com/seu-usuario/stellar-stake-house.git
cd stellar-stake-house
```

#### 3. Configurar ambiente de produção
```bash
# Copiar e editar arquivos de ambiente
cp backend/.env.example backend/.env-prod
cp frontend/.env.example frontend/.env

# Editar com configurações de produção
nano backend/.env-prod
nano frontend/.env
```

#### 4. Executar deploy
```bash
# Dar permissão ao script
chmod +x deploy.sh

# Executar deploy de produção
./deploy.sh prod
```

#### 5. Configurar domínio e SSL
```bash
# Instalar Certbot para SSL
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seudominio.com

# Configurar renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🚀 Próximos Passos

### 1. 🔧 Configurações Essenciais

#### A. Configurar Supabase
- [ ] Criar projeto no Supabase
- [ ] Executar script `database/schema.sql`
- [ ] Configurar políticas RLS
- [ ] Obter credenciais de API

#### B. Configurar Variáveis de Ambiente
- [ ] Editar `backend/.env-prod` com credenciais reais
- [ ] Configurar `frontend/.env` com URL de produção
- [ ] Gerar segredos JWT seguros
- [ ] Configurar URLs do Stellar (testnet/mainnet)

### 2. 🌐 Deploy em Produção

#### A. Escolher Provedor de Hospedagem
**Opções Recomendadas:**
- **DigitalOcean Droplet** (VPS simples)
- **AWS EC2** (escalável)
- **Google Cloud Run** (serverless)
- **Vercel + Railway** (frontend + backend)

#### B. Configurar Domínio
- [ ] Registrar domínio
- [ ] Configurar DNS
- [ ] Configurar SSL/HTTPS
- [ ] Configurar CDN (opcional)

#### C. Executar Deploy
```bash
# No servidor de produção
git clone https://github.com/seu-usuario/stellar-stake-house.git
cd stellar-stake-house
./deploy.sh prod
```

### 3. 🔍 Monitoramento e Logs

#### A. Configurar Monitoramento
- [ ] Configurar alertas de saúde
- [ ] Monitorar uso de recursos
- [ ] Configurar backup automático
- [ ] Implementar métricas de negócio

#### B. Logs e Debugging
```bash
# Visualizar logs em tempo real
docker-compose logs -f

# Logs específicos do backend
docker-compose logs backend

# Logs específicos do frontend
docker-compose logs frontend

# Entrar no container para debug
docker-compose exec backend bash
```

### 4. 🧪 Testes em Produção

#### A. Testes Funcionais
- [ ] Testar autenticação com Freighter
- [ ] Testar operações de staking
- [ ] Testar cálculo de recompensas
- [ ] Testar histórico de transações

#### B. Testes de Performance
```bash
# Teste de carga simples
npm install -g artillery
artillery quick --count 10 --num 5 http://localhost:3001/health

# Monitorar recursos
docker stats
```

### 5. 🔐 Segurança em Produção

#### A. Checklist de Segurança
- [ ] HTTPS configurado
- [ ] Firewall configurado
- [ ] Rate limiting ativo
- [ ] Logs de segurança
- [ ] Backup de dados
- [ ] Monitoramento de intrusão

#### B. Auditoria de Segurança
```bash
# Verificar vulnerabilidades
npm audit

# Verificar configurações Docker
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  -v $PWD:/root/.docker \
  aquasec/trivy image stellar-stake-house_backend
```

### 6. 📈 Otimizações

#### A. Performance
- [ ] Configurar cache Redis
- [ ] Otimizar consultas de banco
- [ ] Implementar CDN
- [ ] Comprimir assets

#### B. Escalabilidade
- [ ] Configurar load balancer
- [ ] Implementar auto-scaling
- [ ] Configurar múltiplas instâncias
- [ ] Otimizar banco de dados

---

## 🆘 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Supabase
```bash
# Verificar configurações
echo $SUPABASE_URL
echo $SUPABASE_ANON_KEY

# Testar conexão
curl -H "apikey: $SUPABASE_ANON_KEY" $SUPABASE_URL/rest/v1/
```

#### 2. Erro de Autenticação Stellar
```bash
# Verificar se Freighter está instalado
# Verificar se está na rede correta (testnet/mainnet)
# Verificar logs do browser (F12)
```

#### 3. Containers não iniciam
```bash
# Verificar logs
docker-compose logs

# Reconstruir containers
docker-compose down
docker-compose up --build

# Limpar cache Docker
docker system prune -a
```

#### 4. Erro de CORS
```bash
# Verificar configuração CORS_ORIGIN
# Verificar se frontend está na URL correta
# Verificar headers de resposta
curl -H "Origin: http://localhost:5173" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: X-Requested-With" \
     -X OPTIONS \
     http://localhost:3001/api/auth/login
```

### Comandos Úteis

```bash
# Verificar status dos serviços
docker-compose ps

# Reiniciar serviço específico
docker-compose restart backend

# Verificar uso de recursos
docker stats

# Backup do banco de dados
pg_dump $DATABASE_URL > backup.sql

# Restaurar backup
psql $DATABASE_URL < backup.sql

# Verificar conectividade de rede
docker-compose exec backend ping frontend

# Executar testes
npm test

# Verificar qualidade do código
npm run lint
```

---

## 📞 Suporte

Se encontrar problemas:

1. **Verificar logs**: `docker-compose logs -f`
2. **Consultar documentação**: Verificar README.md de cada módulo
3. **Verificar issues**: GitHub Issues do projeto
4. **Comunidade Stellar**: https://stellar.org/developers
5. **Documentação Supabase**: https://supabase.com/docs

---

## 🎉 Conclusão

Seu projeto Stellar Stake House está completo e pronto para produção! 🚀

**Próximos passos imediatos:**
1. Configurar Supabase
2. Configurar variáveis de ambiente
3. Executar deploy local para testes
4. Deploy em produção
5. Configurar monitoramento

**Lembre-se:**
- Sempre teste em ambiente de desenvolvimento primeiro
- Use testnet antes de ir para mainnet
- Mantenha backups regulares
- Monitore logs e métricas
- Mantenha dependências atualizadas

Boa sorte com seu projeto! 🌟