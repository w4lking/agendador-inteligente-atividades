
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3001

# Comando para rodar a aplicação quando o contêiner inicializar
CMD ["node", "index.js"]