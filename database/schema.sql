-- Stellar Stake House Database Schema
-- Execute este script no SQL Editor do Supabase

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stellar_address TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de sessões
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- Tabela de delegações de staking
CREATE TABLE IF NOT EXISTS staking_delegations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stellar_address TEXT NOT NULL,
    amount DECIMAL(20, 7) NOT NULL,
    transaction_hash TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de snapshots diários
CREATE TABLE IF NOT EXISTS snapshots (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    stellar_address TEXT NOT NULL,
    balance DECIMAL(20, 7) NOT NULL,
    snapshot_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, snapshot_date)
);

-- Tabela de recompensas
CREATE TABLE IF NOT EXISTS rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    snapshot_id UUID REFERENCES snapshots(id) ON DELETE CASCADE,
    amount DECIMAL(20, 7) NOT NULL,
    reward_date DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'claimed', 'cancelled')),
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de transações
CREATE TABLE IF NOT EXISTS history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('delegation', 'reward_claim', 'undelegation')),
    amount DECIMAL(20, 7) NOT NULL,
    transaction_hash TEXT NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de pools de recompensas
CREATE TABLE IF NOT EXISTS pools (
    id SERIAL PRIMARY KEY,
    pool_name TEXT NOT NULL,
    token_symbol TEXT NOT NULL CHECK (token_symbol IN ('KALE', 'XLM')),
    total_rewards DECIMAL(20, 7) NOT NULL,
    max_apy DECIMAL(5, 2) NOT NULL,
    distribution_days INTEGER NOT NULL,
    daily_distribution DECIMAL(20, 7) NOT NULL,
    distributed_amount DECIMAL(20, 7) DEFAULT 0,
    owner_address TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Tabela de delegações para pools
CREATE TABLE IF NOT EXISTS pool_delegations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pool_id INTEGER REFERENCES pools(id) ON DELETE CASCADE,
    user_address TEXT NOT NULL,
    amount DECIMAL(20, 7) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_claim TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de recompensas de pools
CREATE TABLE IF NOT EXISTS pool_rewards (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    pool_id INTEGER REFERENCES pools(id) ON DELETE CASCADE,
    user_address TEXT NOT NULL,
    amount DECIMAL(20, 7) NOT NULL,
    reward_date DATE NOT NULL,
    claimed BOOLEAN DEFAULT FALSE,
    claimed_at TIMESTAMP WITH TIME ZONE,
    transaction_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_users_stellar_address ON users(stellar_address);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_staking_delegations_user_id ON staking_delegations(user_id);
CREATE INDEX IF NOT EXISTS idx_staking_delegations_stellar_address ON staking_delegations(stellar_address);
CREATE INDEX IF NOT EXISTS idx_snapshots_user_id ON snapshots(user_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_date ON snapshots(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_rewards_user_id ON rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_status ON rewards(status);
CREATE INDEX IF NOT EXISTS idx_history_user_id ON history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_type ON history(type);
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history(created_at);

-- Índices para pools
CREATE INDEX IF NOT EXISTS idx_pools_owner_address ON pools(owner_address);
CREATE INDEX IF NOT EXISTS idx_pools_token_symbol ON pools(token_symbol);
CREATE INDEX IF NOT EXISTS idx_pools_is_active ON pools(is_active);
CREATE INDEX IF NOT EXISTS idx_pools_end_time ON pools(end_time);
CREATE INDEX IF NOT EXISTS idx_pool_delegations_pool_id ON pool_delegations(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_delegations_user_address ON pool_delegations(user_address);
CREATE INDEX IF NOT EXISTS idx_pool_rewards_pool_id ON pool_rewards(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_rewards_user_address ON pool_rewards(user_address);
CREATE INDEX IF NOT EXISTS idx_pool_rewards_reward_date ON pool_rewards(reward_date);
CREATE INDEX IF NOT EXISTS idx_pool_rewards_claimed ON pool_rewards(claimed);

-- Triggers para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staking_delegations_updated_at BEFORE UPDATE ON staking_delegations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rewards_updated_at BEFORE UPDATE ON rewards
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Políticas de Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

-- Políticas para usuários autenticados
-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (stellar_address = current_setting('app.current_user_address', true));

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (stellar_address = current_setting('app.current_user_address', true));

CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE stellar_address = current_setting('app.current_user_address', true)
    ));

CREATE POLICY "Users can view own delegations" ON staking_delegations
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE stellar_address = current_setting('app.current_user_address', true)
    ));

CREATE POLICY "Users can insert own delegations" ON staking_delegations
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE stellar_address = current_setting('app.current_user_address', true)
    ));

CREATE POLICY "Users can view own snapshots" ON snapshots
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE stellar_address = current_setting('app.current_user_address', true)
    ));

CREATE POLICY "Users can view own rewards" ON rewards
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE stellar_address = current_setting('app.current_user_address', true)
    ));

CREATE POLICY "Users can update own rewards" ON rewards
    FOR UPDATE USING (user_id IN (
        SELECT id FROM users WHERE stellar_address = current_setting('app.current_user_address', true)
    ));

CREATE POLICY "Users can view own history" ON history
    FOR SELECT USING (user_id IN (
        SELECT id FROM users WHERE stellar_address = current_setting('app.current_user_address', true)
    ));

CREATE POLICY "Users can insert own history" ON history
    FOR INSERT WITH CHECK (user_id IN (
        SELECT id FROM users WHERE stellar_address = current_setting('app.current_user_address', true)
    ));

-- Políticas para operações do sistema (backend)
-- Permitir que o backend (service role) faça todas as operações
CREATE POLICY "Service role can do everything" ON users
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can do everything on sessions" ON sessions
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can do everything on delegations" ON staking_delegations
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can do everything on snapshots" ON snapshots
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can do everything on rewards" ON rewards
    FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Service role can do everything on history" ON history
    FOR ALL USING (current_setting('role') = 'service_role');

-- Comentários nas tabelas
COMMENT ON TABLE users IS 'Tabela de usuários da plataforma';
COMMENT ON TABLE sessions IS 'Sessões de autenticação dos usuários';
COMMENT ON TABLE staking_delegations IS 'Delegações de staking dos usuários';
COMMENT ON TABLE snapshots IS 'Snapshots diários dos saldos de staking';
COMMENT ON TABLE rewards IS 'Recompensas calculadas para os usuários';
COMMENT ON TABLE history IS 'Histórico de transações dos usuários';

-- Inserir dados de exemplo para desenvolvimento (opcional)
-- INSERT INTO users (stellar_address) VALUES ('GDKIJJIKXLOM2NRMPNQZUUYK24ZPVFC7426A44QE63BVIKVFAAWY52JR');

COMMIT;