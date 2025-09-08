-- Script de Atualização: Tabelas de Pools
-- Execute este script no SQL Editor do Supabase para adicionar as tabelas de pools

-- =====================================================
-- IMPORTANTE: Execute apenas se as tabelas não existem
-- =====================================================

-- Verificar se as tabelas já existem
DO $$
BEGIN
    -- Verificar se a tabela pools existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pools') THEN
        RAISE NOTICE 'Criando tabela pools...';
        
        -- Tabela de pools de recompensas
        CREATE TABLE pools (
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
        
        RAISE NOTICE 'Tabela pools criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela pools já existe, pulando criação.';
    END IF;
    
    -- Verificar se a tabela pool_delegations existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pool_delegations') THEN
        RAISE NOTICE 'Criando tabela pool_delegations...';
        
        -- Tabela de delegações para pools
        CREATE TABLE pool_delegations (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            pool_id INTEGER REFERENCES pools(id) ON DELETE CASCADE,
            user_address TEXT NOT NULL,
            amount DECIMAL(20, 7) NOT NULL,
            timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            last_claim TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Tabela pool_delegations criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela pool_delegations já existe, pulando criação.';
    END IF;
    
    -- Verificar se a tabela pool_rewards existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'pool_rewards') THEN
        RAISE NOTICE 'Criando tabela pool_rewards...';
        
        -- Tabela de recompensas de pools
        CREATE TABLE pool_rewards (
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
        
        RAISE NOTICE 'Tabela pool_rewards criada com sucesso!';
    ELSE
        RAISE NOTICE 'Tabela pool_rewards já existe, pulando criação.';
    END IF;
END
$$;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para pools
CREATE INDEX IF NOT EXISTS idx_pools_owner_address ON pools(owner_address);
CREATE INDEX IF NOT EXISTS idx_pools_token_symbol ON pools(token_symbol);
CREATE INDEX IF NOT EXISTS idx_pools_is_active ON pools(is_active);
CREATE INDEX IF NOT EXISTS idx_pools_end_time ON pools(end_time);
CREATE INDEX IF NOT EXISTS idx_pools_created_at ON pools(created_at);

-- Índices para pool_delegations
CREATE INDEX IF NOT EXISTS idx_pool_delegations_pool_id ON pool_delegations(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_delegations_user_address ON pool_delegations(user_address);
CREATE INDEX IF NOT EXISTS idx_pool_delegations_timestamp ON pool_delegations(timestamp);

-- Índices para pool_rewards
CREATE INDEX IF NOT EXISTS idx_pool_rewards_pool_id ON pool_rewards(pool_id);
CREATE INDEX IF NOT EXISTS idx_pool_rewards_user_address ON pool_rewards(user_address);
CREATE INDEX IF NOT EXISTS idx_pool_rewards_reward_date ON pool_rewards(reward_date);
CREATE INDEX IF NOT EXISTS idx_pool_rewards_claimed ON pool_rewards(claimed);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Trigger para pools
CREATE OR REPLACE TRIGGER update_pools_updated_at 
    BEFORE UPDATE ON pools
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger para pool_delegations
CREATE OR REPLACE TRIGGER update_pool_delegations_updated_at 
    BEFORE UPDATE ON pool_delegations
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- POLÍTICAS DE SEGURANÇA (RLS)
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_delegations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_rewards ENABLE ROW LEVEL SECURITY;

-- Políticas para pools
-- Qualquer um pode ver pools ativas
CREATE POLICY "Anyone can view active pools" ON pools
    FOR SELECT USING (is_active = true);

-- Apenas o dono pode atualizar sua pool
CREATE POLICY "Pool owners can update their pools" ON pools
    FOR UPDATE USING (owner_address = current_setting('app.current_user_address', true));

-- Service role pode fazer tudo
CREATE POLICY "Service role can do everything on pools" ON pools
    FOR ALL USING (current_setting('role') = 'service_role');

-- Políticas para pool_delegations
-- Usuários podem ver suas próprias delegações
CREATE POLICY "Users can view own pool delegations" ON pool_delegations
    FOR SELECT USING (user_address = current_setting('app.current_user_address', true));

-- Usuários podem inserir suas próprias delegações
CREATE POLICY "Users can insert own pool delegations" ON pool_delegations
    FOR INSERT WITH CHECK (user_address = current_setting('app.current_user_address', true));

-- Service role pode fazer tudo
CREATE POLICY "Service role can do everything on pool_delegations" ON pool_delegations
    FOR ALL USING (current_setting('role') = 'service_role');

-- Políticas para pool_rewards
-- Usuários podem ver suas próprias recompensas
CREATE POLICY "Users can view own pool rewards" ON pool_rewards
    FOR SELECT USING (user_address = current_setting('app.current_user_address', true));

-- Usuários podem atualizar suas próprias recompensas (para marcar como claimed)
CREATE POLICY "Users can update own pool rewards" ON pool_rewards
    FOR UPDATE USING (user_address = current_setting('app.current_user_address', true));

-- Service role pode fazer tudo
CREATE POLICY "Service role can do everything on pool_rewards" ON pool_rewards
    FOR ALL USING (current_setting('role') = 'service_role');

-- =====================================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- =====================================================

COMMENT ON TABLE pools IS 'Pools de recompensas criadas por donos de projetos';
COMMENT ON TABLE pool_delegations IS 'Delegações de usuários para pools específicas';
COMMENT ON TABLE pool_rewards IS 'Recompensas distribuídas pelas pools';

COMMENT ON COLUMN pools.daily_distribution IS 'Quantidade de tokens distribuída por dia (total_rewards / distribution_days)';
COMMENT ON COLUMN pools.distributed_amount IS 'Quantidade já distribuída da pool';
COMMENT ON COLUMN pools.max_apy IS 'APY máximo oferecido pela pool';

COMMENT ON COLUMN pool_delegations.last_claim IS 'Último resgate de recompensas do usuário';
COMMENT ON COLUMN pool_rewards.claimed IS 'Se a recompensa foi resgatada pelo usuário';

-- =====================================================
-- DADOS DE EXEMPLO (OPCIONAL - APENAS PARA DESENVOLVIMENTO)
-- =====================================================

-- Descomente as linhas abaixo se quiser inserir dados de exemplo
/*
INSERT INTO pools (
    pool_name, 
    token_symbol, 
    total_rewards, 
    max_apy, 
    distribution_days, 
    daily_distribution, 
    owner_address, 
    description,
    end_time
) VALUES (
    'Pool KALE Demo',
    'KALE',
    100000.0000000,
    15.00,
    30,
    3333.3333333,
    'GCKFBEIYTKP5RDBQMUTAPDCOOMCQIDIR6A2TXPWV34LAZCKA7OJKXVYD',
    'Pool de demonstração para testes do sistema',
    NOW() + INTERVAL '30 days'
);
*/

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas foram criadas
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_name IN ('pools', 'pool_delegations', 'pool_rewards')
    AND table_schema = 'public';
    
    IF table_count = 3 THEN
        RAISE NOTICE '✅ SUCESSO: Todas as 3 tabelas de pools foram criadas!';
        RAISE NOTICE '📊 Tabelas disponíveis: pools, pool_delegations, pool_rewards';
        RAISE NOTICE '🔒 Políticas de segurança aplicadas';
        RAISE NOTICE '⚡ Índices de performance criados';
        RAISE NOTICE '🎯 Sistema de pools pronto para uso!';
    ELSE
        RAISE NOTICE '⚠️ ATENÇÃO: Apenas % de 3 tabelas foram criadas', table_count;
    END IF;
END
$$;

-- Mostrar estrutura das tabelas criadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('pools', 'pool_delegations', 'pool_rewards')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;

COMMIT;