# src/agents/agent2_atividades/Dockerfile

# Imagem base oficial do Node.js (escolha uma versão LTS, ex: 18-alpine ou 20-alpine)
# A versão Alpine é menor e mais leve para contêineres.
FROM node:18-alpine

# Define o diretório de trabalho dentro do contêiner.
# Todos os comandos subsequentes serão executados a partir deste diretório.
WORKDIR /usr/src/app

# Copia os arquivos package.json e package-lock.json (se existir) para o diretório de trabalho.
# Isso é feito primeiro para aproveitar o cache do Docker, pois as dependências mudam menos que o código.
COPY package*.json ./

# Instala as dependências do Node.js definidas no package.json.
# O --production garante que apenas as dependências de produção sejam instaladas, reduzindo o tamanho da imagem.
RUN npm install --production

# Copia o resto do código-fonte da aplicação para o diretório de trabalho.
COPY . .

# Copia o arquivo .env para o contêiner.
# É crucial que este arquivo contenha a GEMINI_API_KEY.
# IMPORTANTE: Em ambientes de produção reais, chaves de API não devem ir no contêiner.
# Devem ser passadas como segredos do orquestrador (Docker Swarm, Kubernetes) ou do ambiente.
# Para este trabalho, copiar o .env é aceitável para demonstração.
COPY .env .env

# Expõe a porta em que a aplicação vai escutar dentro do contêiner.
# Esta porta deve corresponder à porta definida no seu index.js (process.env.PORT ou 3002).
EXPOSE 3002

# Comando para rodar a aplicação quando o contêiner iniciar.
# O 'node index.js' inicia o servidor Express.
CMD ["node", "index.js"]