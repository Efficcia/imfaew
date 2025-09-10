-- Criação das tabelas principais
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    date_birth DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_deposit_at TIMESTAMPTZ,
    total_deposits INTEGER DEFAULT 0,
    first_deposit BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    payload JSONB DEFAULT '{}'::jsonb,
    event_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ,
    raw_payload JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS notifications_sent (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    context JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS resend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    notification_id UUID REFERENCES notifications_sent(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    context JSONB DEFAULT '{}'::jsonb
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_event_at ON events(event_at);
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON deposits(user_id);
CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON deposits(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications_sent(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent_at ON notifications_sent(sent_at);
CREATE INDEX IF NOT EXISTS idx_resend_requests_notification_id ON resend_requests(notification_id);

-- Views para consultas otimizadas
CREATE OR REPLACE VIEW view_notifications AS
SELECT
  ns.id AS notification_id,
  ns.user_id,
  u.name,
  u.email,
  u.phone,
  ns.notification_type,
  ns.sent_at,
  ns.context,
  ns.context ->> 'provider' AS provider,
  ns.context ->> 'message_id' AS provider_message_id,
  ns.context ->> 'status' AS provider_status
FROM notifications_sent ns
LEFT JOIN users u ON u.id = ns.user_id;

CREATE OR REPLACE VIEW view_user_activity AS
SELECT
  u.id AS user_id,
  u.name,
  u.email,
  u.phone,
  u.created_at,
  u.date_birth,
  u.last_deposit_at,
  u.total_deposits,
  u.first_deposit,
  e_last.event_type AS last_event_type,
  e_last.event_at AS last_event_at
FROM users u
LEFT JOIN LATERAL (
  SELECT event_type, event_at
  FROM events e
  WHERE e.user_id = u.id
  ORDER BY event_at DESC
  LIMIT 1
) e_last ON true;