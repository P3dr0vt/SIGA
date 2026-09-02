# Alterações Realizadas - Sistema GERA v1

## Data de Implementação
19 de maio de 2026

## Resumo Executivo

O sistema foi atualizado para implementar um fluxo completo de **transferências de alocações entre instrutores com aprovação pendente**. Antes, as transferências eram imediatas e modificavam a alocação original. Agora, o fluxo é:

1. **Instrutor de Origem** solicita transferência de parte de sua alocação
2. **Sistema** cria uma solicitação pendente (alocação original permanece intacta)
3. **Instrutor de Destino** recebe notificação
4. **Instrutor de Destino** aceita ou rejeita, podendo escolher uma turma diferente
5. **Sistema** divide a alocação original e cria nova alocação para o destino

---

## Alterações no Backend

### 1. Arquivo: `backend/server.js`

**Alterações:**
- Adicionado import da rota de transferências: `const transferenciasRoutes = require('./routes/transferencias');`
- Registrada nova rota: `app.use('/api/transferencias', auth.autenticar, transferenciasRoutes);`
- Criada nova tabela `Transferencias_Pendentes` na função `garantirEstruturaBanco()` com campos:
  - `id_transferencia` (PK, auto-increment)
  - `id_alocacao_original` (FK para Alocacoes)
  - `id_instrutor_origem` (FK para Instrutores)
  - `id_instrutor_destino` (FK para Instrutores)
  - `data_inicio_transferencia` (DATE)
  - `data_fim_transferencia` (DATE)
  - `status` (ENUM: 'pendente', 'aceita', 'rejeitada')
  - `data_criacao` (TIMESTAMP)
  - `data_atualizacao` (TIMESTAMP)

### 2. Arquivo: `backend/routes/transferencias.js` (NOVO)

**Endpoints Implementados:**

#### POST /api/transferencias
- **Função**: Criar solicitação de transferência
- **Validações**:
  - Datas de transferência devem estar dentro do período da alocação original
  - Instrutor destinatário não pode ter conflitos naquele período/turno
  - Apenas o instrutor da alocação original pode solicitar transferência
- **Resultado**: Cria registro em `Transferencias_Pendentes` e notifica instrutor destino

#### GET /api/transferencias
- **Função**: Listar transferências pendentes do instrutor logado
- **Retorna**: Array com informações completas (incluindo nome instrutor origem, sala, turma, etc.)

#### GET /api/transferencias/:id
- **Função**: Obter detalhes de uma transferência específica
- **Retorna**: Objeto com todas as informações da transferência

#### PUT /api/transferencias/:id/aceitar
- **Função**: Aceitar transferência com seleção de turma
- **Parâmetro**: `id_turma_destino` (turma que o destino quer alocar)
- **Validações**:
  - Turma selecionada não pode ter conflitos naquele período/turno
  - Apenas instrutor destinatário pode aceitar
- **Transação**:
  1. Cria nova alocação para instrutor destino
  2. Divide alocação original em até 2 partes (antes e depois)
  3. Deleta alocação original
  4. Marca transferência como 'aceita'
  5. Notifica instrutor origem sobre aceite

#### PUT /api/transferencias/:id/rejeitar
- **Função**: Rejeitar transferência
- **Resultado**: 
  - Marca transferência como 'rejeitada'
  - Alocação original permanece intacta
  - Notifica instrutor origem sobre rejeição

### 3. Arquivo: `backend/routes/alocacoes.js`

**Alterações:**
- Removida funcionalidade de transferência imediata do endpoint `PUT /:id`
- Agora `PUT /:id` apenas atualiza a alocação (sem transferência)
- Mensagem de erro atualizada: "Instrutores só podem editar suas próprias alocações"
- Removida lógica de criação de notificação ao transferir

---

## Alterações no Frontend

### 1. Arquivo: `frontend/pages/alocacoes.html`

**Alterações:**
- Adicionada nova modal: `modalAceitarTransferencia`
- Modal exibe:
  - Informações da transferência (instrutor origem, sala, turno, período)
  - Seletor de turma para o instrutor destino
  - Mensagem de conflito (se houver)
  - Botões: CANCELAR, REJEITAR, ACEITAR

### 2. Arquivo: `frontend/js/alocacoes.js`

**Alterações Principais:**
- Adicionada variável: `let transferenciaPendente = null;`
- Atualizada função `salvarAlocacao()`:
  - Agora faz POST para `/api/transferencias` em vez de PUT para `/api/alocacoes`
  - Envia: `id_alocacao`, `id_instrutor_destino`, `data_inicio_transferencia`, `data_fim_transferencia`
- Adicionada função `abrirModalAceitarTransferencia(transferencia)`:
  - Preenche informações da transferência
  - Prepara seletor de turma
- Adicionada função `aceitarTransferencia()`:
  - Valida turma selecionada
  - Faz PUT para `/api/transferencias/:id/aceitar`
  - Recarrega dados após sucesso
- Adicionada função `rejeitarTransferencia()`:
  - Faz PUT para `/api/transferencias/:id/rejeitar`
  - Recarrega dados após sucesso
- Adicionada função `validarConflitTransferencia()`:
  - Valida se turma selecionada tem conflitos
  - Desabilita botão ACEITAR se houver conflito
- Adicionada função `fecharModalTransferencia()`:
  - Fecha modal de aceitar/rejeitar

### 3. Arquivo: `frontend/js/script.js`

