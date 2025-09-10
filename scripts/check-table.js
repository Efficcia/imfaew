const { Pool } = require('pg');
require('dotenv').config();

async function checkUsuariosTable() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    // Conectar ao banco
    const client = await pool.connect();
    console.log('✅ Conectado ao PostgreSQL com sucesso!');

    // Verificar se a tabela usuarios existe
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'usuarios'
      );
    `);

    if (tableCheck.rows[0].exists) {
      console.log('✅ Tabela "usuarios" encontrada!');
      
      // Obter estrutura da tabela
      const columns = await client.query(`
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'usuarios' 
        ORDER BY ordinal_position;
      `);

      console.log('\n📋 Estrutura da tabela usuarios:');
      console.log('==========================================');
      columns.rows.forEach(col => {
        console.log(`${col.column_name}: ${col.data_type}${col.character_maximum_length ? `(${col.character_maximum_length})` : ''} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
      });

      // Contar registros
      const count = await client.query('SELECT COUNT(*) FROM usuarios;');
      console.log(`\n📊 Total de registros: ${count.rows[0].count}`);

      // Mostrar alguns registros de exemplo (primeiros 3)
      const sample = await client.query('SELECT * FROM usuarios LIMIT 3;');
      if (sample.rows.length > 0) {
        console.log('\n🔍 Primeiros registros:');
        console.log('==========================================');
        sample.rows.forEach((row, index) => {
          console.log(`Registro ${index + 1}:`, JSON.stringify(row, null, 2));
        });
      }
    } else {
      console.log('❌ Tabela "usuarios" não encontrada!');
      
      // Listar todas as tabelas disponíveis
      const tables = await client.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public'
        ORDER BY tablename;
      `);
      
      console.log('\n📋 Tabelas disponíveis no banco:');
      tables.rows.forEach(table => {
        console.log(`- ${table.tablename}`);
      });
    }

    client.release();
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsuariosTable();