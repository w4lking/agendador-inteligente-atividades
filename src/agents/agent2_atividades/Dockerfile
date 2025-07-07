
FROM node:18-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

COPY .env .env


EXPOSE 3002

# Comando para rodar a aplicação quando o contêiner iniciar.
# O 'node index.js' inicia o servidor Express.
CMD ["node", "index.js"]