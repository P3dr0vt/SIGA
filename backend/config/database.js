const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: 'db',
  user: 'root',
  password: 'm3l@Chuck',       // Altere para a sua senha do MySQL se necessário
  database: 'siga_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Testa a conexão ao iniciar
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Banco de dados conectado com sucesso!');
    conn.release();
  } catch (err) {
    console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    console.error('   Verifique as credenciais em backend/config/database.js');
  }
})();

module.exports = pool;