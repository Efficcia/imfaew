const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const initSql = fs.readFileSync(path.join(__dirname, '..', 'migrations', 'init.sql'), 'utf8');
    await pool.query(initSql);
    console.log('✅ Migration executada com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar migration:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();