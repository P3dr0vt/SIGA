# Alterações Implementadas no Sistema GERA

## Data de Implementação
02 de junho de 2026

## Alteração 1: Substituição de Sala de Aula por Laboratório

### Descrição
Permite que uma turma alocada em uma sala de aula seja substituída por uma alocação em laboratório na mesma data e turno. Da mesma forma, quando um instrutor recebe uma transferência e escolhe uma turma já alocada em sala de aula, o sistema permite a substituição automática.

### Arquivos Modificados

#### Backend
- **`backend/routes/alocacoes.js`**
  - Modificada função `verificarConflitosLaboratorio()`: agora busca conflitos por turma (não por instrutor) e permite substituição de SALA por LABORATORIO
  - Modificada função `validarConflitos()`: adicionada lógica para não validar conflito de turma quando for laboratório sobrepondo sala
  - Implementada lógica de divisão de alocações quando há substituição

- **`backend/routes/transferencias.js`**
  - Modificada função `validarConflitosturma()`: adicionado parâmetro `tipo_sala` para diferenciar validação entre SALA e LABORATORIO
  - Atualizada lógica de aceite de transferência para suportar substituição de sala por laboratório
  - Implementada divisão de alocações conflitantes quando há substituição

### Comportamento
- **Criação de Alocação**: Se uma turma está alocada em SALA e alguém tenta criar alocação em LABORATORIO para a mesma turma na mesma data/turno, a alocação em sala é substituída pela alocação em laboratório
- **Aceite de Transferência**: Se um instrutor recebe uma transferência e escolhe uma turma já alocada em sala de aula, o sistema permite a aceitação e substitui automaticamente a sala pelo laboratório
- **Divisão de Período**: Se a substituição ocorre apenas em parte do período original, a alocação anterior é dividida em duas partes (antes e depois da substituição)

---

## Alteração 2: Validação de Data Retroativa com Tolerância de 1 Dia

### Descrição
Permite alocações e transferências até **1 dia anterior** a hoje. Bloqueia apenas datas com mais de 1 dia de atraso. Hoje é 02/06/2026, então é permitido alocar para 01/06/2026, mas não para 31/05/2026.

### Arquivos Modificados

#### Frontend
- **`frontend/js/validacao-data-turno.js`** (NOVO)
  - Função auxiliar `validarDataRetroativaPorTurno()` que valida se uma data é retroativa
  - Lógica: permite até 1 dia anterior a hoje
  - Bloqueia apenas datas com mais de 1 dia de atraso

- **`frontend/pages/salas.html`**
  - Adicionada referência ao novo script `validacao-data-turno.js`

- **`frontend/pages/robotica.html`**
  - Adicionada referência ao novo script `validacao-data-turno.js`

- **`frontend/js/salas.js`**
  - Função `salvarAlocacao()`: substituída validação simples por chamada a `validarDataRetroativaPorTurno()`

- **`frontend/js/robotica.js`**
  - Função `salvarAlocacao()`: substituída validação simples por chamada a `validarDataRetroativaPorTurno()`

### Comportamento
- **Antes**: Bloqueava qualquer alocação no dia atual
- **Depois**: Permite alocação até 1 dia anterior a hoje
  - Bloqueia apenas datas com mais de 1 dia de atraso
  - Permite qualquer data a partir de 1 dia anterior até o futuro

### Exemplo de Uso
Considerando que hoje é 02/06/2026:

- Data selecionada: 02/06/2026 (hoje)
- Turno selecionado: Noite
- Resultado: ✅ **PERMITIDO**

- Data selecionada: 01/06/2026 (1 dia atrás)
- Turno selecionado: Qualquer
- Resultado: ✅ **PERMITIDO**

- Data selecionada: 31/05/2026 (2 dias atrás)
- Turno selecionado: Qualquer
- Resultado: ❌ **BLOQUEADO** (mais de 1 dia de atraso)

- Data selecionada: 03/06/2026 (amanhã)
- Turno selecionado: Qualquer
- Resultado: ✅ **PERMITIDO**

---

## Testes Recomendados

### Alteração 1
1. Criar alocação em SALA para uma turma
2. Tentar criar alocação em LABORATORIO para a mesma turma na mesma data/turno
3. Verificar se a alocação em SALA foi substituída pela alocação em LABORATORIO
4. Testar com período parcial (substituição em parte do período)
5. Testar aceite de transferência com substituição de sala por laboratório

### Alteração 2
1. Alocar para hoje - deve permitir
2. Alocar para 1 dia atrás - deve permitir
3. Alocar para 2 dias atrás - deve bloquear
4. Alocar para amanhã - deve permitir
5. Testar em diferentes telas (Salas, Laboratórios, Robótica)

---

## Notas Importantes
- A validação de data retroativa é feita no **frontend** (cliente)
- A lógica de substituição de sala por laboratório é feita no **backend** (servidor)
- Todas as alterações mantêm compatibilidade com o código existente
- A tolerância de 1 dia anterior facilita a criação de alocações que foram esquecidas no dia anterior
