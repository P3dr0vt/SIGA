# TODO - Ajustes SIGA/GERA

## Etapa 1 — Auditoria e correções base (UI/filtragem/permissões)
- [x] Corrigir a tela inicial para incluir ROBÓTICA na listagem (remove filtro que escondia bloco ROBÓTICA) e alinhar sublinhado com admin (primeira correção aplicada).
- [x] Ajustar a marcação do instrutor: quando **perfil = admin** sublinhar o nome do instrutor nas listagens; instrutor vê normal.
- [x] Consertar exibição de ROBÓTICA na tela inicial (garantir que respeita o filtro de turno/data corretamente e que não “some” alocação existente).

- [ ] Garantir permissões na UI:
  - [ ] Instrutor **não criar** instrutores (bloquear botão/ações)
  - [ ] Instrutor **não adicionar** alocações para outros instrutores (select travado/validado)
  - [ ] Instrutor poder **editar** a própria alocação para trocar o dia/turma/sala.

## Etapa 2 — Layout Robótica (mesma base visual da tela inicial)
- [ ] Atualizar `frontend/pages/robotica.html` + `frontend/js/robotica.js` para ficar com o mesmo estilo/listagem da tela inicial, mas separado por **Manhã/Tarde/Noite**.
- [ ] Manter cards/linhas “por coisa” (mesmo padrão de colunas: instrutor/sala/turma) e com destaque/sublinhado conforme admin.
- [ ] Corrigir para mostrar corretamente alocações existentes conforme turno e **dias selecionados** (intervalo).

## Etapa 3 — Calendário mensal com setas e vermelho (ocupação real)
- [ ] Substituir o calendário atual de ~21 dias por **calendário mensal** (mês/ano) com setas.
- [ ] Calcular ocupação por **sala + turno** e marcar em vermelho os dias ocupados.
- [ ] Manter seleção (inicio/fim) e evidenciar dias dentro do intervalo.

## Etapa 4 — Backend (se necessário)
- [ ] Verificar se backend já impõe corretamente as permissões (admin cria/remover; instrutor só suas alocações).
- [ ] Se UI precisar de “editability” de dias/turmas, ajustar endpoints (ex.: PUT/PATCH de alocação) e/ou adicionar endpoints.

## Etapa 5 — Empacotar ZIP e testar
- [ ] Rodar o projeto (backend e abrir no navegador) e validar:
  - [ ] Tela inicial com filtro de data/cobertura por dia
  - [ ] Robótica com layout e listagem corretos
  - [ ] Calendário mensal com marcação vermelha
  - [ ] Permissões para admin vs instrutor
- [ ] Criar ZIP final do projeto e entregar.

