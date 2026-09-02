const mysql = require('mysql2/promise');

const required = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missing = required.filter((name) => !process.env[name]);
if (missing.length > 0) throw new Error(`Variaveis de banco ausentes: ${missing.join(', ')}`);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 50,
  enableKeepAlive: true,
  dateStrings: true
});

module.exports = pool;
