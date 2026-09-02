# SIGA - Sistema Integrado de Gestão de Alocação
## Documento de Regras de Negócio e Requisitos Funcionais (Versão 2.0)

Este documento descreve as diretrizes lógicas e as funcionalidades do sistema SIGA, desenvolvido para a gestão de salas, instrutores e turmas do SENAI.

---

### 1. Regras de Negócio (RN)
As regras de negócio definem as restrições e a inteligência por trás do funcionamento do sistema.

| ID | Regra de Negócio | Descrição |
|:---|:---|:---|
| **RN01** | **Conflito de Sala** | Uma sala não pode ser alocada para mais de um instrutor no mesmo turno e período de datas. |
| **RN02** | **Conflito de Instrutor** | Um instrutor não pode estar alocado em duas salas diferentes no mesmo turno e período de datas. |
| **RN03** | **Conflito de Turma** | Uma turma não pode estar em duas salas diferentes no mesmo turno e período de datas. |
| **RN04** | **Exclusão em Cascata** | Ao excluir uma Sala, Instrutor ou Turma, todas as alocações vinculadas a eles devem ser removidas automaticamente. |
| **RN05** | **Acesso do Instrutor** | Instrutores só podem visualizar o dashboard e gerenciar suas próprias alocações (reservas). |
| **RN06** | **Primeiro Acesso** | No primeiro login, o instrutor deve obrigatoriamente alterar sua senha padrão. |
| **RN07** | **Setor Robótica** | Salas de robótica são independentes e não devem ser exibidas nos blocos comuns (A, B, C) do dashboard. |
| **RN08** | **Senhas** | Por questões de auditoria interna simplificada, as senhas são armazenadas em texto limpo (sem criptografia). |

---

### 2. Requisitos Funcionais (RF)
Os requisitos funcionais descrevem o que o sistema deve fazer.

#### 2.1. Gestão de Acessos
- **RF01 - Login Multinível:** O sistema deve suportar perfis de Administrador, Instrutor e TV (Monitor).
- **RF02 - Geração Automática de Login:** Ao cadastrar um novo instrutor, o sistema deve gerar automaticamente um e-mail (`nome.id@senai.com`) e uma senha padrão.
- **RF03 - Troca de Senha:** O sistema deve permitir que o instrutor altere sua senha após o primeiro acesso.
- **RF04 - Modo TV:** Deve existir um acesso especial que exibe apenas o dashboard em tela cheia, sem menus de edição.

#### 2.2. Gestão de Cadastros
- **RF05 - CRUD de Instrutores:** O sistema deve permitir adicionar e remover instrutores com interface visual simplificada.
- **RF06 - CRUD de Salas:** O sistema deve permitir cadastrar salas vinculando-as a blocos (A, B, C ou ROBOTICA).
- **RF07 - CRUD de Turmas:** O sistema deve permitir o gerenciamento de turmas com busca em tempo real.

#### 2.3. Alocações e Reservas
- **RF08 - Alocação por Período:** O sistema deve permitir selecionar data de início e data de fim para cada alocação.
- **RF09 - Validação em Tempo Real:** A interface deve sinalizar (borda vermelha/aviso) e bloquear o salvamento caso um conflito de horário seja detectado antes do envio.
- **RF10 - Alocação Direta (Robótica):** Na página de robótica, o usuário deve poder clicar diretamente na sala para realizar a alocação.
- **RF11 - Remoção Visual:** A exclusão de itens deve ser feita através de um "Modo de Remoção" onde o usuário clica diretamente no ícone do item indesejado.

#### 2.4. Dashboard e Visualização
- **RF12 - Turno Automático:** O dashboard deve identificar a hora atual do computador e filtrar automaticamente o turno (Manhã, Tarde ou Noite).
- **RF13 - Filtro de Turno Manual:** O usuário deve poder trocar o turno visualizado através de um seletor no header.
- **RF14 - Organização por Blocos:** O dashboard deve organizar as alocações em colunas divididas por Blocos A, B e C.

---

### 3. Requisitos Não Funcionais (RNF)
- **RNF01 - Interface:** Deve ser responsiva e utilizar a identidade visual azul do SENAI.
- **RNF02 - Performance:** As validações de conflito devem ocorrer no lado do cliente (frontend) para resposta instantânea.
- **RNF03 - Persistência:** Os dados devem ser armazenados em banco de dados MySQL.
