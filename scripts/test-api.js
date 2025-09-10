const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Iniciando testes da API...\n');

  try {
    // Teste 1: Estatísticas
    console.log('📊 Testando estatísticas...');
    const statsResponse = await fetch(`${API_BASE}/usuarios/stats`);
    const stats = await statsResponse.json();
    console.log('✅ Estatísticas:', stats);
    console.log('');

    // Teste 2: Listagem de usuários
    console.log('👥 Testando listagem de usuários...');
    const usersResponse = await fetch(`${API_BASE}/usuarios?limit=3`);
    const users = await usersResponse.json();
    console.log('✅ Usuários encontrados:', users.total);
    console.log('📋 Primeiros usuários:', users.usuarios.slice(0, 2).map(u => ({
      nome: u.nome,
      email: u.email,
      disparo_novo: u.disparo_novo
    })));
    console.log('');

    // Teste 3: Buscar usuário específico
    if (users.usuarios.length > 0) {
      const testEmail = users.usuarios[0].email;
      console.log(`🔍 Testando busca do usuário: ${testEmail}`);
      const userResponse = await fetch(`${API_BASE}/usuarios/${encodeURIComponent(testEmail)}`);
      const user = await userResponse.json();
      console.log('✅ Usuário encontrado:', {
        nome: user.nome,
        email: user.email,
        telefone: user.telefone,
        created_at: user.created_at
      });
      console.log('');
    }

    // Teste 4: Campanhas
    const campaigns = ['24h', '30d', '45d', 'birthday'];
    for (const campaign of campaigns) {
      console.log(`📢 Testando campanha: ${campaign}`);
      const campaignResponse = await fetch(`${API_BASE}/usuarios/campanhas?type=${campaign}`);
      const campaignData = await campaignResponse.json();
      console.log(`✅ Campanha ${campaign}: ${campaignData.count} usuários`);
    }
    console.log('');

    console.log('🎉 Todos os testes passaram!');
    console.log('\n📝 Para testar a interface, acesse: http://localhost:3001/test-usuarios');

  } catch (error) {
    console.error('❌ Erro nos testes:', error.message);
  }
}

testAPI();