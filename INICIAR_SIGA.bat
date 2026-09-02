@echo off
title SIGA - Sistema Integrado de Gestao de Alocacao
color 1F
cls

echo.
echo  ================================================
echo   SIGA - Sistema Integrado de Gestao de Alocacao
echo   SENAI Nova Lima
echo  ================================================
echo.

:: Verificar se o Node.js está instalado
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo  [ERRO] Node.js nao encontrado!
  echo.
  echo  Por favor, instale o Node.js em: https://nodejs.org
  echo  Recomendado: versao LTS
  echo.
  pause
  exit /b 1
)

echo  Node.js encontrado.

:: Entrar na pasta do backend
cd /d "%~dp0backend"

:: Verificar se as dependências já foram instaladas
if not exist "node_modules" (
  echo.
  echo  Instalando dependencias (primeira execucao)...
  echo  Aguarde, isso pode levar alguns minutos...
  echo.
  npm install
  if %errorlevel% neq 0 (
    echo.
    echo  [ERRO] Falha ao instalar dependencias.
    echo  Verifique sua conexao com a internet e tente novamente.
    echo.
    pause
    exit /b 1
  )
  echo.
  echo  Dependencias instaladas com sucesso!
)

echo.
echo  Iniciando o servidor SIGA...
echo.
echo  ================================================
echo   Acesse o sistema em: http://localhost:3000
echo   Para encerrar: feche esta janela ou Ctrl+C
echo  ================================================
echo.

:: Abrir o navegador automaticamente após 2 segundos
start "" /b cmd /c "timeout /t 2 /nobreak >nul && start http://localhost:3000"

:: Iniciar o servidor
node server.js

echo.
echo  Servidor encerrado.
pause