**Alterações na função `carregarNotificacoes()`:**
- Agora faz dois fetches em paralelo:
  1. `GET /api/notificacoes` (notificações regulares)
  2. `GET /api/transferencias` (transferências pendentes)
- Renderiza ambas na lista de notificações
- Transferências aparecem com estilo diferente (fundo azul, borda azul)
- Clique em transferência chama `abrirTransferenciaDoModal()`

**Nova função `abrirTransferenciaDoModal(id_transferencia)`:**
- Busca detalhes da transferência
- Navega para página de alocações se necessário
- Abre modal de aceitar/rejeitar com dados da transferência

---

## Fluxo de Dados Completo

### Cenário: Igor transfere alocação para Fagner

```
1. Igor (instrutor origem) está em /pages/alocacoes.html
   ↓
2. Clica em alocação para transferir
   ↓
3. Modal de transferência abre
   ↓
4. Seleciona: Fagner, datas 25/05 a 27/05
   ↓
5. Clica TRANSFERIR
   ↓
6. POST /api/transferencias
   - Valida datas (dentro do período original)
   - Valida conflitos (Fagner não tem alocação naquele turno)
   - Cria registro em Transferencias_Pendentes (status='pendente')
   - Cria notificação para Fagner
   ↓
7. Fagner faz login
   ↓
8. Dashboard carrega notificações
   - GET /api/notificacoes
   - GET /api/transferencias
   ↓
9. Fagner vê notificação de transferência (destacada em azul)
   ↓
10. Clica na notificação
    ↓
11. Navega para /pages/alocacoes.html
    ↓
12. Modal de aceitar/rejeitar abre com dados da transferência
    ↓
13. Fagner seleciona turma (ex: Design)
    ↓
14. Clica ACEITAR
    ↓
15. PUT /api/transferencias/:id/aceitar
    - Valida turma (sem conflitos)
    - Inicia transação:
      * Cria alocação para Fagner (25/05-27/05, Design)
      * Cria alocação para Igor (22/05-24/05, Design) - ANTES
      * Cria alocação para Igor (28/05-29/05, Design) - DEPOIS
      * Deleta alocação original
      * Marca transferência como 'aceita'
      * Cria notificação para Igor (aceite)
    ↓
16. Resultado final:
    - 3 alocações no sistema
    - Igor recebe notificação de aceite
    - Transferência concluída
```

---

## Validações Implementadas

### 1. Validação de Datas
- Datas de transferência devem estar dentro do período da alocação original
- Erro: "As datas de transferência devem estar dentro do período da alocação original"

### 2. Validação de Conflitos (Origem)
- Instrutor destinatário não pode ter alocações naquele período/turno
- Erro: "Este instrutor já está alocado na sala X neste período e turno"

### 3. Validação de Conflitos (Destino)
- Turma selecionada não pode ter alocações naquele período/turno
- Erro: "Esta turma já está alocada neste período e turno"

### 4. Validação de Permissões
- Apenas instrutor da alocação original pode solicitar transferência
- Apenas instrutor destinatário pode aceitar/rejeitar
- Admin pode fazer qualquer operação

---

## Tratamento de Erros

### Backend
- Validações retornam HTTP 400 com mensagem descritiva
- Transações são revertidas em caso de erro
- Logs de erro no console do servidor

### Frontend
- Mensagens de erro exibidas em modal
- Botões desabilitados quando há conflito
- Confirmação antes de rejeitar transferência

---

## Banco de Dados

### Nova Tabela: Transferencias_Pendentes
```sql
CREATE TABLE Transferencias_Pendentes (
  id_transferencia INT AUTO_INCREMENT PRIMARY KEY,
  id_alocacao_original INT NOT NULL,
  id_instrutor_origem INT NOT NULL,
  id_instrutor_destino INT NOT NULL,
  data_inicio_transferencia DATE NOT NULL,
  data_fim_transferencia DATE NOT NULL,
  status ENUM('pendente', 'aceita', 'rejeitada') NOT NULL DEFAULT 'pendente',
  data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_trans_aloc FOREIGN KEY (id_alocacao_original) 
      REFERENCES Alocacoes(id_alocacao) ON DELETE CASCADE,
  CONSTRAINT fk_trans_inst_origem FOREIGN KEY (id_instrutor_origem) 
      REFERENCES Instrutores(id_instrutor) ON DELETE CASCADE,
  CONSTRAINT fk_trans_inst_destino FOREIGN KEY (id_instrutor_destino) 
      REFERENCES Instrutores(id_instrutor) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
```

---

## Compatibilidade

- ✓ Fuso horário: UTC-3 (Nova Lima, MG)
- ✓ Navegadores: Chrome, Firefox, Safari, Edge (últimas versões)
- ✓ Banco de dados: MySQL 5.7+
- ✓ Node.js: 14+
- ✓ Express: 4.x

---

## Notas de Implementação

1. **Transações**: O aceite de transferência usa transação para garantir consistência
2. **Notificações**: Ambos os instrutores recebem notificações (aceite ou rejeição)
3. **Divisão de Alocação**: A alocação original é deletada e recriada em até 2 partes
4. **Validação Client-side**: Há validação no frontend para melhor UX
5. **Validação Server-side**: Todas as validações são refeitas no backend por segurança

---

## Testes Recomendados

Veja arquivo `TESTE_TRANSFERENCIAS.md` para guia completo de testes.

Cenários principais:
1. Transferência simples (aceite)
2. Transferência com rejeição
3. Validação de conflitos
4. Datas inválidas
5. Múltiplas transferências simultâneas

