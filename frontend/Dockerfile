FROM node:20-slim

WORKDIR /app

COPY package*.json ./

# Instala as dependências (incluindo o Vite)
RUN npm install

COPY . .

EXPOSE 5173

# Usa o npx para garantir que o vite seja encontrado no path local
CMD ["npx", "vite", "--host"]
