-- Schema para autenticação Passkey/WebAuthn

-- Tabela para usuários Passkey
CREATE TABLE IF NOT EXISTS passkey_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    stellar_public_key VARCHAR(56) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Tabela para credenciais WebAuthn
CREATE TABLE IF NOT EXISTS passkey_credentials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES passkey_users(id) ON DELETE CASCADE,
    credential_id TEXT UNIQUE NOT NULL,
    public_key TEXT NOT NULL,
    counter BIGINT DEFAULT 0,
    device_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- Tabela para sessões temporárias (registro/login)
CREATE TABLE IF NOT EXISTS passkey_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_passkey_users_email ON passkey_users(email);
CREATE INDEX IF NOT EXISTS idx_passkey_users_stellar_key ON passkey_users(stellar_public_key);
CREATE INDEX IF NOT EXISTS idx_passkey_credentials_user_id ON passkey_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_passkey_credentials_credential_id ON passkey_credentials(credential_id);
CREATE INDEX IF NOT EXISTS idx_passkey_sessions_session_id ON passkey_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_passkey_sessions_expires_at ON passkey_sessions(expires_at);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_passkey_users_updated_at 
    BEFORE UPDATE ON passkey_users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Função para limpar sessões expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM passkey_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Política de segurança RLS (Row Level Security)
ALTER TABLE passkey_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE passkey_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE passkey_sessions ENABLE ROW LEVEL SECURITY;

-- Políticas para passkey_users
CREATE POLICY "Users can view their own data" ON passkey_users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update their own data" ON passkey_users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Políticas para passkey_credentials
CREATE POLICY "Users can view their own credentials" ON passkey_credentials
    FOR SELECT USING (user_id IN (
        SELECT id FROM passkey_users WHERE auth.uid()::text = id::text
    ));

CREATE POLICY "Users can manage their own credentials" ON passkey_credentials
    FOR ALL USING (user_id IN (
        SELECT id FROM passkey_users WHERE auth.uid()::text = id::text
    ));

-- Comentários para documentação
COMMENT ON TABLE passkey_users IS 'Usuários autenticados via Passkey/WebAuthn';
COMMENT ON TABLE passkey_credentials IS 'Credenciais WebAuthn dos usuários';
COMMENT ON TABLE passkey_sessions IS 'Sessões temporárias para registro/login';

COMMENT ON COLUMN passkey_users.email IS 'Email único do usuário';
COMMENT ON COLUMN passkey_users.stellar_public_key IS 'Chave pública Stellar do usuário';
COMMENT ON COLUMN passkey_credentials.credential_id IS 'ID único da credencial WebAuthn';
COMMENT ON COLUMN passkey_credentials.public_key IS 'Chave pública da credencial (base64)';
COMMENT ON COLUMN passkey_credentials.counter IS 'Contador de uso da credencial';
COMMENT ON COLUMN passkey_sessions.session_id IS 'ID único da sessão temporária';
COMMENT ON COLUMN passkey_sessions.data IS 'Dados da sessão em formato JSON';

-- Inserir dados de exemplo (apenas para desenvolvimento)
-- REMOVER EM PRODUÇÃO
INSERT INTO passkey_users (email, stellar_public_key) VALUES 
('demo@stellarstakehouse.com', 'GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX')
ON CONFLICT (email) DO NOTHING;

-- Verificar se as tabelas foram criadas corretamente
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name IN ('passkey_users', 'passkey_credentials', 'passkey_sessions')
ORDER BY table_name, ordinal_position;