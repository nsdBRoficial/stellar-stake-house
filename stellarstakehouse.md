# Stellar Stake House - Levantamento de Requisitos

## 1. Introdução

Este documento detalha os requisitos funcionais e não funcionais para o desenvolvimento da plataforma Stellar Stake House, uma solução de staking líquido no ecossistema Stellar. O objetivo é fornecer uma visão clara das funcionalidades esperadas e das restrições técnicas e operacionais.

## 2. Tecnologias Chave

As seguintes tecnologias serão utilizadas no desenvolvimento do projeto:

- **Frontend**: React.js
- **Backend**: Node.js com Express.js
- **Banco de Dados**: PostgreSQL
- **Backend as a Service (BaaS)**: Supabase (para autenticação, armazenamento de dados e Realtime)
- **Blockchain**: Stellar Network
- **API Stellar**: Horizon API

## 3. Requisitos Funcionais

### 3.1 Módulo de Autenticação e Usuário

- **RF001**: O sistema deve permitir que usuários se autentiquem usando carteiras Stellar (ex: Freighter, Albedo).
- **RF002**: O sistema deve registrar o endereço público da carteira Stellar do usuário após a autenticação.
- **RF003**: O sistema deve permitir que o usuário desconecte sua carteira.
- **RF004**: O sistema deve persistir o estado de autenticação do usuário (sessão).

### 3.2 Módulo de Staking Líquido

- **RF005**: O sistema deve exibir o saldo atual de tokens KALE do usuário na carteira conectada (via Horizon API).
- **RF006**: O sistema deve permitir que o usuário delegue seus tokens KALE para o pool de staking através de uma transação de autorização (sem transferência de custódia).
- **RF007**: O sistema deve exibir o status da delegação do usuário (ativo/inativo).
- **RF008**: O sistema deve exibir o APY (Annual Percentage Yield) estimado do pool de staking.
- **RF009**: O sistema deve exibir a data/hora do próximo snapshot de saldo.

### 3.3 Módulo de Recompensas

- **RF010**: O sistema deve calcular as recompensas pendentes do usuário com base nos snapshots de saldo.
- **RF011**: O sistema deve exibir o valor das recompensas pendentes em KALE.
- **RF012**: O sistema deve exibir o valor das recompensas pendentes convertido para BRL (e/ou USD) utilizando um oráculo de preços (Reflector Oracle).
- **RF013**: O sistema deve permitir que o usuário resgate suas recompensas acumuladas para sua carteira Stellar.
- **RF014**: O sistema deve registrar todas as transações de resgate de recompensas.

### 3.4 Módulo de Histórico

- **RF015**: O sistema deve exibir um histórico detalhado de todas as delegações e resgates de recompensas do usuário.
- **RF016**: O histórico deve incluir data, tipo de transação (delegação/resgate), quantidade de tokens e status da transação.

### 3.5 Módulo de Administração (Backend)

- **RF017**: O backend deve implementar um scheduler para realizar snapshots automáticos dos saldos das carteiras delegadas em intervalos regulares (ex: a cada 24 horas).
- **RF018**: O backend deve calcular as recompensas para cada usuário com base nos snapshots e na lógica de distribuição.
- **RF019**: O backend deve gerenciar o pool de recompensas e a distribuição de tokens.
- **RF020**: O backend deve fornecer APIs para o frontend consumir dados de saldo, staking, recompensas e histórico.
- **RF021**: O backend deve interagir com a Horizon API da Stellar para verificar saldos e submeter transações.

## 4. Requisitos Não Funcionais

### 4.1 Performance

- **RNF001**: O tempo de carregamento da landing page e do dApp não deve exceder 3 segundos em conexões de banda larga.
- **RNF002**: As operações de conexão de carteira e delegação/resgate devem ser processadas em até 5 segundos.
- **RNF003**: O sistema de snapshots deve ser capaz de processar milhares de carteiras em tempo hábil (ex: menos de 1 hora para 10.000 carteiras).

### 4.2 Segurança

- **RNF004**: O sistema deve garantir que os tokens dos usuários nunca saiam de suas carteiras (custódia própria).
- **RNF005**: Todas as comunicações entre frontend, backend e serviços externos devem ser criptografadas (HTTPS/TLS).
- **RNF006**: O sistema deve implementar validação de entrada robusta para prevenir ataques de injeção e outros exploits.
- **RNF007**: As chaves privadas dos usuários nunca devem ser solicitadas ou armazenadas pelo sistema.
- **RNF008**: O sistema deve ser resistente a ataques DDoS e outras ameaças comuns da web.
- **RNF009**: O Supabase deve ser configurado com políticas de segurança (Row Level Security) adequadas para proteger os dados dos usuários.

