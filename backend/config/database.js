const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

const pool = connectionString ? new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_MAX || 5),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 8_000,
  ssl: process.env.DB_SSL === 'false'
    ? false
    : { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
}) : null;

function exigirPool() {
  if (!pool) {
    const error = new Error('Banco de dados nao configurado.');
    error.code = 'DATABASE_NOT_CONFIGURED';
    throw error;
  }
  return pool;
}

function postgresSql(sql) {
  let index = 0;
  return sql.replace(/\?/g, () => `$${++index}`);
}

function mysqlCompatibleResult(result) {
  if (/^\s*(SELECT|WITH)\b/i.test(result.command || '')) return [result.rows, result.fields];
  const firstRow = result.rows[0];
  const firstValue = firstRow ? Object.values(firstRow)[0] : undefined;
  return [{ affectedRows: result.rowCount, insertId: firstValue }, result.fields];
}

async function executeWith(client, sql, params = []) {
  const result = await client.query({
    text: postgresSql(sql),
    values: params
  });
  return mysqlCompatibleResult(result);
}

async function execute(sql, params = []) {
  return executeWith(exigirPool(), sql, params);
}

async function getConnection() {
  const client = await exigirPool().connect();
  return {
    execute: (sql, params = []) => executeWith(client, sql, params),
    beginTransaction: () => client.query('BEGIN'),
    commit: () => client.query('COMMIT'),
    rollback: () => client.query('ROLLBACK'),
    release: () => client.release()
  };
}

module.exports = {
  execute,
  getConnection,
  end: () => pool ? pool.end() : Promise.resolve(),
  configurado: () => Boolean(pool)
};
