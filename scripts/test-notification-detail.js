const { Pool } = require('pg');
require('dotenv').config();

async function testNotificationDetail() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const client = await pool.connect();
    console.log('🧪 Testando detalhes de notificações...\n');

    // 1. Buscar uma notificação exemplo da base de dados
    const sampleQuery = `
      SELECT 
        CONCAT('notif_', email, '_', EXTRACT(EPOCH FROM last_sent_24h)::text) as notification_id,
        email,
        nome,
        last_sent_24h,
        last_sent_30d,
        last_sent_45d,
        created_at,
        gerou_pix,
        ulitmo_deposito
      FROM usuarios 
      WHERE last_sent_24h IS NOT NULL
      LIMIT 1
    `;

    const sampleResult = await client.query(sampleQuery);
    
    if (sampleResult.rows.length === 0) {
      console.log('❌ Nenhuma notificação encontrada para testar');
      return;
    }

    const sample = sampleResult.rows[0];
    console.log('📋 Dados brutos da base:');
    console.log(`   Email: ${sample.email}`);
    console.log(`   Nome: ${sample.nome}`);
    console.log(`   Notification ID: ${sample.notification_id}`);
    console.log(`   last_sent_24h: ${sample.last_sent_24h}`);
    console.log(`   created_at: ${sample.created_at}`);
    console.log('');

    // 2. Testar validação de datas
    console.log('🔍 Testando validação de datas:');
    
    const dates = {
      'last_sent_24h': sample.last_sent_24h,
      'last_sent_30d': sample.last_sent_30d,
      'last_sent_45d': sample.last_sent_45d,
      'created_at': sample.created_at,
      'gerou_pix': sample.gerou_pix,
      'ulitmo_deposito': sample.ulitmo_deposito
    };

    Object.entries(dates).forEach(([field, date]) => {
      if (date) {
        const isValid = !isNaN(new Date(date).getTime());
        const status = isValid ? '✅' : '❌';
        console.log(`   ${status} ${field}: ${date} (válida: ${isValid})`);
      }
    });
    console.log('');

    // 3. Testar função getNotificationDetail via API
    console.log('🌐 Testando API de detalhes...');
    
    try {
      // Login
      const loginResponse = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: process.env.ADMIN_PASSWORD || 'admin123' })
      });

      if (loginResponse.ok) {
        const cookies = loginResponse.headers.get('set-cookie') || '';
        
        // Testar detalhes da notificação
        const detailResponse = await fetch(`http://localhost:3001/api/notifications/${sample.notification_id}`, {
          headers: { 'Cookie': cookies }
        });
        
        if (detailResponse.ok) {
          const detail = await detailResponse.json();
          console.log('✅ API funcionando! Detalhes recebidos:');
          console.log(`   ID: ${detail.notification_id}`);
          console.log(`   Usuário: ${detail.name}`);
          console.log(`   Email: ${detail.email}`);
          console.log(`   Telefone: ${detail.phone}`);
          console.log(`   Sent At: ${detail.sent_at}`);
          console.log(`   Campanha: ${detail.context.campaign}`);
          console.log(`   Eventos: ${detail.recent_events.length} eventos`);
          
          // Validar se sent_at é uma data válida
          const sentAtValid = detail.sent_at && !isNaN(new Date(detail.sent_at).getTime());
          console.log(`   ✅ sent_at é válida: ${sentAtValid}`);
          
          if (sentAtValid) {
            console.log(`   📅 Data formatada: ${new Date(detail.sent_at).toLocaleString('pt-BR')}`);
          }
          
          // Validar eventos
          console.log('\n   📋 Validação dos eventos:');
          detail.recent_events.forEach((event, i) => {
            const eventValid = event.event_at && !isNaN(new Date(event.event_at).getTime());
            console.log(`     ${eventValid ? '✅' : '❌'} Evento ${i + 1}: ${event.event_type} (${eventValid ? 'data válida' : 'data inválida'})`);
          });
          
        } else {
          console.log('❌ Erro na API de detalhes:', detailResponse.status);
          const errorText = await detailResponse.text();
          console.log('   Erro:', errorText);
        }
      } else {
        console.log('⚠️ Não foi possível fazer login para testar API');
      }
    } catch (apiError) {
      console.log('⚠️ API não disponível:', apiError.message);
    }

    client.release();
    console.log('\n✅ Teste concluído!');
    console.log('🎯 O modal de notificações agora deve funcionar sem erros de "Invalid time value"');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await pool.end();
  }
}

testNotificationDetail();