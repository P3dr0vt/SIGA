const bcrypt = require('bcryptjs');
const db = require('../config/database');

async function main() {
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const senha = process.env.ADMIN_PASSWORD || '';
  const nome = (process.env.ADMIN_NAME || 'Administrador GERA').trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Defina ADMIN_EMAIL com um e-mail valido.');
  if (senha.length < 10 || !/[a-z]/.test(senha) || !/[A-Z]/.test(senha) || !/\d/.test(senha) || !/[^A-Za-z0-9]/.test(senha)) {
    throw new Error('ADMIN_PASSWORD deve ter 10+ caracteres, maiuscula, minuscula, numero e simbolo.');
  }

  const hash = await bcrypt.hash(senha, 12);
  await db.execute(
    `INSERT INTO Usuarios (email, senha, nome, perfil, primeiro_acesso)
     VALUES (?, ?, ?, 'admin', FALSE)
     ON CONFLICT (email) DO UPDATE SET senha = EXCLUDED.senha, nome = EXCLUDED.nome, perfil = 'admin',
       primeiro_acesso = FALSE, ativo = TRUE, tentativas_login = 0, bloqueado_ate = NULL,
       senha_alterada_em = NOW(), token_version = Usuarios.token_version + 1`,
    [email, hash, nome]
  );
  console.log('Conta administrativa criada ou atualizada com seguranca.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => db.end());
