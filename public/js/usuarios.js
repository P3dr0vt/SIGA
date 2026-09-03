const API_BASE = '/api';

document.addEventListener('DOMContentLoaded', () => {
  const usuario = JSON.parse(localStorage.getItem('gera_usuario') || 'null');
  if (!usuario || usuario.perfil !== 'admin' || !localStorage.getItem('gera_token')) {
    window.location.href = '../login.html';
    return;
  }
  document.getElementById('formCadastro').addEventListener('submit', criarAdministrador);
  carregarAdministradores();
});

function headersAutenticados(comJson = false) {
  const headers = { Authorization: `Bearer ${localStorage.getItem('gera_token')}` };
  if (comJson) headers['Content-Type'] = 'application/json';
  return headers;
}

async function respostaJson(response) {
  const tipo = response.headers.get('content-type') || '';
  return tipo.includes('application/json') ? response.json() : {};
}

async function carregarAdministradores() {
  const mensagem = document.getElementById('mensagemLista');
  const lista = document.getElementById('listaUsuarios');
  try {
    const response = await fetch(`${API_BASE}/auth/usuarios/gerenciaveis`, {
      headers: headersAutenticados()
    });
    const data = await respostaJson(response);
    if (!response.ok) throw new Error(data.erro || 'Não foi possível carregar os usuários.');

    lista.replaceChildren();
    mensagem.style.display = data.length ? 'none' : 'block';
    mensagem.textContent = 'Nenhum administrador encontrado.';
    data.forEach((usuario) => lista.appendChild(criarCard(usuario)));
  } catch (error) {
    mensagem.style.display = 'block';
    mensagem.textContent = error.message;
  }
}

function criarCard(usuario) {
  const card = document.createElement('article');
  card.className = 'usuario-card';

  const dados = document.createElement('div');
  dados.className = 'usuario-dados';
  const nome = document.createElement('div');
  nome.className = 'usuario-nome';
  nome.textContent = usuario.nome;
  const email = document.createElement('div');
  email.className = 'usuario-email';
  email.textContent = usuario.email;
  const status = document.createElement('div');
  status.className = 'usuario-status';
  const perfil = usuario.perfil === 'tv' ? 'Exibição/TV' : 'Administrador';
  const situacao = usuario.primeiro_acesso ? 'aguardando troca da senha temporária' : 'conta ativa';
  status.textContent = `${perfil} · ${situacao}`;
  dados.append(nome, email, status);

  const redefinir = document.createElement('button');
  redefinir.type = 'button';
  redefinir.className = 'btn-secundario';
  redefinir.textContent = 'Redefinir senha';
  redefinir.addEventListener('click', () => redefinirSenha(usuario));
  card.append(dados, redefinir);
  return card;
}

function abrirCadastro() {
  document.getElementById('formCadastro').reset();
  document.getElementById('erroCadastro').style.display = 'none';
  document.getElementById('modalCadastro').style.display = 'flex';
  document.getElementById('nomeAdmin').focus();
}

function fecharCadastro() {
  document.getElementById('modalCadastro').style.display = 'none';
}

async function criarAdministrador(event) {
  event.preventDefault();
  const erro = document.getElementById('erroCadastro');
  erro.style.display = 'none';
  try {
    const response = await fetch(`${API_BASE}/auth/usuarios/administradores`, {
      method: 'POST',
      headers: headersAutenticados(true),
      body: JSON.stringify({
        nome: document.getElementById('nomeAdmin').value.trim(),
        email: document.getElementById('emailAdmin').value.trim()
      })
    });
    const data = await respostaJson(response);
    if (!response.ok) throw new Error(data.erro || 'Não foi possível criar o administrador.');
    fecharCadastro();
    exibirCredencial(data.email, data.senha_temporaria);
    await carregarAdministradores();
  } catch (error) {
    erro.textContent = error.message;
    erro.style.display = 'block';
  }
}

async function redefinirSenha(usuario) {
  if (!confirm(`Gerar uma nova senha temporária para ${usuario.nome}?`)) return;
  try {
    const response = await fetch(`${API_BASE}/auth/usuarios/${usuario.id_usuario}/resetar-senha`, {
      method: 'POST',
      headers: headersAutenticados()
    });
    const data = await respostaJson(response);
    if (!response.ok) throw new Error(data.erro || 'Não foi possível redefinir a senha.');
    exibirCredencial(usuario.email, data.senha_temporaria);
    await carregarAdministradores();
  } catch (error) {
    alert(error.message);
  }
}

function exibirCredencial(email, senha) {
  document.getElementById('credencialEmail').textContent = email;
  document.getElementById('credencialSenha').textContent = senha;
  document.getElementById('modalCredencial').style.display = 'flex';
}

function fecharCredencial() {
  document.getElementById('credencialEmail').textContent = '';
  document.getElementById('credencialSenha').textContent = '';
  document.getElementById('modalCredencial').style.display = 'none';
}
