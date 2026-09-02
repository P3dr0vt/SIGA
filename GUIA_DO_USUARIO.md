# SIGA — Guia do Usuário (Versão 4)
## Sistema Integrado de Gestão de Alocação | SENAI Nova Lima

---

## 1. Pré-requisitos

| Software | Versão Mínima | Download |
|---|---|---|
| Node.js | 16.x ou superior | https://nodejs.org (escolha LTS) |
| MySQL | 8.0 ou superior | Incluso no MySQL Workbench |
| MySQL Workbench | 8.0 ou superior | https://dev.mysql.com/downloads/workbench/ |

> Para verificar se o Node.js está instalado, abra o CMD e digite: `node --version`

---

## 2. Configuração do Banco de Dados

1. Abra o **MySQL Workbench** e conecte-se ao servidor local (`localhost:3306`, usuário `root`)
2. Clique em **File > Open SQL Script...**
3. Navegue até a pasta `SIGA/database/` e selecione **`siga_final.sql`**
4. Pressione **Ctrl+Shift+Enter** (Execute All ⚡)
5. Aguarde a mensagem: `Banco de dados SIGA criado com sucesso!`

---

## 3. Configuração do Backend (se necessário)

Se a sua senha do MySQL for diferente de `root`, edite o arquivo:
`SIGA/backend/config/database.js` e altere o campo `password`.

---

## 4. Iniciando o Sistema

### ✅ Opção mais fácil — Windows
Dê **duplo clique** no arquivo **`INICIAR_SIGA.bat`**

O sistema abre automaticamente em: **http://localhost:3000**

### Opção manual
```
cd SIGA/backend
npm install       (apenas na primeira vez)
npm start
```

---

## 5. Credenciais

| Perfil | Login | Senha |
|---|---|---|
| Administrador | admin@senai.com | admin123 |
| Monitor TV (somente visualização) | tv@senai.com | tv123 |
| Instrutor (exemplo) | 1001 ou 1001@senai.com | 1001 (primeira vez: cria nova senha) |

> **Instrutores criados pelo admin:** o login é a matrícula gerada (ex: `2024XXXX`).
> No primeiro acesso, o sistema pedirá que criem uma nova senha.

---

## 6. Como usar o sistema

### Dashboard Principal
- A **data atual** aparece no centro do cabeçalho
- O **turno é detectado automaticamente** pelo horário
- Use o botão de turno para alternar: Manhã / Tarde / Noite / **Todos**
- **Todos** exibe todas as alocações ativas para hoje em todos os turnos
- Apenas alocações cujo **período inclui a data de hoje** são exibidas

### Criar uma Alocação
1. Vá em **Menu > Alocações** (ou clique em uma sala nas páginas de Salas/Robótica)
2. Preencha: Instrutor, Sala, Turma, Turno, Data Início e Data Fim
3. Conflitos são detectados automaticamente antes de salvar
4. Clique em **SALVAR**

### Adicionar Instrutor
1. Menu > Instrutores > Adicionar
2. Digite o nome e clique em **SALVAR**
3. O sistema gera matrícula e senha automaticamente — **anote as credenciais exibidas**

---

## 7. Solução de Problemas

**"Não conecta ao servidor"**
→ Verifique se a janela do CMD com o servidor está aberta

**"Erro ao conectar ao banco"**
→ Verifique se o MySQL está rodando e se executou o script SQL

**"npm não reconhecido"**
→ Reinstale o Node.js de https://nodejs.org

**"Porta 3000 em uso"**
→ Feche outra instância do servidor ou reinicie o computador

**Login de instrutor não funciona**
→ Use apenas a matrícula (ex: `1001`) no campo de e-mail, e a própria matrícula como senha no primeiro acesso

---

## 8. Estrutura de Pastas

```
SIGA/
├── INICIAR_SIGA.bat         ← Duplo clique para iniciar (Windows)
├── iniciar_siga.sh          ← Script Linux/Mac
├── GUIA_DO_USUARIO.md       ← Este guia
├── REGRAS_E_REQUISITOS_SIGA.md
│
├── frontend/
│   ├── login.html           ← Tela de login
│   ├── index.html           ← Dashboard principal
│   ├── css/
│   │   ├── login.css
│   │   ├── style.css        ← Dashboard
│   │   └── gestao.css       ← Páginas de gestão
│   ├── js/
│   │   ├── login.js
│   │   ├── script.js        ← Dashboard
│   │   ├── instrutores.js
│   │   ├── salas.js
│   │   ├── turmas.js
│   │   ├── alocacoes.js
│   │   └── robotica.js
│   └── pages/
│       ├── instrutores.html
│       ├── salas.html
│       ├── turmas.html
│       ├── alocacoes.html
│       └── robotica.html
│
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── config/
│   │   └── database.js
│   └── routes/
│       ├── auth.js
│       ├── instrutores.js
│       ├── salas.js
│       ├── turmas.js
│       └── alocacoes.js
│
└── database/
    └── siga_final.sql
```
