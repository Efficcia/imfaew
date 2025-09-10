const { Pool } = require('pg');
require('dotenv').config();

async function testNotifications() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    console.log('🧪 Testando sistema de notificações reais...\n');

    // 1. Verificar quantos usuários têm notificações
    const notificationStats = await client.query(`
      SELECT 
        COUNT(CASE WHEN last_sent_24h IS NOT NULL THEN 1 END) as sent_24h,
        COUNT(CASE WHEN last_sent_30d IS NOT NULL THEN 1 END) as sent_30d,
        COUNT(CASE WHEN last_sent_45d IS NOT NULL THEN 1 END) as sent_45d,
        COUNT(CASE WHEN last_sent_24h IS NOT NULL OR last_sent_30d IS NOT NULL OR last_sent_45d IS NOT NULL THEN 1 END) as total_with_notifications
      FROM usuarios
    `);

    console.log('📊 Estatísticas de Notificações:');
    console.log(`- Usuários com disparo 24h: ${notificationStats.rows[0].sent_24h}`);
    console.log(`- Usuários com disparo 30d: ${notificationStats.rows[0].sent_30d}`);
    console.log(`- Usuários com disparo 45d: ${notificationStats.rows[0].sent_45d}`);
    console.log(`- Total com notificações: ${notificationStats.rows[0].total_with_notifications}\n`);

    // 2. Mostrar exemplos de usuários com notificações
    const sampleNotifications = await client.query(`
      SELECT 
        email,
        nome,
        last_sent_24h,
        last_sent_30d,
        last_sent_45d,
        CASE 
          WHEN last_sent_24h IS NOT NULL AND 
               (last_sent_30d IS NULL OR last_sent_24h > last_sent_30d) AND 
               (last_sent_45d IS NULL OR last_sent_24h > last_sent_45d) 
          THEN 'Campanha 24h'
          WHEN last_sent_30d IS NOT NULL AND 
               (last_sent_24h IS NULL OR last_sent_30d > last_sent_24h) AND 
               (last_sent_45d IS NULL OR last_sent_30d > last_sent_45d)
          THEN 'Campanha 30d'
          WHEN last_sent_45d IS NOT NULL
          THEN 'Campanha 45d'
          ELSE 'Desconhecida'
        END as ultima_campanha
      FROM usuarios 
      WHERE (last_sent_24h IS NOT NULL OR last_sent_30d IS NOT NULL OR last_sent_45d IS NOT NULL)
      ORDER BY GREATEST(
        COALESCE(last_sent_24h, '1970-01-01'::timestamp),
        COALESCE(last_sent_30d, '1970-01-01'::timestamp),
        COALESCE(last_sent_45d, '1970-01-01'::timestamp)
      ) DESC
      LIMIT 5
    `);

    console.log('📋 Exemplos de usuários com notificações:');
    sampleNotifications.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.nome || 'Sem nome'} (${user.email})`);
      console.log(`   Última campanha: ${user.ultima_campanha}`);
      if (user.last_sent_24h) console.log(`   24h: ${user.last_sent_24h.toLocaleString('pt-BR')}`);
      if (user.last_sent_30d) console.log(`   30d: ${user.last_sent_30d.toLocaleString('pt-BR')}`);
      if (user.last_sent_45d) console.log(`   45d: ${user.last_sent_45d.toLocaleString('pt-BR')}`);
      console.log('');
    });

    // 3. Testar API de notificações
    console.log('🌐 Testando API de notificações...');
    
    try {
      // Fazer login primeiro
      const loginResponse = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: process.env.ADMIN_PASSWORD || 'admin123' })
      });

      if (loginResponse.ok) {
        // Extrair cookies de autenticação
        const cookies = loginResponse.headers.get('set-cookie') || '';
        
        // Teste de listagem com autenticação
        const response = await fetch('http://localhost:3001/api/notifications?limit=3', {
          headers: { 'Cookie': cookies }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`✅ API funcionando - ${data.total} notificações encontradas`);
          
          if (data.data.length > 0) {
            console.log('📝 Primeira notificação:');
            const first = data.data[0];
            console.log(`   ID: ${first.notification_id}`);
            console.log(`   Usuário: ${first.name} (${first.email})`);
            console.log(`   Campanha: ${first.context.campaign}`);
            console.log(`   Enviado: ${new Date(first.sent_at).toLocaleString('pt-BR')}`);
          }
        } else {
          console.log('❌ Erro na API de notificações:', response.status);
        }
      } else {
        console.log('⚠️ Erro no login:', loginResponse.status);
        console.log('   Para testar a API web, faça login em: http://localhost:3001/login');
      }
    } catch (apiError) {
      console.log('⚠️ API não disponível (servidor pode não estar rodando)');
      console.log('   Para testar, rode: npm run dev');
    }

    client.release();
    console.log('\n✅ Teste de notificações concluído!');
    console.log('\n📝 Agora as notificações mostram apenas dados REAIS da tabela usuarios');
    console.log('📝 Não há mais dados fictícios - apenas usuários que realmente receberam mensagens');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testNotifications();