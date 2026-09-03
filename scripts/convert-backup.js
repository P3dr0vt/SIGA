const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const source = process.argv[2];
const destination = process.argv[3] || path.join('database', 'private', '002_import_data.sql');
if (!source) throw new Error('Uso: pnpm convert-backup -- <backup.sql> [saida.sql]');

const definitions = {
  Instrutores: { table: 'instrutores', columns: ['id_instrutor', 'nome', 'matricula'] },
  Salas: { table: 'salas', columns: ['id_sala', 'nome', 'bloco', 'tipo'] },
  Turmas: { table: 'turmas', columns: ['id_turma', 'nome', 'turno'] },
  Usuarios: { table: 'usuarios', columns: ['id_usuario', 'email', 'senha', 'nome', 'perfil', 'primeiro_acesso', 'id_instrutor_vinculado'] },
  Alocacoes: { table: 'alocacoes', columns: ['id_alocacao', 'id_instrutor', 'id_sala', 'id_turma', 'turno', 'data_inicio', 'data_fim', 'criado_por_perfil', 'criado_por_usuario'] },
  Notificacoes: { table: 'notificacoes', columns: ['id_notificacao', 'id_instrutor', 'mensagem', 'lida', 'data_criacao'] },
  Transferencias_Pendentes: { table: 'transferencias_pendentes', columns: ['id_transferencia', 'id_alocacao_original', 'id_instrutor_origem', 'id_instrutor_destino', 'data_inicio_transferencia', 'data_fim_transferencia', 'status', 'data_criacao', 'data_atualizacao'] }
};

function parseRows(payload) {
  const rows = [];
  let row = null;
  let value = '';
  let quoted = false;
  let escaped = false;

  function pushValue() {
    const trimmed = value.trim();
    row.push(quotedValue !== null ? quotedValue : trimmed === 'NULL' ? null : Number(trimmed));
    value = '';
    quotedValue = null;
  }

  let quotedValue = null;
  for (let i = 0; i < payload.length; i++) {
    const char = payload[i];
    if (quoted) {
      if (escaped) {
        const escapes = { n: '\n', r: '\r', t: '\t', '0': '\0' };
        value += escapes[char] ?? char;
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === "'") {
        quoted = false;
        quotedValue = value;
        value = '';
      } else value += char;
      continue;
    }
    if (char === "'") { quoted = true; value = ''; continue; }
    if (char === '(') { row = []; continue; }
    if (char === ',' && row) { pushValue(); continue; }
    if (char === ')' && row) { pushValue(); rows.push(row); row = null; continue; }
    if (row) value += char;
  }
  return rows;
}

function sqlValue(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${String(value).replace(/'/g, "''")}'`;
}

const dump = fs.readFileSync(source, 'utf8');
const extracted = {};
for (const [name] of Object.entries(definitions)) {
  const match = dump.match(new RegExp('INSERT INTO `' + name + '` VALUES (.*);'));
  extracted[name] = match ? parseRows(match[1]) : [];
}

// Senhas antigas nunca saem do backup. Cada conta recebe um segredo aleatorio
// desconhecido e deve ser redefinida pelo administrador antes do primeiro acesso.
for (const row of extracted.Usuarios) {
  row[2] = bcrypt.hashSync(crypto.randomBytes(32).toString('hex'), 12);
  row[5] = true;
}
for (const row of extracted.Notificacoes) row[3] = row[3] === 1;
for (const row of extracted.Notificacoes) row[4] = `${row[4]}+00`;
for (const row of extracted.Transferencias_Pendentes) {
  row[7] = `${row[7]}+00`;
  row[8] = `${row[8]}+00`;
}

const output = [
  '-- Gerado localmente a partir do backup MySQL. NAO VERSIONAR.',
  'BEGIN;',
  'SET LOCAL statement_timeout = 0;'
];

for (const [name, definition] of Object.entries(definitions)) {
  const rows = extracted[name];
  if (!rows.length) continue;
  output.push(`\nINSERT INTO ${definition.table} (${definition.columns.join(', ')}) VALUES`);
  output.push(rows.map((row) => `  (${row.map(sqlValue).join(', ')})`).join(',\n') + ';');
}

for (const definition of Object.values(definitions)) {
  const id = definition.columns[0];
  output.push(`SELECT setval(pg_get_serial_sequence('${definition.table}', '${id}'), COALESCE((SELECT MAX(${id}) FROM ${definition.table}), 1), true);`);
}
output.push('COMMIT;', '');

fs.mkdirSync(path.dirname(destination), { recursive: true });
fs.writeFileSync(destination, output.join('\n'), { encoding: 'utf8', flag: 'wx' });
console.log(`Conversao concluida: ${destination}`);
for (const [name, rows] of Object.entries(extracted)) console.log(`${name}: ${rows.length} registros`);
