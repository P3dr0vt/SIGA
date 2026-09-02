#!/bin/bash
# SIGA - Script de Inicialização (Linux/Mac)

echo ""
echo "================================================"
echo "  SIGA - Sistema Integrado de Gestão de Alocação"
echo "  SENAI Nova Lima"
echo "================================================"
echo ""

# Verificar Node.js
if ! command -v node &> /dev/null; then
  echo "[ERRO] Node.js não encontrado!"
  echo "Instale em: https://nodejs.org"
  exit 1
fi

echo "Node.js encontrado: $(node --version)"

# Entrar na pasta do backend
cd "$(dirname "$0")/backend"

# Instalar dependências se necessário
if [ ! -d "node_modules" ]; then
  echo ""
  echo "Instalando dependências (primeira execução)..."
  npm install
  if [ $? -ne 0 ]; then
    echo "[ERRO] Falha ao instalar dependências."
    exit 1
  fi
fi

echo ""
echo "Iniciando o servidor SIGA..."
echo ""
echo "================================================"
echo "  Acesse: http://localhost:3000"
echo "  Para encerrar: Ctrl+C"
echo "================================================"
echo ""

# Abrir navegador (tenta xdg-open, open ou start)
(sleep 2 && (xdg-open http://localhost:3000 2>/dev/null || open http://localhost:3000 2>/dev/null)) &

npm start
