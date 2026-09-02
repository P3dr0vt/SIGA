# Publicacao segura na Vercel com Supabase

> Estado atual: o backend ainda usa MySQL e nao deve ser conectado diretamente ao Supabase. O Supabase fornece PostgreSQL; primeiro migre o schema, as consultas e o driver da aplicacao.

## Antes de publicar

1. Revogue e troque todas as senhas que ja apareceram nos arquivos SQL ou no historico Git.
2. Remova os dumps `67.sql`, `backup.sql` e `backup_utf8.sql` do repositorio e do historico antes de torna-lo publico.
3. Crie projetos separados no Supabase para homologacao e producao quando o plano permitir.
4. Use a conexao com pool do Supabase apropriada para funcoes serverless e exija TLS.

## Variaveis na Vercel

Depois da migracao para PostgreSQL, cadastre as variaveis indicadas em `.env.example` em **Project Settings > Environment Variables**. Nunca envie um arquivo `.env` ao Git. Em `ALLOWED_ORIGINS`, informe exatamente o dominio de producao, sem barra no final.

Gere `JWT_SECRET` com um gerador criptograficamente seguro e use pelo menos 32 bytes aleatorios. Nao reutilize senha humana.

## Banco e primeira conta

Nao importe `database/siga_final.sql` no Supabase: esse arquivo ainda usa sintaxe MySQL. A migracao devera gerar um schema PostgreSQL proprio. Depois disso, para criar a primeira conta administrativa, configure temporariamente `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `ADMIN_NAME` em um ambiente local seguro e execute, dentro de `backend`:

```text
npm run create-admin
```

Remova `ADMIN_PASSWORD` do ambiente assim que o comando terminar.

## Validacoes finais

- Execute `npm ci` e `npm run check` dentro de `backend`.
- Teste login, primeiro acesso, expiracao da sessao e cada operacao com perfis admin, instrutor e TV.
- Rode uma analise de dependencias e um scanner DAST contra um ambiente de homologacao.
- Confira os logs sem dados pessoais e habilite alertas de erros e tentativas excessivas de login.
