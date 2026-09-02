# GERA

Sistema de gestao de ambientes educacionais do SENAI. Supervisores podem administrar instrutores, turmas, salas e alocacoes; instrutores podem reservar laboratorios e gerenciar as proprias alocacoes.

## Estado do projeto

O frontend e uma aplicacao HTML, CSS e JavaScript sem framework. A API usa Node.js e Express.

O backend atual ainda utiliza o driver MySQL. Antes da publicacao com Supabase, a camada de banco e o schema precisam ser migrados para PostgreSQL. A configuracao da Vercel ja existe, mas o deploy de producao so deve ser feito depois dessa migracao e dos testes de seguranca.

## Estrutura

```text
api/                 entrada serverless da Vercel
backend/
  config/            conexao com o banco
  routes/            endpoints da API
  scripts/           tarefas administrativas
database/            schema legado MySQL, temporariamente mantido para migracao
frontend/
  css/               estilos
  js/                comportamento das telas
  pages/             telas de gestao
Dockerfile           imagem para futura infraestrutura local
docker-compose.yml   ambiente local com MySQL e nginx
nginx.conf           proxy do ambiente local
vercel.json          configuracao do deploy serverless
```

## Desenvolvimento local

1. Instale uma versao LTS atual do Node.js.
2. Copie `.env.example` para `.env` e use apenas credenciais de desenvolvimento.
3. Entre em `backend` e execute `npm ci`.
4. Execute `npm run check` e depois `npm start`.

O arquivo `.env` nunca deve ser enviado ao repositorio.

## Perfis

- `admin`: administra cadastros e alocacoes.
- `instrutor`: reserva ambientes e gerencia apenas as proprias alocacoes.
- `tv`: somente visualizacao.

## Regras centrais

- Uma sala, um instrutor ou uma turma nao pode possuir alocacoes conflitantes no mesmo turno.
- Instrutores nao podem alterar alocacoes ou notificacoes de outros instrutores.
- O primeiro acesso exige troca da senha temporaria.
- Senhas persistidas devem usar hash bcrypt; nunca texto puro.
- Operacoes sensiveis devem ser validadas novamente na API, independentemente da interface.

## Publicacao

Consulte [DEPLOY_VERCEL.md](DEPLOY_VERCEL.md). A proxima etapa tecnica obrigatoria e migrar o banco para PostgreSQL/Supabase.
