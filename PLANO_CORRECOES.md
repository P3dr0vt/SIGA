# Plano de Correções do GERA

Foram identificados os seguintes pontos principais a corrigir no sistema:

1. **Tela inicial**: a filtragem por data já existia parcialmente, mas precisava ser robustecida para garantir que alocações com intervalo de datas apareçam em todos os dias compreendidos entre `data_inicio` e `data_fim`. A visualização deve continuar separada por blocos A, B e C, com uma linha por alocação.

2. **Autoria da alocação**: não existia campo no banco para diferenciar alocações criadas por administrador daquelas criadas pelo próprio instrutor. Será acrescentado o campo `criado_por_perfil` em `Alocacoes`, retornado pela API, para sublinhar o instrutor apenas quando a alocação tiver sido criada por administrador.

3. **Robótica**: a página filtrava alocações de robótica apenas por sala e turno, sem considerar o dia selecionado, e salvava o turno errado usando o estado global em vez do campo do modal. A página será remodelada para usar o mesmo padrão visual da tela inicial, dividida por Manhã, Tarde e Noite, com linhas por horário/turno e filtro por data.

4. **Permissões de instrutor**: instrutores devem ver apenas suas alocações na página de alocações e só podem criar alocações para si próprios. Entretanto, devem poder transferir uma alocação própria para outro instrutor, o que requer uma rota de atualização controlada no backend.

5. **Cadastro de instrutor**: a criação por administrador com nome e matrícula já estava implementada; será mantida e reforçada para impedir criação por instrutores também no backend.

6. **Calendário de ocupação**: o calendário atual mostra apenas 21 dias a partir da data atual. Ele será substituído por um calendário mensal completo, começando no dia 1 e indo até o último dia do mês, com navegação por mês e marcação em vermelho dos dias ocupados conforme a sala e o turno selecionados.

7. **Backend**: rotas de salas e turmas não restringiam criação/remoção por perfil. As rotas serão protegidas para administradores quando envolverem criação/remoção; instrutores manterão a consulta.

8. **Entrega**: após alterações, serão executados testes estáticos e de sintaxe, e o projeto será empacotado em ZIP sem depender do diretório de trabalho temporário.
