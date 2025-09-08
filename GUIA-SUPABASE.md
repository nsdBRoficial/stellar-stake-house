# 🗄️ Guia Completo: Configuração do Supabase

![Stellar Stake House Logo](./frontend/src/assets/logo.svg)

## ✅ **STATUS: SUPABASE CONFIGURADO E FUNCIONAL**

**URL**: https://psqcaaydgginbomikotq.supabase.co  
**Status**: ✅ Conectado e funcionando  
**Schema**: ✅ Aplicado com todas as tabelas  
**Service Role Key**: ✅ Configurada corretamente

## 📋 Índice
1. [Criação da Conta e Projeto](#criação-da-conta-e-projeto)
2. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
3. [Configuração de Autenticação](#configuração-de-autenticação)
4. [Configuração de Segurança (RLS)](#configuração-de-segurança-rls)
5. [Obtenção das Credenciais](#obtenção-das-credenciais)
6. [Configuração no Projeto](#configuração-no-projeto)
7. [Testes e Verificação](#testes-e-verificação)
8. [Troubleshooting](#troubleshooting)

---

## 🚀 Criação da Conta e Projeto

### Passo 1: Criar Conta no Supabase

1. **Acesse o Supabase**
   - Vá para: https://supabase.com
   - Clique em "Start your project"

2. **Criar Conta**
   - Clique em "Sign Up"
   - Use GitHub, Google ou email
   - Confirme seu email se necessário

3. **Criar Novo Projeto**
   - Clique em "New Project"
   - Escolha uma organização (ou crie uma)
   - Preencha os dados:
     ```
     Project Name: stellar-stake-house
     Database Password: [SENHA FORTE - ANOTE!] 
     Region: [Escolha mais próxima - ex: South America (São Paulo)]
     Pricing Plan: Free (para começar)
     ```
   - Clique em "Create new project"

4. **Aguardar Criação**
   - O projeto leva 1-2 minutos para ser criado
   - Você verá uma tela de loading
   - Quando pronto, será redirecionado para o dashboard

---

## 🗃️ Configuração do Banco de Dados

### Passo 2: Executar Schema SQL

1. **Acessar SQL Editor**
   - No dashboard do Supabase
   - Clique em "SQL Editor" no menu lateral
   - Clique em "New Query"

2. **Executar Script de Criação**
   - Copie todo o conteúdo do arquivo `database/schema.sql`
   - Cole no editor SQL
   - Clique em "Run" (ou Ctrl+Enter)

3. **Verificar Criação das Tabelas**
   - Vá para "Table Editor" no menu lateral
   - Você deve ver as tabelas:
     
     **Staking Original:**
     ```
     ✅ users
     ✅ sessions
     ✅ staking_delegations
     ✅ snapshots
     ✅ rewards
     ✅ history
     ```
     
     **Sistema de Pools (Novo):**
     ```
     ✅ pools
     ✅ pool_delegations
     ✅ pool_rewards
     ```

### Passo 3: Verificar Estrutura das Tabelas

#### Tabela `users`
```sql
-- Verificar estrutura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users';
```

**Colunas esperadas:**
- `id` (uuid, primary key)
- `stellar_public_key` (text, unique)
- `email` (text, nullable)
- `username` (text, nullable)
- `created_at` (timestamp)
- `updated_at` (timestamp)
- `last_login` (timestamp)
- `is_active` (boolean)

#### Tabela `staking_positions`
```sql
-- Verificar estrutura
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'staking_positions';
```

**Colunas esperadas:**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key)
- `amount` (numeric)
- `start_date` (timestamp)
- `end_date` (timestamp, nullable)
- `status` (text)
- `created_at` (timestamp)

---

## 🔐 Configuração de Autenticação

### Passo 4: Configurar Providers de Autenticação

1. **Acessar Configurações de Auth**
   - Vá para "Authentication" > "Settings"
   - Na seção "Auth Providers"

2. **Configurar Email/Password**
   - Habilite "Enable email confirmations": `false` (para desenvolvimento)
   - Habilite "Enable email change confirmations": `false`
   - Site URL: `http://localhost:5173` (desenvolvimento)
   - Redirect URLs: `http://localhost:5173/**`

3. **Configurar URLs de Redirecionamento**
   ```
   Site URL: http://localhost:5173
   
   Additional Redirect URLs:
   http://localhost:5173
   http://localhost:5173/auth/callback
   http://localhost:3000 (se usando Docker)
   http://localhost:3000/auth/callback
   ```

### Passo 5: Configurar Políticas de Senha

1. **Ir para Auth > Settings**
2. **Password Policy:**
   ```
   Minimum password length: 8
   Require uppercase: false (para facilitar desenvolvimento)
   Require lowercase: false
   Require numbers: false
   Require special characters: false
   ```

---

## 🛡️ Configuração de Segurança (RLS)

### Passo 6: Habilitar Row Level Security

1. **Acessar SQL Editor**
2. **Executar comandos RLS:**

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
```

### Passo 7: Criar Políticas de Acesso

```sql
-- Política para tabela users
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Política para staking_positions
CREATE POLICY "Users can view own staking positions" ON staking_positions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own staking positions" ON staking_positions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own staking positions" ON staking_positions
    FOR UPDATE USING (auth.uid() = user_id);

-- Política para rewards
CREATE POLICY "Users can view own rewards" ON rewards
    FOR SELECT USING (auth.uid() = user_id);

-- Política para transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política para user_settings
CREATE POLICY "Users can manage own settings" ON user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Política para snapshots (somente leitura para todos)
CREATE POLICY "Anyone can view snapshots" ON snapshots
    FOR SELECT TO authenticated USING (true);
```

### Passo 8: Verificar Políticas

```sql
-- Verificar se políticas foram criadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public';
```

---

## 🔑 Obtenção das Credenciais

### Passo 9: Coletar Informações da API

1. **Acessar Settings > API**
2. **Copiar as seguintes informações:**

```bash
# Project URL
Project URL: https://[SEU-PROJECT-ID].supabase.co

# API Keys
Anon/Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database URL (para conexões diretas)
Database URL: postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

3. **⚠️ IMPORTANTE: Segurança das Chaves**
   - **Anon Key**: Pode ser exposta no frontend
   - **Service Role Key**: NUNCA exponha no frontend, apenas no backend
   - **Database URL**: Apenas para conexões diretas do backend

---

## ⚙️ Configuração no Projeto

### Passo 10: Configurar Variáveis de Ambiente

#### Backend (.env-dev, .env-homolog, .env-prod)
```env
# Supabase Configuration
SUPABASE_URL=https://[SEU-PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres

# JWT Configuration (use o mesmo JWT Secret do Supabase)
JWT_SECRET=[COPIE-DO-SUPABASE-SETTINGS-API]
```

#### Frontend (.env)
```env
# Frontend só precisa da URL e Anon Key
VITE_SUPABASE_URL=https://[SEU-PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_API_URL=http://localhost:3001
```

### Passo 11: Verificar JWT Secret

1. **No Supabase Dashboard**
   - Vá para Settings > API
   - Procure por "JWT Settings"
   - Copie o "JWT Secret"

2. **Configurar no Backend**
   ```env
   JWT_SECRET=[COLE-O-JWT-SECRET-DO-SUPABASE]
   ```

---

## 🧪 Testes e Verificação

### Passo 12: Testar Conexão

#### Teste 1: Conexão Básica
```bash
# No terminal, dentro da pasta backend
node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
supabase.from('users').select('count').then(console.log);
"
```

#### Teste 2: Verificar Tabelas
```sql
-- No SQL Editor do Supabase
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';
```

#### Teste 3: Inserir Dados de Teste
```sql
-- Inserir usuário de teste
INSERT INTO users (stellar_public_key, username, email) 
VALUES ('GTEST123...', 'usuario_teste', 'teste@example.com');

-- Verificar inserção
SELECT * FROM users WHERE username = 'usuario_teste';
```

### Passo 13: Testar Autenticação

```javascript
// Teste no console do browser (F12)
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://[SEU-PROJECT-ID].supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
);

// Testar consulta
supabaseClient.from('users').select('*').then(console.log);
```

### Passo 14: Verificar RLS

```sql
-- Testar se RLS está funcionando
-- Este comando deve falhar se RLS estiver ativo
SELECT * FROM users;

-- Verificar status do RLS
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

---

## 🚨 Troubleshooting

### Problema 1: Erro de Conexão

**Sintomas:**
```
Error: Invalid API key
Error: Project not found
```

**Soluções:**
1. Verificar se URL está correta
2. Verificar se API key está correta
3. Verificar se projeto está ativo
4. Aguardar alguns minutos (projeto pode estar inicializando)

### Problema 2: Tabelas Não Encontradas

**Sintomas:**
```
Error: relation "users" does not exist
```

**Soluções:**
1. Executar novamente o script `database/schema.sql`
2. Verificar se está no schema correto (`public`)
3. Verificar permissões do usuário

### Problema 3: RLS Bloqueando Acesso

**Sintomas:**
```
Error: new row violates row-level security policy
```

**Soluções:**
1. Verificar se usuário está autenticado
2. Verificar políticas RLS
3. Temporariamente desabilitar RLS para teste:
   ```sql
   ALTER TABLE users DISABLE ROW LEVEL SECURITY;
   ```

### Problema 4: JWT Secret Incorreto

**Sintomas:**
```
Error: JWT verification failed
Error: Invalid token
```

**Soluções:**
1. Copiar JWT Secret correto do Supabase
2. Verificar se não há espaços extras
3. Reiniciar servidor backend após mudança

### Problema 5: CORS Error

**Sintomas:**
```
CORS policy: No 'Access-Control-Allow-Origin' header
```

**Soluções:**
1. Verificar URLs de redirecionamento no Supabase
2. Adicionar URL do frontend nas configurações
3. Verificar se está usando HTTPS em produção

---

## 📊 Monitoramento e Logs

### Visualizar Logs do Supabase

1. **Acessar Logs**
   - No dashboard: "Logs" > "API"
   - Filtrar por tipo de erro
   - Verificar requests recentes

2. **Métricas de Uso**
   - "Settings" > "Usage"
   - Verificar limites do plano gratuito
   - Monitorar requests por minuto

### Backup e Restore

```bash
# Backup do banco
pg_dump "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres" > backup.sql

# Restore (cuidado!)
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres" < backup.sql
```

---

## ✅ Checklist Final

Antes de considerar a configuração completa:

- [ ] Projeto Supabase criado e ativo
- [ ] Todas as tabelas criadas (users, staking_positions, rewards, etc.)
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas de segurança criadas
- [ ] Credenciais copiadas corretamente
- [ ] Variáveis de ambiente configuradas
- [ ] Teste de conexão funcionando
- [ ] Teste de inserção funcionando
- [ ] URLs de redirecionamento configuradas
- [ ] JWT Secret configurado
- [ ] Logs sem erros críticos

---

## 🎯 Próximos Passos

Com o Supabase configurado:

1. **Testar Aplicação**
   - Executar backend: `npm run dev`
   - Executar frontend: `npm run dev`
   - Testar autenticação

2. **Configurar Dados de Produção**
   - Criar projeto separado para produção
   - Configurar domínio personalizado
   - Configurar backup automático

3. **Otimizações**
   - Configurar índices adicionais
   - Implementar cache
   - Configurar alertas

**🎉 Parabéns! Seu Supabase está configurado e pronto para uso!**