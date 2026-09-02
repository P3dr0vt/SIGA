// SIGA - Login JavaScript (Versão 4 - Corrigida)
const API_BASE = '/api';
let emailPrimeiroAcesso = '';

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  const emailInput = document.getElementById('email').value.trim();
  const senha = document.getElementById('senha').value;
  const erroMsg = document.getElementById('erroMsg');
  const btnTexto = document.getElementById('btnTexto');
  const btnLoading = document.getElementById('btnLoading');

  erroMsg.style.display = 'none';
  btnTexto.style.display = 'none';
  btnLoading.style.display = 'inline';

  // Aceita matrícula pura (ex: "1001") ou e-mail completo
  let email = emailInput;
  if (!email.includes('@')) {
    email = `${email}@senai.com`;
  }

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, senha })
    });

    const data = await response.json();

    if (response.ok) {
      if (data.primeiro_acesso) {
        // Abre modal de troca de senha
        emailPrimeiroAcesso = data.email;
        document.getElementById('modalTrocaSenha').style.display = 'flex';
      } else {
        localStorage.setItem('gera_token', data.token);
        localStorage.setItem('gera_token', data.token);
        localStorage.setItem('gera_usuario', JSON.stringify(data.usuario));
        localStorage.setItem('gera_usuario', JSON.stringify(data.usuario));
        window.location.href = 'index.html';
      }
    } else {
      erroMsg.textContent = data.erro || 'E-mail/matrícula ou senha incorretos.';
      erroMsg.style.display = 'block';
    }
  } catch (error) {
    erroMsg.textContent = 'Erro ao conectar com o servidor. Verifique se o sistema está rodando.';
    erroMsg.style.display = 'block';
  } finally {
    btnTexto.style.display = 'inline';
    btnLoading.style.display = 'none';
  }
});

async function confirmarTrocaSenha() {
  const novaSenha = document.getElementById('novaSenha').value;
  const confirmar = document.getElementById('confirmarSenha').value;
  const erroTroca = document.getElementById('erroTroca');

  erroTroca.style.display = 'none';

  if (novaSenha.length < 4) {
    erroTroca.textContent = 'A senha deve ter pelo menos 4 caracteres.';
    erroTroca.style.display = 'block';
    return;
  }

  if (novaSenha !== confirmar) {
    erroTroca.textContent = 'As senhas não coincidem.';
    erroTroca.style.display = 'block';
    return;
  }

  try {
    const resTroca = await fetch(`${API_BASE}/auth/trocar-senha`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailPrimeiroAcesso, novaSenha })
    });

    if (resTroca.ok) {
      document.getElementById('modalTrocaSenha').style.display = 'none';
      document.getElementById('erroMsg').style.display = 'none';
      // Preenche o campo de senha para facilitar o login imediato
      document.getElementById('senha').value = '';
      // Mostra mensagem de sucesso e pede para logar de novo
      const erroMsg = document.getElementById('erroMsg');
      erroMsg.textContent = 'Senha alterada! Faça login com sua nova senha.';
      erroMsg.style.color = '#155724';
      erroMsg.style.background = '#d4edda';
      erroMsg.style.border = '1px solid #c3e6cb';
      erroMsg.style.display = 'block';
    } else {
      erroTroca.textContent = 'Erro ao salvar nova senha. Tente novamente.';
      erroTroca.style.display = 'block';
    }
  } catch (err) {
    erroTroca.textContent = 'Erro de conexão. Tente novamente.';
    erroTroca.style.display = 'block';
  }
}

