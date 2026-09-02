# Imagem base Node.js LTS (Alpine = leve)
FROM node:20-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Copia dependências primeiro (aproveita cache do Docker)
COPY package*.json ./

# Instala dependências de produção
RUN npm ci --omit=dev

# Copia o código do backend e do frontend
COPY backend/ ./backend/
COPY public/ ./public/

# Define o diretório de execução
WORKDIR /app

# Expõe a porta do servidor Node
EXPOSE 3000

# Comando para iniciar
CMD ["node", "backend/server.js"]
