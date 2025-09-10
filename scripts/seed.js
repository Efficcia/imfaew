const { Pool } = require('pg');

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🌱 Inserindo dados de exemplo...');

    // Inserir usuários
    const users = [
      { name: 'João Silva', email: 'joao@email.com', phone: '+5511999999999', date_birth: '1990-01-15' },
      { name: 'Maria Santos', email: 'maria@email.com', phone: '+5511888888888', date_birth: '1985-06-22' },
      { name: 'Pedro Costa', email: 'pedro@email.com', phone: '+5511777777777', date_birth: '1992-03-10' },
      { name: 'Ana Oliveira', email: 'ana@email.com', phone: '+5511666666666', date_birth: '1988-11-05' },
      { name: 'Carlos Ferreira', email: 'carlos@email.com', phone: '+5511555555555', date_birth: '1995-08-30' },
      { name: 'Lucia Rodrigues', email: 'lucia@email.com', phone: '+5511444444444', date_birth: '1987-12-12' },
      { name: 'Ricardo Alves', email: 'ricardo@email.com', phone: '+5511333333333', date_birth: '1991-04-18' },
      { name: 'Fernanda Lima', email: 'fernanda@email.com', phone: '+5511222222222', date_birth: '1993-07-25' },
      { name: 'Roberto Nunes', email: 'roberto@email.com', phone: '+5511111111111', date_birth: '1989-02-14' },
      { name: 'Patricia Dias', email: 'patricia@email.com', phone: '+5511000000000', date_birth: '1994-09-03' }
    ];

    const insertedUsers = [];
    for (const user of users) {
      const result = await pool.query(
        'INSERT INTO users (name, email, phone, date_birth, created_at, total_deposits, first_deposit) VALUES ($1, $2, $3, $4, NOW() - INTERVAL \'30 days\', $5, $6) RETURNING id',
        [user.name, user.email, user.phone, user.date_birth, Math.floor(Math.random() * 5), Math.random() > 0.3]
      );
      insertedUsers.push({ ...user, id: result.rows[0].id });
    }

    // Adicionar alguns depósitos para alguns usuários
    for (let i = 0; i < 6; i++) {
      const user = insertedUsers[i];
      const amount = (Math.random() * 500 + 100).toFixed(2);
      await pool.query(
        'INSERT INTO deposits (user_id, amount, status, created_at, confirmed_at) VALUES ($1, $2, $3, NOW() - INTERVAL \'15 days\', NOW() - INTERVAL \'15 days\')',
        [user.id, amount, 'confirmed']
      );
      
      // Atualizar last_deposit_at
      await pool.query(
        'UPDATE users SET last_deposit_at = NOW() - INTERVAL \'15 days\' WHERE id = $1',
        [user.id]
      );
    }

    // Inserir eventos
    const eventTypes = ['login', 'click_deposit', 'view_promotion', 'logout', 'profile_update'];
    for (const user of insertedUsers) {
      for (let i = 0; i < Math.floor(Math.random() * 8) + 2; i++) {
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        await pool.query(
          'INSERT INTO events (user_id, event_type, payload, event_at) VALUES ($1, $2, $3, NOW() - INTERVAL \'20 days\' + INTERVAL \'1 day\' * $4)',
          [user.id, eventType, JSON.stringify({ source: 'web', timestamp: Date.now() }), Math.floor(Math.random() * 20)]
        );
      }
    }

    // Inserir notificações
    const notificationTypes = ['welcome', 'deposit_reminder', 'promotion', 'birthday', 'reactivation'];
    const providers = ['whatsapp', 'email', 'sms'];
    const statuses = ['sent', 'delivered', 'failed', 'pending'];

    for (const user of insertedUsers) {
      for (let i = 0; i < Math.floor(Math.random() * 4) + 1; i++) {
        const notificationType = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
        const provider = providers[Math.floor(Math.random() * providers.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const messageId = `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await pool.query(
          'INSERT INTO notifications_sent (user_id, notification_type, sent_at, context) VALUES ($1, $2, NOW() - INTERVAL \'10 days\' + INTERVAL \'1 day\' * $3, $4)',
          [
            user.id,
            notificationType,
            Math.floor(Math.random() * 10),
            JSON.stringify({
              provider: provider,
              message_id: messageId,
              status: status,
              template: `template_${notificationType}`,
              variables: { name: user.name, amount: '100.00' }
            })
          ]
        );
      }
    }

    console.log('✅ Dados de exemplo inseridos com sucesso!');
    console.log(`- ${insertedUsers.length} usuários`);
    console.log('- Depósitos para alguns usuários');
    console.log('- Eventos de atividade');
    console.log('- Notificações enviadas');

  } catch (error) {
    console.error('❌ Erro ao inserir dados:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();