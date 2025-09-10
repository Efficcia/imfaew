import { getDb } from './db';
import { UsuarioModel } from './models/usuario';

export interface NotificationRow {
  notification_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  notification_type: string;
  sent_at: string;
  context: any;
  provider: string;
  provider_message_id: string;
  provider_status: string;
}

export interface NotificationDetail extends NotificationRow {
  metadata: any;
  recent_events: any[];
}

export interface DashboardKPIs {
  totalUsers: number;
  notificationsToday: number;
  usersWithoutDeposit: number;
  totalDepositsValue: number;
  depositsToday: number;
  avgDepositValue: number;
  whatsappMessagesToday: number;
}

export interface ChartData {
  date: string;
  count: number;
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const db = getDb();
  const stats = await UsuarioModel.getStats();
  
  // Obter dados específicos para KPIs
  const queries = [
    // Usuários sem primeiro depósito
    'SELECT COUNT(*) as count FROM usuarios WHERE primeiro_deposito IS NULL OR primeiro_deposito = false',
    // Valor total baseado no campo valor_total
    'SELECT SUM(CAST(valor_total AS NUMERIC)) as total FROM usuarios WHERE valor_total IS NOT NULL AND valor_total != \'\'',
    // Usuários criados hoje
    'SELECT COUNT(*) as count FROM usuarios WHERE DATE(created_at) = CURRENT_DATE'
  ];

  const [usersWithoutDeposit, totalValue, usersToday] = await Promise.all(
    queries.map(query => db.query(query))
  );

  const totalDepositsValue = totalValue.rows[0].total ? parseFloat(totalValue.rows[0].total) : 0;

  return {
    totalUsers: stats.total,
    notificationsToday: parseInt(usersToday.rows[0].count), // Usando novos usuários como proxy
    usersWithoutDeposit: parseInt(usersWithoutDeposit.rows[0].count),
    totalDepositsValue,
    depositsToday: 0, // Campo não disponível na tabela atual
    avgDepositValue: stats.total > 0 ? totalDepositsValue / stats.total : 0,
    whatsappMessagesToday: 0 // Campo não disponível na tabela atual
  };
}

