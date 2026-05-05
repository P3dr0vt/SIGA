const SESSION_KEY = 'siga_session';

const CREDENCIAIS = {
  'admin@senai.br': 'siga2024',
  'analista@senai.br': 'senai123',
  '123@gmail.com' : '123'
};

const Auth = {
  login(email, senha) {
    const emailNorm = email.trim().toLowerCase();
    if (CREDENCIAIS[emailNorm] && CREDENCIAIS[emailNorm] === senha) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({ email: emailNorm, ts: Date.now() }));
      return true;
    }
    return false;
  },

  logout() {
    sessionStorage.removeItem(SESSION_KEY);
    window.location.href = 'index.html';
  },

  isAutenticado() {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return false;
    try {
      const { ts } = JSON.parse(raw);
      const oito_horas = 8 * 60 * 60 * 1000;
      return Date.now() - ts < oito_horas;
    } catch {
      return false;
    }
  },

  exigirAuth() {
    if (!this.isAutenticado()) {
      window.location.href = 'index.html';
    }
  }
};

export default Auth;
