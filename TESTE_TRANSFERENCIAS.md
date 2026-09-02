# Guia de Teste - Fluxo de Transferências de Alocações

## Resumo das Alterações Implementadas

### Backend
1. **Nova Tabela**: `Transferencias_Pendentes`
   - Armazena solicitações de transferência com status (pendente, aceita, rejeitada)
   - Relaciona alocação original, instrutor origem e instrutor destino

2. **Nova Rota**: `/api/transferencias`
   - `POST /` - Criar solicitação de transferência
   - `GET /` - Listar transferências pendentes do instrutor logado
   - `GET /:id` - Obter detalhes de uma transferência
   - `PUT /:id/aceitar` - Aceitar transferência com seleção de turma
   - `PUT /:id/rejeitar` - Rejeitar transferência

3. **Alterações em Alocações**:
   - Rota `PUT /:id` agora apenas atualiza a alocação (não transfere mais)
   - Transferências agora são feitas via rota de transferências

### Frontend
1. **Nova Modal**: `modalAceitarTransferencia`
   - Exibe informações da transferência solicitada
   - Permite seleção de turma
   - Valida conflitos antes de aceitar
   - Botões: REJEITAR e ACEITAR

2. **Atualização de Notificações**:
   - Carrega transferências pendentes junto com notificações
   - Transferências aparecem destacadas em azul
   - Clique em transferência abre o modal de aceitar/rejeitar

3. **Novo Arquivo**: `alocacoes.js`
   - Funções para abrir/fechar modal de transferência
   - Validação de conflitos antes de aceitar
   - Integração com API de transferências

## Cenário de Teste

### Dados de Teste
- **Igor** (ID Instrutor: 1) - Sala 101, Turma Design, Turno Noite, 22/05/2026 a 29/05/2026
- **Fagner** (ID Instrutor: 2) - Instrutor destinatário

### Passos do Teste

#### 1. Criar Alocação Inicial (Admin)
```
1. Login como admin@senai.com / admin123
2. Ir para Alocações
3. Criar alocação:
   - Instrutor: Igor (ID 1)
   - Sala: Sala 101
   - Turma: Design
   - Turno: Noite
   - Data Início: 22/05/2026
   - Data Fim: 29/05/2026
```

#### 2. Igor Solicita Transferência
```
1. Login como Igor (1001@senai.com / 1001)
2. Ir para Alocações
3. Clicar na alocação criada
4. Modal de Transferência:
   - Instrutor Destinatário: Fagner
   - Data Início: 25/05/2026
   - Data Fim: 27/05/2026
5. Clicar em TRANSFERIR
6. Confirmar mensagem de sucesso
```

#### 3. Fagner Recebe Notificação
```
1. Login como Fagner (1002@senai.com / 1002)
2. Ir para Dashboard (index.html)
3. Verificar se há notificação de transferência
4. Clicar no sino de notificações
5. Clicar na notificação de transferência
6. Deve ser redirecionado para Alocações com modal aberto
```

#### 4. Fagner Aceita Transferência
```
1. No modal de aceitar:
   - Verificar informações exibidas:
     * Instrutor de Origem: Igor
     * Sala: Sala 101
     * Turno: Noite
     * Período: 25/05/2026 até 27/05/2026
   - Selecionar Turma: Design (ou outra disponível)
   - Clicar em ACEITAR
2. Confirmar mensagem de sucesso
```

#### 5. Validar Resultado
```
1. Ir para Alocações
2. Verificar se existem 3 alocações:
   - Igor: 22/05 a 24/05 (Design)
   - Fagner: 25/05 a 27/05 (Design)
   - Igor: 28/05 a 29/05 (Design)
3. Igor deve receber notificação de aceite
```

### Cenários Adicionais de Teste

#### Teste: Rejeição de Transferência
```
1. Repetir passos 1-3
2. No modal de aceitar, clicar em REJEITAR
3. Confirmar rejeição
4. Igor deve receber notificação de rejeição
5. Alocação original deve permanecer intacta
```

#### Teste: Validação de Conflito
```
1. Criar alocação para Fagner: 26/05 a 26/05 (Design, Sala 101, Noite)
2. Igor solicita transferência: 25/05 a 27/05
3. Fagner tenta aceitar com turma Design
4. Sistema deve exibir erro: "Esta turma já está alocada neste período e turno"
5. Fagner seleciona turma diferente e aceita
```

#### Teste: Datas Inválidas
```
1. Igor tenta transferir: 20/05 a 15/06 (fora do período original)
2. Sistema deve exibir erro: "As datas de transferência devem estar dentro do período da alocação original"
```

## Checklist de Validação

- [ ] Tabela `Transferencias_Pendentes` criada com sucesso
- [ ] Rota POST /api/transferencias funciona
- [ ] Rota GET /api/transferencias retorna transferências pendentes
- [ ] Rota PUT /api/transferencias/:id/aceitar funciona
- [ ] Rota PUT /api/transferencias/:id/rejeitar funciona
- [ ] Modal de aceitar/rejeitar abre corretamente
- [ ] Validação de conflitos funciona
- [ ] Alocação original é dividida corretamente
- [ ] Notificações são criadas para origem e destino
- [ ] Transferência rejeitada mantém alocação original intacta
- [ ] Datas de transferência validadas contra período original

## Notas Importantes

1. **Fuso Horário**: UTC-3 (Nova Lima, MG)
2. **Validação de Datas**: Todas as datas devem estar dentro do período da alocação original
3. **Conflito de Turma**: A turma selecionada não pode ter alocações naquele período/turno
4. **Divisão de Alocação**: A alocação original é deletada e criadas duas novas (antes e depois da transferência)
5. **Notificações**: Ambos os instrutores recebem notificações (aceite ou rejeição)