### 4.3 Usabilidade (UX/UI)

- **RNF010**: A interface do usuário deve ser intuitiva e fácil de usar, mesmo para usuários com pouca experiência em blockchain.
- **RNF011**: O design deve ser responsivo, adaptando-se a diferentes tamanhos de tela (desktop, tablet, mobile).
- **RNF012**: O sistema deve fornecer feedback claro e em tempo real sobre o status das operações (ex: loading states, mensagens de sucesso/erro).

### 4.4 Escalabilidade

- **RNF013**: A arquitetura do backend deve ser escalável horizontalmente para suportar um número crescente de usuários e transações.
- **RNF014**: O banco de dados PostgreSQL (via Supabase) deve ser capaz de lidar com um grande volume de dados e consultas.

### 4.5 Confiabilidade

- **RNF015**: O sistema deve ter alta disponibilidade (uptime de 99.9%).
- **RNF016**: O sistema deve implementar mecanismos de tratamento de erros e logs para facilitar a depuração e manutenção.
- **RNF017**: O sistema deve ter um plano de backup e recuperação de dados.

## 5. Requisitos de Sistema

### 5.1 Frontend (React.js)

- **RS001**: Deve ser construído com React 18+.
- **RS002**: Deve utilizar Tailwind CSS para estilização.
- **RS003**: Deve ser empacotado com Vite.
- **RS004**: Deve utilizar Shadcn/ui para componentes UI.

### 5.2 Backend (Node.js/Express.js)

- **RS005**: Deve ser desenvolvido com Node.js 20+.
- **RS006**: Deve utilizar Express.js como framework web.
- **RS007**: Deve utilizar o Stellar SDK para interações com a rede Stellar.
- **RS008**: Deve integrar com o Supabase para gerenciamento de usuários, banco de dados e Realtime.

### 5.3 Banco de Dados (PostgreSQL via Supabase)

- **RS009**: Deve utilizar PostgreSQL como banco de dados relacional.
- **RS010**: Deve ser acessado e gerenciado via Supabase.
- **RS011**: Deve armazenar dados de usuários, delegações, snapshots e recompensas.

### 5.4 Integração com Stellar Network

- **RS012**: Deve se comunicar com a Horizon API da Stellar para consultas de dados e submissão de transações.
- **RS013**: Deve utilizar o Reflector Oracle para obter cotações de preços de ativos.

## 6. Requisitos de Segurança (Detalhado)

### 6.1 Autenticação e Autorização

- **RSec001**: Utilizar o módulo de autenticação do Supabase (Auth) para gerenciar usuários e sessões.
- **RSec002**: Implementar autenticação sem custódia de chaves privadas (ex: assinatura de mensagens com a carteira Stellar).
- **RSec003**: Aplicar políticas de Row Level Security (RLS) no Supabase para garantir que usuários só possam acessar seus próprios dados.

### 6.2 Proteção de Dados

- **RSec004**: Todos os dados sensíveis (ex: endereços de carteira) devem ser armazenados de forma segura no PostgreSQL via Supabase.
- **RSec005**: Utilizar criptografia em trânsito (TLS/SSL) para todas as conexões.
- **RSec006**: Implementar backups regulares do banco de dados.

### 6.3 Resiliência a Ataques

- **RSec007**: Implementar rate limiting nas APIs do backend para prevenir ataques de força bruta e DDoS.
- **RSec008**: Validar e sanitizar todas as entradas de usuário para prevenir ataques de injeção (SQL Injection, XSS).
- **RSec009**: Manter as dependências do projeto atualizadas para mitigar vulnerabilidades conhecidas.

## 7. Glossário

- **dApp**: Aplicação Descentralizada
- **APY**: Annual Percentage Yield
- **KALE**: Token de exemplo para staking
- **Horizon API**: API da rede Stellar para interagir com o blockchain
- **Supabase**: Plataforma open-source de Backend as a Service (BaaS)
- **Staking Líquido**: Modelo de staking onde o usuário mantém a custódia e liquidez de seus tokens.
- **Snapshot**: Registro do saldo de uma carteira em um determinado momento.
- **Reflector Oracle**: Serviço de oráculo de preços para o ecossistema Stellar.

## 8. Conclusão

Este levantamento de requisitos serve como base para o desenvolvimento do Stellar Stake House, garantindo que o projeto atenda às expectativas funcionais, de performance, segurança e usabilidade, utilizando as tecnologias especificadas.

