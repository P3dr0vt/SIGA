@echo off
title SIGA – Gestão de Alocação
cd /d "%~dp0"

:: Verifica se o Node.js está instalado
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERRO: Node.js nao encontrado no sistema.
    echo  Instale em: https://nodejs.org  ^(versao LTS^)
    echo.
    pause
    exit /b 1
)

:: Instala dependências na primeira vez
if not exist node_modules (
    echo.
    echo  Primeira execucao: instalando dependencias...
    npm install --silent
    echo  Pronto!
    echo.
)

echo.
echo  Iniciando SIGA em http://localhost:3000 ...
echo  Para encerrar o sistema, feche esta janela.
echo.

:: Abre o navegador após 2 segundos (tempo pro servidor subir)
start /B cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Mantém o servidor rodando em primeiro plano
node server.js
