# src/api/Dockerfile

# Imagem base oficial do Node.js
FROM node:18-alpine

# Define o diretório de trabalho dentro do contêiner
WORKDIR /usr/src/app

# Copia os arquivos package.json e package-lock.json
COPY package*.json ./

# Instala as dependências
RUN npm install --production

# Copia o restante do código da aplicação
COPY . .

# Copia o arquivo .env para o contêiner
# Este .env conterá as URLs dos outros agentes
COPY .env .env

# Expõe a porta que a aplicação vai escutar (porta da API Principal)
EXPOSE 3000

# Comando para rodar a aplicação quando o contêiner iniciar
CMD ["node", "index.js"]
