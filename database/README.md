# Configuração do Banco de Dados Supabase

Este diretório contém os scripts e documentação necessários para configurar o banco de dados PostgreSQL no Supabase para o projeto Stellar Stake House.

## Pré-requisitos

1. Conta no [Supabase](https://supabase.com)
2. Projeto criado no Supabase
3. Acesso ao SQL Editor do Supabase

## Configuração Inicial

### 1. Criar Projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em "New Project"
3. Escolha sua organização
4. Defina um nome para o projeto (ex: `stellar-stake-house`)
5. Crie uma senha segura para o banco de dados
6. Escolha a região mais próxima
7. Clique em "Create new project"

### 2. Obter Credenciais do Projeto

Após a criação do projeto:

1. Vá para **Settings** > **API**
2. Copie as seguintes informações:
   - **Project URL** (será sua `SUPABASE_URL`)
   - **Project API Key** > **anon public** (será sua `SUPABASE_KEY`)
   - **Project API Key** > **service_role** (para operações do backend)

### 3. Configurar Variáveis de Ambiente

Atualize o arquivo `.env` no backend com as credenciais obtidas:

```env
SUPABASE_URL=https://seu-projeto.supabase.co
SUPABASE_KEY=sua_chave_anon_aqui
SUPABASE_SERVICE_KEY=sua_chave_service_role_aqui
```

### 4. Executar o Schema do Banco de Dados

1. No painel do Supabase, vá para **SQL Editor**
2. Clique em "New query"
3. Copie todo o conteúdo do arquivo `schema.sql`
4. Cole no editor SQL
5. Clique em "Run" para executar o script

### 5. Verificar a Criação das Tabelas

1. Vá para **Table Editor** no painel do Supabase
2. Verifique se as seguintes tabelas foram criadas:
   - `users`
   - `sessions`
   - `staking_delegations`
   - `snapshots`
   - `rewards`
   - `history`

## Estrutura das Tabelas

### users
Armazena informações básicas dos usuários da plataforma.
- `id`: UUID único do usuário
- `stellar_address`: Endereço público da carteira Stellar
- `created_at`: Data de criação
- `updated_at`: Data da última atualização

### sessions
Gerencia sessões de autenticação dos usuários.
- `id`: UUID único da sessão
- `user_id`: Referência ao usuário
- `created_at`: Data de criação da sessão
- `expires_at`: Data de expiração da sessão
- `is_active`: Status da sessão

### staking_delegations
Registra as delegações de staking dos usuários.
- `id`: UUID único da delegação
- `user_id`: Referência ao usuário
- `stellar_address`: Endereço da carteira
- `amount`: Quantidade delegada
- `transaction_hash`: Hash da transação Stellar
- `status`: Status da delegação (active, inactive, pending)

### snapshots
Armazena snapshots diários dos saldos de staking.
- `id`: UUID único do snapshot
- `user_id`: Referência ao usuário
- `stellar_address`: Endereço da carteira
- `balance`: Saldo no momento do snapshot
- `snapshot_date`: Data do snapshot

### rewards
Registra as recompensas calculadas para os usuários.
- `id`: UUID único da recompensa
- `user_id`: Referência ao usuário
- `snapshot_id`: Referência ao snapshot
- `amount`: Quantidade da recompensa
- `reward_date`: Data da recompensa
- `status`: Status da recompensa (pending, claimed, cancelled)
- `transaction_hash`: Hash da transação de resgate

### history
Histórico de todas as transações dos usuários.
- `id`: UUID único da transação
- `user_id`: Referência ao usuário
- `type`: Tipo da transação (delegation, reward_claim, undelegation)
- `amount`: Quantidade envolvida
- `transaction_hash`: Hash da transação Stellar
- `status`: Status da transação
- `metadata`: Dados adicionais em formato JSON

## Segurança (Row Level Security)

O schema inclui políticas de Row Level Security (RLS) que garantem:

1. **Isolamento de dados**: Usuários só podem acessar seus próprios dados
2. **Operações do backend**: O service role pode realizar todas as operações necessárias
3. **Autenticação baseada em endereço Stellar**: Utiliza o endereço da carteira como identificador

## Configuração de Autenticação

### Desabilitar Autenticação Padrão do Supabase

Como utilizamos autenticação customizada baseada em assinatura Stellar:

1. Vá para **Authentication** > **Settings**
2. Em **Site URL**, configure: `http://localhost:3000` (para desenvolvimento)
3. Desabilite **Enable email confirmations** se não for usar email
4. Configure **JWT expiry limit** conforme necessário

### Configurar CORS

1. Vá para **Settings** > **API**
2. Em **CORS origins**, adicione:
   - `http://localhost:3000` (frontend em desenvolvimento)
   - `http://localhost:3001` (backend em desenvolvimento)
   - Seus domínios de produção quando fizer deploy

## Monitoramento e Logs

### Visualizar Logs
1. Vá para **Logs** no painel do Supabase
2. Monitore queries, autenticação e erros
3. Use filtros para debugar problemas específicos

### Métricas
1. Vá para **Reports** para ver métricas de uso
2. Monitore performance das queries
3. Acompanhe crescimento dos dados

## Backup e Recuperação

### Backup Automático
O Supabase faz backup automático dos dados. Para projetos pagos, você pode:
1. Configurar backups mais frequentes
2. Fazer download de backups
3. Restaurar para pontos específicos no tempo

### Backup Manual
```sql
-- Exemplo de backup de uma tabela específica
COPY users TO '/tmp/users_backup.csv' DELIMITER ',' CSV HEADER;
```

## Troubleshooting

### Problemas Comuns

1. **Erro de conexão**: Verifique se as credenciais estão corretas no `.env`
2. **RLS bloqueando queries**: Certifique-se de que as políticas estão configuradas corretamente
3. **Timeout em queries**: Otimize queries complexas ou aumente timeout

### Logs de Debug

Para debugar problemas de RLS:
```sql
-- Verificar configurações atuais
SELECT current_setting('app.current_user_address', true);
SELECT current_setting('role');
```

## Próximos Passos

1. Execute o schema SQL no seu projeto Supabase
2. Configure as variáveis de ambiente no backend
3. Teste a conexão executando o backend
4. Verifique se as APIs estão funcionando corretamente
5. Configure o frontend para usar as APIs do backend

## Suporte

Para mais informações:
- [Documentação do Supabase](https://supabase.com/docs)
- [Guia de Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)