export async function getNotificationsChartData(): Promise<ChartData[]> {
  const db = getDb();
  
  // Buscar notificações dos últimos 30 dias
  const query = `
    WITH RECURSIVE dates AS (
      SELECT CURRENT_DATE - INTERVAL '29 days' as date
      UNION ALL
      SELECT date + INTERVAL '1 day'
      FROM dates
      WHERE date < CURRENT_DATE
    ),
    daily_notifications AS (
      SELECT 
        DATE(sent_at) as notification_date,
        COUNT(*) as count
      FROM (
        SELECT last_sent_24h as sent_at FROM usuarios WHERE last_sent_24h >= CURRENT_DATE - INTERVAL '29 days'
        UNION ALL
        SELECT last_sent_30d as sent_at FROM usuarios WHERE last_sent_30d >= CURRENT_DATE - INTERVAL '29 days'
        UNION ALL  
        SELECT last_sent_45d as sent_at FROM usuarios WHERE last_sent_45d >= CURRENT_DATE - INTERVAL '29 days'
      ) all_notifications
      WHERE sent_at IS NOT NULL
      GROUP BY DATE(sent_at)
    )
    SELECT 
      dates.date,
      COALESCE(daily_notifications.count, 0) as count
    FROM dates
    LEFT JOIN daily_notifications ON dates.date = daily_notifications.notification_date
    ORDER BY dates.date
  `;

  const result = await db.query(query);
  
  return result.rows.map(row => ({
    date: new Date(row.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    count: parseInt(row.count)
  }));
}

export async function getNotifications(
  page: number = 1,
  limit: number = 25,
  filters: {
    type?: string;
    from?: string;
    to?: string;
    search?: string;
  } = {}
): Promise<{ data: NotificationRow[]; total: number }> {
  const db = getDb();
  const offset = (page - 1) * limit;

  // Query para buscar usuários que realmente receberam notificações
  let baseQuery = `
    SELECT DISTINCT
      CONCAT('notif_', email, '_', 
        CASE 
          WHEN last_sent_24h IS NOT NULL THEN EXTRACT(EPOCH FROM last_sent_24h)::text
          WHEN last_sent_30d IS NOT NULL THEN EXTRACT(EPOCH FROM last_sent_30d)::text  
          WHEN last_sent_45d IS NOT NULL THEN EXTRACT(EPOCH FROM last_sent_45d)::text
          ELSE '0'
        END
      ) as notification_id,
      email as user_id,
      COALESCE(nome, 'Usuário sem nome') as name,
      email,
      COALESCE(telefone, 'Sem telefone') as phone,
      'whatsapp' as notification_type,
      CASE 
        WHEN last_sent_24h IS NOT NULL AND 
             (last_sent_30d IS NULL OR last_sent_24h > last_sent_30d) AND 
             (last_sent_45d IS NULL OR last_sent_24h > last_sent_45d) 
        THEN last_sent_24h
        WHEN last_sent_30d IS NOT NULL AND 
             (last_sent_24h IS NULL OR last_sent_30d > last_sent_24h) AND 
             (last_sent_45d IS NULL OR last_sent_30d > last_sent_45d)
        THEN last_sent_30d
        WHEN last_sent_45d IS NOT NULL AND 
             (last_sent_24h IS NULL OR last_sent_45d > last_sent_24h) AND 
             (last_sent_30d IS NULL OR last_sent_45d > last_sent_30d)
        THEN last_sent_45d
        ELSE NULL
      END as sent_at,
      CASE 
        WHEN last_sent_24h IS NOT NULL AND 
             (last_sent_30d IS NULL OR last_sent_24h > last_sent_30d) AND 
             (last_sent_45d IS NULL OR last_sent_24h > last_sent_45d) 
        THEN '24h_campaign'
        WHEN last_sent_30d IS NOT NULL AND 
             (last_sent_24h IS NULL OR last_sent_30d > last_sent_24h) AND 
             (last_sent_45d IS NULL OR last_sent_30d > last_sent_45d)
        THEN '30d_campaign'
        WHEN last_sent_45d IS NOT NULL AND 
             (last_sent_24h IS NULL OR last_sent_45d > last_sent_24h) AND 
             (last_sent_30d IS NULL OR last_sent_45d > last_sent_30d)
        THEN '45d_campaign'
        ELSE 'unknown'
      END as campaign_type
    FROM usuarios 
    WHERE (last_sent_24h IS NOT NULL OR last_sent_30d IS NOT NULL OR last_sent_45d IS NOT NULL)
  `;

  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // Filtros
  if (filters.search) {
    conditions.push(`(nome ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`);
    params.push(`%${filters.search}%`);
    paramIndex++;
  }

  if (filters.from) {
    conditions.push(`(
      (last_sent_24h IS NOT NULL AND last_sent_24h >= $${paramIndex}) OR
      (last_sent_30d IS NOT NULL AND last_sent_30d >= $${paramIndex}) OR  
      (last_sent_45d IS NOT NULL AND last_sent_45d >= $${paramIndex})
    )`);
    params.push(new Date(filters.from));
    paramIndex++;
  }

  if (filters.to) {
    conditions.push(`(
      (last_sent_24h IS NOT NULL AND last_sent_24h <= $${paramIndex}) OR
      (last_sent_30d IS NOT NULL AND last_sent_30d <= $${paramIndex}) OR
      (last_sent_45d IS NOT NULL AND last_sent_45d <= $${paramIndex})
    )`);
    params.push(new Date(filters.to));
    paramIndex++;
  }

  if (conditions.length > 0) {
    baseQuery += ` AND ${conditions.join(' AND ')}`;
  }

  // Query para contar total
  const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as notifications_count`;
  
  // Query para dados com paginação
  const dataQuery = `${baseQuery} ORDER BY sent_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const [countResult, dataResult] = await Promise.all([
    db.query(countQuery, params.slice(0, -2)),
    db.query(dataQuery, params)
  ]);

  const notifications: NotificationRow[] = dataResult.rows.map(row => ({
    notification_id: row.notification_id,
    user_id: row.user_id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    notification_type: row.notification_type,
    sent_at: row.sent_at ? row.sent_at.toISOString() : '',
    context: { 
      campaign: row.campaign_type,
      template: `template_${row.campaign_type}`
    },
    provider: 'whatsapp_api',
    provider_message_id: `msg_${row.notification_id}`,
    provider_status: 'delivered' // Assumindo que foi entregue se está registrado
  }));

  return {
    data: notifications,
    total: parseInt(countResult.rows[0].total)
  };
}

export async function getNotificationDetail(notificationId: string): Promise<NotificationDetail | null> {
  const db = getDb();
  
  // Extrair email do notification_id (formato: notif_email_timestamp)
  const emailMatch = notificationId.match(/^notif_(.+)_\d+$/);
  if (!emailMatch) {
    return null;
  }
  
  const email = emailMatch[1];
  
  // Buscar usuário específico
  const query = `
    SELECT 
      email,
      nome,
      telefone,
      nascimento,
      primeiro_deposito,
      disparo_novo,
      created_at,
      ulitmo_deposito,
      gerou_pix,
      valor_total,
      last_sent_24h,
      last_sent_30d,
      last_sent_45d,
      last_birthday_sent
    FROM usuarios 
    WHERE email = $1
    AND (last_sent_24h IS NOT NULL OR last_sent_30d IS NOT NULL OR last_sent_45d IS NOT NULL)
  `;
  
  const result = await db.query(query, [email]);
  
  if (result.rows.length === 0) {
    return null;
  }
  
  const user = result.rows[0];
  
  // Determinar qual foi o último disparo
  let lastSent = null;
  let campaignType = 'unknown';
  
  // Validar e encontrar a data mais recente válida
  const validDates = [];
  
  if (user.last_sent_24h && !isNaN(new Date(user.last_sent_24h).getTime())) {
    validDates.push({ date: user.last_sent_24h, type: '24h_campaign' });
  }
  
  if (user.last_sent_30d && !isNaN(new Date(user.last_sent_30d).getTime())) {
    validDates.push({ date: user.last_sent_30d, type: '30d_campaign' });
  }
  
  if (user.last_sent_45d && !isNaN(new Date(user.last_sent_45d).getTime())) {
    validDates.push({ date: user.last_sent_45d, type: '45d_campaign' });
  }
  
  // Pegar a data mais recente
  if (validDates.length > 0) {
    const mostRecent = validDates.reduce((latest, current) => {
      return new Date(current.date) > new Date(latest.date) ? current : latest;
    });
    
    lastSent = mostRecent.date;
    campaignType = mostRecent.type;
  }
  
  // Se não houver data válida, usar created_at ou data atual
  if (!lastSent) {
    if (user.created_at && !isNaN(new Date(user.created_at).getTime())) {
      lastSent = user.created_at;
      campaignType = 'registration';
    } else {
      lastSent = new Date();
      campaignType = 'unknown';
    }
  }
  
  // Criar eventos baseados no histórico do usuário
  const recent_events = [];
  
  if (user.gerou_pix && !isNaN(new Date(user.gerou_pix).getTime())) {
    recent_events.push({
      event_type: 'pix_generated',
      event_at: new Date(user.gerou_pix).toISOString(),
      payload: { valor: user.valor_total }
    });
  }
  
  if (user.ulitmo_deposito && !isNaN(new Date(user.ulitmo_deposito).getTime())) {
    recent_events.push({
      event_type: 'last_deposit',
      event_at: new Date(user.ulitmo_deposito).toISOString(),
      payload: { amount: user.valor_total }
    });
  }
  
  // Sempre adicionar evento de envio com data válida
  const sentDate = lastSent && !isNaN(new Date(lastSent).getTime()) 
    ? new Date(lastSent).toISOString() 
    : new Date().toISOString();
    
  recent_events.push({
    event_type: 'whatsapp_sent',
    event_at: sentDate,
    payload: { campaign: campaignType }
  });
  
  // Garantir que sent_at sempre seja uma data válida
  const validSentAt = lastSent && !isNaN(new Date(lastSent).getTime()) 
    ? new Date(lastSent).toISOString() 
    : new Date().toISOString();

  return {
    notification_id: notificationId,
    user_id: email,
    name: user.nome || 'Usuário sem nome',
    email: user.email,
    phone: user.telefone || 'Sem telefone',
    notification_type: 'whatsapp',
    sent_at: validSentAt,
    context: { 
      campaign: campaignType,
      template: `template_${campaignType}`,
      disparo_novo: user.disparo_novo,
      primeiro_deposito: user.primeiro_deposito
    },
    provider: 'whatsapp_api',
    provider_message_id: `msg_${notificationId}`,
    provider_status: 'delivered',
    metadata: { 
      created_at: user.created_at && !isNaN(new Date(user.created_at).getTime()) 
        ? new Date(user.created_at).toISOString() 
        : null,
      nascimento: user.nascimento && !isNaN(new Date(user.nascimento).getTime()) 
        ? new Date(user.nascimento).toISOString() 
        : null,
      valor_total: user.valor_total,
      last_birthday_sent: user.last_birthday_sent
    },
    recent_events: recent_events.sort((a, b) => new Date(b.event_at).getTime() - new Date(a.event_at).getTime())
  };
}

export async function getUsersWithoutDeposit(limit: number = 200): Promise<any[]> {
  const db = getDb();
  
  const query = `
    SELECT 
      email as id,
      nome as name,
      email,
      telefone as phone,
      created_at
    FROM usuarios 
    WHERE primeiro_deposito IS NULL OR primeiro_deposito = false
    ORDER BY created_at DESC
    LIMIT $1
  `;
  
  const result = await db.query(query, [limit]);
  
  return result.rows.map(row => ({
    ...row,
    created_at: row.created_at ? row.created_at.toISOString() : null
  }));
}

export async function getUserHistory(userId: string): Promise<{
  user: any;
  events: any[];
  notifications: any[];
  deposits: any[];
}> {
  // Mock user history with deposits for frontend preview
  const user = {
    id: userId,
    name: 'João Silva',
    email: 'joao.silva@email.com',
    phone: '+55 11 99999-9999',
    date_birth: '1990-05-15',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
    total_deposits: 2500.50,
    first_deposit: true,
    last_deposit_at: new Date(Date.now() - 86400000 * 5).toISOString()
  };

  const deposits = Array.from({ length: 8 }, (_, i) => ({
    id: `deposit_${i + 1}`,
    user_id: userId,
    amount: Math.floor(Math.random() * 500) + 50,
    currency: 'BRL',
    status: ['completed', 'pending', 'failed'][Math.floor(Math.random() * 3)],
    payment_method: ['pix', 'credit_card', 'bank_transfer'][i % 3],
    created_at: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    processed_at: Math.random() > 0.2 ? new Date(Date.now() - i * 86400000 * 3 + 3600000).toISOString() : null
  }));

  const events = Array.from({ length: 15 }, (_, i) => ({
    id: `event_${i + 1}`,
    user_id: userId,
    event_type: ['login', 'deposit', 'withdrawal', 'profile_update', 'game_play'][i % 5],
    event_at: new Date(Date.now() - i * 3600000).toISOString(),
    payload: { amount: Math.random() * 100, game_id: `game_${i}` }
  }));

  const notifications = Array.from({ length: 6 }, (_, i) => ({
    id: `notif_${i + 1}`,
    user_id: userId,
    notification_type: 'whatsapp',
    sent_at: new Date(Date.now() - i * 86400000 * 2).toISOString(),
    status: ['sent', 'delivered', 'failed'][i % 3]
  }));

  return { user, events, notifications, deposits };
}

export interface AutomationTrigger {
  id: string;
  name: string;
  type: 'birthday' | 'no_deposit_24h' | 'no_deposit_30d' | 'no_deposit_45d';
  active: boolean;
  whatsapp_provider: 'meta_api' | 'unofficial_api';
  message_template: string;
  last_run?: string;
  total_sent: number;
}

export async function getAutomationTriggers(): Promise<AutomationTrigger[]> {
  // Mock automation triggers for frontend preview
  return [
    {
      id: 'birthday',
      name: 'Disparos de Aniversário',
      type: 'birthday',
      active: true,
      whatsapp_provider: 'meta_api',
      message_template: '🎉 Parabéns pelo seu aniversário! Ganhe 50% de bônus no seu próximo depósito!',
      last_run: new Date(Date.now() - 86400000).toISOString(),
      total_sent: 45
    },
    {
      id: 'no_deposit_24h',
      name: '24h Sem Depósito (Novos Usuários)',
      type: 'no_deposit_24h',
      active: true,
      whatsapp_provider: 'unofficial_api',
      message_template: 'Olá! Notamos que você ainda não fez seu primeiro depósito. Que tal começar com R$ 20?',
      last_run: new Date(Date.now() - 3600000).toISOString(),
      total_sent: 128
    },
    {
      id: 'no_deposit_30d',
      name: '30 Dias Sem Depósito',
      type: 'no_deposit_30d',
      active: true,
      whatsapp_provider: 'meta_api',
      message_template: 'Sentimos sua falta! Volte e ganhe 100% de bônus no seu próximo depósito.',
      last_run: new Date(Date.now() - 86400000 * 2).toISOString(),
      total_sent: 89
    },
    {
      id: 'no_deposit_45d',
      name: '45 Dias Sem Depósito',
      type: 'no_deposit_45d',
      active: false,
      whatsapp_provider: 'unofficial_api',
      message_template: 'Oferta especial só para você! Deposite R$ 50 e ganhe R$ 150 para jogar.',
      last_run: new Date(Date.now() - 86400000 * 7).toISOString(),
      total_sent: 23
    }
  ];
}