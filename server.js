const express = require('express');
const fs      = require('fs');
const path    = require('path');

const app       = express();
const PORT      = 3000;
const DADOS_PATH = path.join(__dirname, 'dados.json');

// Aceita JSON de até 2 MB e serve os arquivos estáticos da pasta raiz
app.use(express.json({ limit: '2mb' }));
app.use(express.static(__dirname));

// Endpoint chamado pelo api.js sempre que houver uma alteração
app.post('/salvar', (req, res) => {
  try {
    fs.writeFileSync(DADOS_PATH, JSON.stringify(req.body, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (e) {
    console.error('[SIGA] Erro ao salvar dados.json:', e.message);
    res.status(500).json({ ok: false, erro: e.message });
  }
});

app.listen(PORT, () => {
  console.log('');
  console.log('  ███████╗██╗ ██████╗  █████╗ ');
  console.log('  ██╔════╝██║██╔════╝ ██╔══██╗');
  console.log('  ███████╗██║██║  ███╗███████║');
  console.log('  ╚════██║██║██║   ██║██╔══██║');
  console.log('  ███████║██║╚██████╔╝██║  ██║');
  console.log('  ╚══════╝╚═╝ ╚═════╝ ╚═╝  ╚═╝');
  console.log('');
  console.log(`  Sistema rodando em http://localhost:${PORT}`);
  console.log('  Para encerrar: feche esta janela ou pressione Ctrl+C');
  console.log('');
});
