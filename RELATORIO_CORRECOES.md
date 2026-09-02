# Relatório de Correções do Sistema GERA

Este pacote contém a versão corrigida do sistema GERA conforme os requisitos solicitados. Foram mantidas as partes já funcionais e alteradas as áreas com falha de visualização, permissões, autoria de alocações, calendário e layout.

## Correções principais

| Área | Correção aplicada |
|---|---|
| Tela inicial | A listagem agora considera corretamente a data selecionada e exibe alocações cujo intervalo de `data_inicio` até `data_fim` contém o dia visualizado. |
| Tela inicial | Removida a opção de visualizar todos os turnos; a visualização permanece por data e por turno específico. |
| Robótica | A página foi remodelada para usar o mesmo padrão visual da página inicial, dividida por **Manhã**, **Tarde** e **Noite**, com uma linha por sala. |
| Robótica | As alocações existentes da robótica agora são carregadas e exibidas corretamente conforme a data selecionada. |
| Autoria da alocação | Alocações criadas por administrador passam a registrar `criado_por_perfil = admin`; alocações criadas por instrutor registram `instrutor`. |
| Sublinhado do instrutor | Quando uma alocação foi criada por administrador, o nome do instrutor aparece sublinhado na tela inicial, na robótica e na página de alocações. Quando criada pelo próprio instrutor, aparece normal. |
| Instrutores | A criação de instrutor exige nome e permite informar matrícula; caso não seja informada, a matrícula é gerada automaticamente. O login e a senha inicial são baseados na matrícula. |
| Permissões | Instrutores visualizam somente suas alocações na página de alocações. Eles podem criar alocações apenas para si mesmos e editar/transferir somente suas próprias alocações. |
| Permissões | Instrutores não podem criar/remover instrutores, salas ou turmas; as interfaces correspondentes ocultam botões de alteração e o backend também bloqueia chamadas diretas. |
| Calendário de salas | O calendário de ocupação foi substituído por um calendário mensal navegável, mostrando todos os dias do mês, com setas para navegar entre meses. |
| Calendário de salas | Os dias ocupados ficam marcados em vermelho conforme sala e turno selecionados, permitindo verificar disponibilidade sem clicar dia por dia. |
| Conflitos | O backend valida conflitos de sala por intervalo de datas e turno antes de criar ou editar alocações. |
| Banco existente | O servidor tenta adicionar automaticamente as colunas de autoria em bancos já existentes. O script SQL também foi atualizado para novas instalações. |

## Arquivos alterados

| Arquivo | Finalidade |
|---|---|
| `backend/routes/alocacoes.js` | Filtros por data, permissões, edição/transferência, autoria e validação de conflitos. |
| `backend/server.js` | Migração automática das novas colunas de autoria. |
| `backend/routes/salas.js` | Restrição de criação/remoção de salas a administradores. |
| `backend/routes/turmas.js` | Restrição de criação/edição/remoção de turmas a administradores. |
| `database/siga_final.sql` | Inclusão de campos de autoria na tabela de alocações. |
| `frontend/js/script.js` | Visualização correta da tela inicial por data e sublinhado de autoria. |
| `frontend/index.html` | Remoção da opção “Todos” no seletor de turnos. |
| `frontend/js/robotica.js` | Visualização da robótica por data e turno, com alocações existentes. |
| `frontend/pages/robotica.html` | Layout igual ao padrão da tela inicial, separado por horários. |
| `frontend/js/salas.js` | Calendário mensal navegável com dias ocupados em vermelho por turno. |
| `frontend/pages/salas.html` | Ajuste do modal para comportar o calendário mensal. |
| `frontend/js/alocacoes.js` | Regras de visualização/edição/transferência conforme perfil. |
| `frontend/js/turmas.js` | Interface alinhada às permissões administrativas. |
| `frontend/css/style.css` e `frontend/css/gestao.css` | Estilos de sublinhado e calendário mensal. |

## Testes executados

Foram executadas verificações de sintaxe com `node --check` nos arquivos JavaScript alterados do backend e frontend. O backend também foi iniciado por alguns segundos; ele subiu sem falha fatal. Como o ambiente de teste não possui o banco MySQL configurado com as credenciais reais do projeto, a validação de conexão exibiu apenas o aviso esperado de banco indisponível, mas o processo do servidor iniciou normalmente.

## Observação de banco de dados

Em uma instalação já existente, ao iniciar o backend, o sistema tentará adicionar automaticamente as colunas abaixo na tabela `Alocacoes`, caso ainda não existam:

```sql
criado_por_perfil ENUM('admin', 'instrutor') NOT NULL DEFAULT 'admin',
criado_por_usuario INT NULL
```

Para uma instalação nova, o arquivo `database/siga_final.sql` já foi atualizado com esses campos.
