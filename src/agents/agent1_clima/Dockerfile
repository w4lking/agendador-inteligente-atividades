# src/agents/agent1_clima/Dockerfile
# Imagem base oficial do Node.js
FROM node:18-alpine

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos package.json e package-lock.json (se existir) para instalar as dependências
COPY package*.json ./

# Instalar as dependências
RUN npm install

# Copiar todo o código-fonte da aplicação para contêiner
COPY . .

# Expõe a porta que a aplicação vai rodar
EXPOSE 3001

# Comando para rodar a aplicação quando o contêiner inicializar
CMD ["node", "index.js"]