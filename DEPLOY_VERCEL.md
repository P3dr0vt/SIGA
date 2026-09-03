# Publicacao segura na Vercel com Supabase

> O backend usa PostgreSQL. Na Vercel, utilize a URL do Transaction pooler do Supabase (porta 6543).

## Antes de publicar

1. Revogue e troque todas as senhas que ja apareceram nos arquivos SQL ou no historico Git.
2. Remova os dumps `67.sql`, `backup.sql` e `backup_utf8.sql` do repositorio e do historico antes de torna-lo publico.
3. Crie projetos separados no Supabase para homologacao e producao quando o plano permitir.
4. Use a conexao com pool do Supabase apropriada para funcoes serverless e exija TLS.

## Variaveis na Vercel

Cadastre as variaveis indicadas em `.env.example` em **Project Settings > Environment Variables**. Nunca envie um arquivo `.env` ao Git. Em `ALLOWED_ORIGINS`, informe exatamente o dominio de producao, sem barra no final.

Gere `JWT_SECRET` com um gerador criptograficamente seguro e use pelo menos 32 bytes aleatorios. Nao reutilize senha humana.

## Banco e primeira conta

Converta o backup local sem coloca-lo no repositorio:

```text
pnpm convert-backup -- D:\GERA\backup.sql
```

Aplique `database/siga_final.sql` no SQL Editor do Supabase. Depois aplique, sem versionar, `database/private/002_import_data.sql`. Todas as senhas importadas foram substituidas por hashes aleatorios; nenhuma senha do backup e reutilizada. O conversor se recusa a sobrescrever uma importacao existente por seguranca.

Para recriar o acesso administrativo sem instalar Node localmente:

```text
.\scripts\bootstrap-admin.ps1 -Url https://seu-projeto.vercel.app
```

O script solicita os segredos sem grava-los no historico do PowerShell. Antes de executa-lo, cadastre temporariamente `ADMIN_BOOTSTRAP_TOKEN` na Vercel com uma chave aleatoria de pelo menos 32 caracteres e faca um redeploy. Assim que receber a confirmacao, remova essa variavel da Vercel e redeploy novamente; isso desativa a rota.

As demais contas devem receber uma nova senha temporaria pela rota administrativa `POST /api/auth/usuarios/:id/resetar-senha`. A resposta nao deve ser registrada em logs e deve ser entregue diretamente ao titular. A troca no primeiro acesso revoga a credencial temporaria e as sessoes anteriores.

## Validacoes finais

- Execute `pnpm install --frozen-lockfile` e `pnpm check` na raiz do projeto.
- Teste login, primeiro acesso, expiracao da sessao e cada operacao com perfis admin, instrutor e TV.
- Rode uma analise de dependencias e um scanner DAST contra um ambiente de homologacao.
- Confira os logs sem dados pessoais e habilite alertas de erros e tentativas excessivas de login.
