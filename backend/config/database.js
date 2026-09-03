const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;
const sslAtivo = process.env.DB_SSL !== 'false';
const validarCertificado = process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false';

function connectionStringSemParametrosSsl(valor) {
  if (!valor || !sslAtivo) return valor;
  try {
    const url = new URL(valor);
    // O node-postgres substitui o objeto `ssl` quando estes parametros estao na URL.
    // A configuracao TLS abaixo deve ser a unica fonte para que a CA nao seja ignorada.
    ['sslmode', 'sslcert', 'sslkey', 'sslrootcert'].forEach((nome) => url.searchParams.delete(nome));
    return url.toString();
  } catch {
    return valor;
  }
}

function criarConfiguracaoSsl() {
  if (!sslAtivo) return false;

  const configuracao = { rejectUnauthorized: validarCertificado };
  const caBase64 = (process.env.DB_SSL_CA_BASE64 || '').trim();
  if (!caBase64) return configuracao;

  const certificado = Buffer.from(caBase64, 'base64').toString('utf8').trim();
  if (!certificado.includes('-----BEGIN CERTIFICATE-----') ||
      !certificado.includes('-----END CERTIFICATE-----')) {
    const error = new Error('Certificado TLS configurado em formato invalido.');
    error.code = 'INVALID_SSL_CA';
    throw error;
  }
  configuracao.ca = certificado;
  return configuracao;
}

let erroConfiguracao = null;
let ssl;
try {
  ssl = criarConfiguracaoSsl();
} catch (error) {
  erroConfiguracao = error;
}

const pool = connectionString && !erroConfiguracao ? new Pool({
  connectionString: connectionStringSemParametrosSsl(connectionString),
  max: Number(process.env.DB_POOL_MAX || 5),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 8_000,
  ssl
}) : null;

function exigirPool() {
  if (erroConfiguracao) throw erroConfiguracao;
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
