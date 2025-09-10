# Disparos Web - Sistema de Notificações

Sistema interno minimalista para visualizar e reenviar notificações usando Next.js 15, TypeScript e Tailwind CSS.

## 🚀 Funcionalidades

- **Dashboard**: KPIs principais (total de usuários, notificações hoje, usuários sem depósito) + gráfico dos últimos 30 dias
- **Notificações**: Lista paginada com filtros avançados (tipo, período, busca) e exportação CSV
- **Modal de Detalhes**: Visualização completa da notificação com contexto JSON e últimos eventos do usuário
- **Reenvio de Notificações**: Sistema seguro com confirmação e registro de auditoria
- **Usuários sem Depósito**: Lista simples dos últimos 200 usuários + histórico individual
- **Autenticação**: Sistema simples com senha única e cookies HttpOnly

## 📋 Pré-requisitos

- Node.js 18+
- PostgreSQL
- npm ou yarn

## ⚙️ Configuração

### 1. Clone e Instale

```bash
git clone <seu-repo>
cd disparos_wev
npm install
```

### 2. Configure as Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
cp .env.example .env
```

Configure as variáveis em `.env`:

```env
# OBRIGATÓRIAS
DATABASE_URL=postgresql://usuario:senha@localhost:5432/disparos
ADMIN_PASSWORD=sua_senha_admin

# OPCIONAIS
RESEND_WEBHOOK_URL=https://webhook.exemplo.com/reenvio
PORT=3000
```

### 3. Execute as Migrations

```bash
npm run migrate
```

### 4. Popule com Dados de Exemplo

```bash
npm run seed
```

### 5. Inicie o Servidor

```bash
npm run dev
```

O sistema estará disponível em: http://localhost:3000

## 🔐 Como Usar

### 1. Login
- Acesse http://localhost:3000
- Use a senha configurada em `ADMIN_PASSWORD`
- Após login bem-sucedido, será redirecionado para o dashboard

### 2. Dashboard
- Visualize os KPIs principais
- Acompanhe o gráfico de notificações dos últimos 30 dias

### 3. Notificações (/notifications)
- **Filtros**: Por tipo, período (data inicial/final), busca por nome/email/telefone
- **Paginação**: 25 notificações por página
- **Exportar CSV**: Botão no topo direito exporta a query atual
- **Detalhes**: Clique em qualquer linha para abrir o modal

### 4. Modal de Detalhes
- **Informações do usuário**: Nome, email, telefone
- **Detalhes da notificação**: Tipo, provedor, status, data de envio
- **Contexto JSON**: Dados completos da notificação
- **Últimos eventos**: Últimos 5 eventos do usuário
- **Botão Reenviar**: Confirma antes de reenviar

### 5. Usuários sem Depósito (/no-deposit)
- Lista dos últimos 200 usuários sem depósito
- Link "Ver Histórico" para cada usuário
- Página de histórico mostra: dados do usuário, notificações enviadas, eventos recentes

### 6. Sistema de Reenvio
O reenvio funciona de duas formas:

**Com RESEND_WEBHOOK_URL configurada:**
- Faz POST para a URL com payload JSON
- Registra tentativa na tabela `resend_requests`

**Sem RESEND_WEBHOOK_URL:**
- Apenas registra na tabela `resend_requests` para processamento posterior
- Retorna `{ ok: true, stored: true }`

## 🗄️ Estrutura do Banco

### Tabelas Principais
- `users`: Dados dos usuários
- `events`: Eventos de atividade dos usuários  
- `deposits`: Histórico de depósitos
- `notifications_sent`: Notificações enviadas
- `resend_requests`: Auditoria de reenvios

### Views Otimizadas
- `view_notifications`: Notificações com dados dos usuários
- `view_user_activity`: Atividade dos usuários com último evento

## 📚 Scripts Disponíveis

```bash
npm run dev        # Inicia servidor de desenvolvimento
npm run build      # Build de produção
npm run start      # Inicia servidor de produção
npm run migrate    # Executa migrations
npm run seed       # Popula dados de exemplo
```

## 🔒 Segurança

- **Autenticação**: Senha única protegida por cookie HttpOnly
- **Session Management**: Cookies seguros com expiração de 7 dias
- **Proteção de Rotas**: Todas as rotas protegidas exceto `/login`
- **Pool de Conexão**: Conexões seguras ao PostgreSQL
- **Sem APIs Públicas**: Todas as operações são server-side

## 📊 Teste Rápido

1. Configure `DATABASE_URL` e `ADMIN_PASSWORD` no `.env`
2. Execute `npm run migrate && npm run seed`
3. Inicie com `npm run dev`
4. Acesse http://localhost:3000
5. Faça login com sua `ADMIN_PASSWORD`
6. Navegue para `/notifications`
7. Clique em uma notificação para ver detalhes
8. Teste o botão "Reenviar"
9. Verifique registros em `resend_requests`:

```sql
SELECT * FROM resend_requests ORDER BY requested_at DESC;
```

## 🛠️ Tecnologias

- **Framework**: Next.js 15 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS
- **Banco de Dados**: PostgreSQL
- **Gráficos**: Chart.js + React Chart.js 2
- **Datas**: date-fns
- **Autenticação**: Cookies HttpOnly nativos

## 📁 Estrutura do Projeto

```
disparos_wev/
├── app/                    # App Router do Next.js
│   ├── actions/           # Server Actions
│   ├── api/               # API Routes
│   ├── login/             # Página de login
│   ├── notifications/     # Página de notificações
│   ├── no-deposit/        # Usuários sem depósito
│   ├── user-history/      # Histórico do usuário
│   ├── layout.tsx         # Layout principal
│   └── page.tsx           # Dashboard
├── components/            # Componentes React
│   ├── Dashboard/         # Componentes do dashboard
│   ├── Notifications/     # Componentes de notificações
│   └── Header.tsx         # Header principal
├── lib/                   # Utilitários
│   ├── auth.ts           # Sistema de autenticação
│   ├── db.ts             # Conexão com banco
│   └── queries.ts        # Queries SQL
├── migrations/            # Migrations SQL
├── scripts/               # Scripts Node.js
└── README.md             # Este arquivo
```

## 🐛 Solução de Problemas

### Erro de Conexão com Banco
- Verifique se PostgreSQL está rodando
- Confirme `DATABASE_URL` no `.env`
- Teste conexão: `psql $DATABASE_URL`

### Erro de Autenticação
- Verifique `ADMIN_PASSWORD` no `.env`
- Limpe cookies do navegador
- Reinicie o servidor

### Erro ao Importar Dados
- Execute `npm run migrate` antes de `npm run seed`
- Verifique se as tabelas foram criadas
- Confirme permissões do usuário do banco

---

**Sistema desenvolvido para uso interno. Mantenha suas credenciais seguras.**