# Imagem base Node.js LTS (Alpine = leve)
FROM node:20-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Copia dependências primeiro (aproveita cache do Docker)
COPY backend/package*.json ./backend/

# Instala dependências de produção
RUN cd backend && npm install --omit=dev

# Copia o código do backend e do frontend
COPY backend/ ./backend/
COPY frontend/ ./frontend/

# Define o diretório de execução
WORKDIR /app/backend

# Expõe a porta do servidor Node
EXPOSE 3000

# Comando para iniciar
CMD ["node", "server.js"]
