#!/bin/bash

# Script de Deploy para Stellar Stake House
# Uso: ./deploy.sh [dev|staging|prod]

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

# Verificar argumentos
if [ $# -eq 0 ]; then
    log_error "Ambiente não especificado. Uso: ./deploy.sh [dev|staging|prod]"
    exit 1
fi

ENVIRONMENT=$1

# Validar ambiente
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|prod)$ ]]; then
    log_error "Ambiente inválido. Use: dev, staging ou prod"
    exit 1
fi

log "Iniciando deploy para ambiente: $ENVIRONMENT"

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    log_error "Docker não está rodando. Por favor, inicie o Docker."
    exit 1
fi

log_success "Docker está rodando"

# Verificar se os arquivos de ambiente existem
BACKEND_ENV_FILE="./backend/.env-$ENVIRONMENT"
if [ ! -f "$BACKEND_ENV_FILE" ]; then
    log_error "Arquivo de ambiente não encontrado: $BACKEND_ENV_FILE"
    exit 1
fi

log_success "Arquivo de ambiente encontrado: $BACKEND_ENV_FILE"

# Parar containers existentes
log "Parando containers existentes..."
docker-compose down --remove-orphans || true

# Limpar imagens antigas (opcional)
if [ "$ENVIRONMENT" = "prod" ]; then
    log "Limpando imagens Docker antigas..."
    docker system prune -f || true
fi

# Copiar arquivo de ambiente apropriado
log "Configurando ambiente para $ENVIRONMENT..."
cp "$BACKEND_ENV_FILE" "./backend/.env"

# Build das imagens
log "Construindo imagens Docker..."
if [ "$ENVIRONMENT" = "dev" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml build
else
    docker-compose build
fi

log_success "Imagens construídas com sucesso"

# Executar testes (apenas para staging e prod)
if [ "$ENVIRONMENT" != "dev" ]; then
    log "Executando testes..."
    docker-compose run --rm backend npm test
    log_success "Testes executados com sucesso"
fi

# Iniciar containers
log "Iniciando containers..."
if [ "$ENVIRONMENT" = "dev" ]; then
    docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
else
    docker-compose up -d
fi

# Aguardar containers ficarem saudáveis
log "Aguardando containers ficarem saudáveis..."
sleep 30

# Verificar saúde dos containers
log "Verificando saúde dos containers..."
if docker-compose ps | grep -q "unhealthy\|Exit"; then
    log_error "Alguns containers não estão saudáveis:"
    docker-compose ps
    exit 1
fi

log_success "Todos os containers estão saudáveis"

# Executar health check
log "Executando health check..."
if [ "$ENVIRONMENT" = "dev" ]; then
    BACKEND_URL="http://localhost:3001"
    FRONTEND_URL="http://localhost:5173"
else
    BACKEND_URL="http://localhost:3001"
    FRONTEND_URL="http://localhost:80"
fi

# Verificar backend
if curl -f "$BACKEND_URL/health" > /dev/null 2>&1; then
    log_success "Backend está respondendo em $BACKEND_URL"
else
    log_error "Backend não está respondendo em $BACKEND_URL"
    exit 1
fi

# Verificar frontend (apenas para prod/staging)
if [ "$ENVIRONMENT" != "dev" ]; then
    if curl -f "$FRONTEND_URL/health" > /dev/null 2>&1; then
        log_success "Frontend está respondendo em $FRONTEND_URL"
    else
        log_error "Frontend não está respondendo em $FRONTEND_URL"
        exit 1
    fi
fi

# Mostrar status final
log "Status dos containers:"
docker-compose ps

log_success "Deploy concluído com sucesso para ambiente: $ENVIRONMENT"

if [ "$ENVIRONMENT" = "dev" ]; then
    log "URLs de desenvolvimento:"
    log "  Backend: http://localhost:3001"
    log "  Frontend: http://localhost:5173"
else
    log "URLs de $ENVIRONMENT:"
    log "  Frontend: http://localhost:80"
    log "  Backend API: http://localhost:3001"
    log "  Load Balancer: http://localhost:8080"
fi

log "Para visualizar logs: docker-compose logs -f"
log "Para parar: docker-compose down"