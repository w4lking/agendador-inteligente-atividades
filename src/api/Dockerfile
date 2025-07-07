
FROM node:18-alpine


WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install --production

COPY . .

COPY .env .env


EXPOSE 3000

# Comando para rodar a aplicação quando o contêiner iniciar
CMD ["node", "index.js"]
