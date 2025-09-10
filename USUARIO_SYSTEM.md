# Sistema de Usuários - PostgreSQL Integration

Este projeto foi configurado para trabalhar com a tabela `usuarios` do PostgreSQL fornecido.

## 🔧 Configuração

### Banco de dados
- **Host**: 31.97.92.225:5023
- **Database**: autozeca  
- **Tabela principal**: usuarios (485 registros)

### Estrutura da tabela usuarios:
```sql
email: text NOT NULL (chave única)
telefone: text NULL
nascimento: date NULL
primeiro_deposito: boolean NULL
disparo_novo: boolean NULL
created_at: timestamp without time zone NULL
ulitmo_deposito: date NULL
nome: text NULL
gerou_pix: timestamp without time zone NULL
valor_total: text NULL
last_sent_24h: timestamp with time zone NULL
last_sent_30d: timestamp with time zone NULL
last_sent_45d: timestamp with time zone NULL
last_birthday_sent: integer NULL
```

## 🚀 Como usar

### 1. APIs disponíveis

#### Usuários
- `GET /api/usuarios` - Listar usuários com filtros e paginação
- `GET /api/usuarios/[email]` - Buscar usuário específico
- `POST /api/usuarios` - Criar novo usuário
- `PUT /api/usuarios/[email]` - Atualizar usuário
- `DELETE /api/usuarios/[email]` - Deletar usuário

#### Estatísticas
- `GET /api/usuarios/stats` - Estatísticas gerais

#### Campanhas
- `GET /api/usuarios/campanhas?type=24h` - Usuários para campanha 24h
- `GET /api/usuarios/campanhas?type=30d` - Usuários para campanha 30 dias
- `GET /api/usuarios/campanhas?type=45d` - Usuários para campanha 45 dias  
- `GET /api/usuarios/campanhas?type=birthday` - Usuários aniversariantes

#### Ações em usuários
- `POST /api/usuarios/[email]/actions` - Marcar ações (envio de mensagem, PIX, etc.)

### 2. Tipos de campanha disponíveis

#### Campanha 24h (Novos usuários)
- Usuários com `disparo_novo = true`
- Que não receberam mensagem nas últimas 24h
- **Resultado atual**: 376 usuários elegíveis

#### Campanha 30 dias  
- Usuários com último depósito há mais de 30 dias
- Que não receberam mensagem de 30d recentemente

#### Campanha 45 dias
- Usuários com último depósito há mais de 45 dias  
- Que não receberam mensagem de 45d recentemente

#### Campanha Aniversário
- Usuários aniversariantes do dia
- **Resultado atual**: 1 usuário aniversariante hoje

### 3. Exemplo de uso no código

```typescript
import { UsuarioModel } from '@/lib/models/usuario';

// Buscar usuários para campanha
const usuarios24h = await UsuarioModel.getUsuariosForCampaign('24h');

// Marcar como enviado
await UsuarioModel.updateLastSent24h('usuario@email.com');

// Obter estatísticas
const stats = await UsuarioModel.getStats();
```

## 🧪 Testando o sistema

### 1. Testes automatizados
```bash
node scripts/test-api.js
```

### 2. Interface de teste
Acesse: `http://localhost:3001/test-usuarios`

A página de teste permite:
- ✅ Ver estatísticas em tempo real
- ✅ Testar campanhas 
- ✅ Marcar ações em usuários
- ✅ Visualizar lista de usuários

### 3. Verificar estrutura da tabela
```bash
node scripts/check-table.js
```

## 📊 Estatísticas atuais do banco

- **Total de usuários**: 485
- **Usuários novos**: 481  
- **Com primeiro depósito**: 1
- **Com telefone**: 485
- **Geraram PIX**: 396

### 📧 Notificações (Dados Reais)

- **Total com notificações**: 448 usuários
- **Disparos 24h**: 448 usuários
- **Disparos 30d**: 3 usuários  
- **Disparos 45d**: 2 usuários

✅ **IMPORTANTE**: O sistema de notificações foi corrigido para mostrar apenas dados **REAIS** da tabela `usuarios`. Não há mais dados fictícios - apenas usuários que realmente receberam mensagens são exibidos.

## 🔄 Próximos passos

1. **Integração com WhatsApp**: Usar as campanhas para disparar mensagens
2. **Dashboard**: Integrar com o dashboard existente
3. **Automação**: Criar jobs para executar campanhas automaticamente
4. **Logs**: Implementar sistema de logs de disparo

## 📝 Arquivos importantes

- `/lib/models/usuario.ts` - Modelo principal com todas as operações
- `/lib/types/usuario.ts` - Tipos TypeScript
- `/app/api/usuarios/` - Rotas da API REST
- `/app/test-usuarios/page.tsx` - Página de testes
- `/scripts/check-table.js` - Script para verificar estrutura do banco