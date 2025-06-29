# Visão Arquitetônica Final: Implementação e Medidas de Mitigação

## 1. Introdução

Este documento detalha a arquitetura final implementada para o **Agendador Inteligente de Atividades ao Ar Livre**, com foco nas soluções e medidas de mitigação adotadas para os riscos de segurança e operacionais identificados na *Visão Arquitetônica Inicial*. Ele ilustra como o design evoluiu para um sistema distribuído mais robusto e seguro.

## 2. Evolução Arquitetônica

O design inicial foi mantido em sua essência, com a arquitetura de microserviços e a divisão de responsabilidades claras entre a API Principal e os agentes de IA. A principal evolução ocorreu na forma como os serviços são orquestrados e como as preocupações de segurança e resiliência são endereçadas, transformando as ameaças identificadas em mitigações efetivas. Todos os serviços são agora executados como contêineres Docker, gerenciados por Docker Compose.

## 3. Componentes do Sistema (Estado Implementado)

### 3.1. API Principal (Orquestrador)

- **Função**: Ponto de entrada central. Orquestra o fluxo de requisições, chamando os agentes de IA e consolidando suas respostas. Também implementa tratamento de erros para falhas de comunicação com os agentes.
- **Tecnologia**: Node.js (Express.js)
- **Porta**: 3000
- **Containerização**: Executado como um contêiner Docker

### 3.2. Agente 1: Previsor de Horários Climáticos Otimizados

- **Função**: Interage com a OpenWeatherMap API, aplica lógica heurística e um algoritmo de pontuação para identificar e ranquear horários ótimos. Em caso de ausência de horários ótimos, busca opções futuras.
- **Componente de IA**: Lógica de pontuação multicritério e regras para inferir a "otimalidade".
- **Tecnologia**: Node.js (Express.js)
- **Porta**: 3001
- **Containerização**: Contêiner Docker

### 3.3. Agente 2: Classificador de Atividades Recomendadas

- **Função**: Recebe dados climáticos processados e utiliza IA generativa (Google Gemini) para recomendar atividades ao ar livre ou alternativas com justificativas.
- **Componente de IA**: Integração com LLM para respostas dinâmicas e contextuais.
- **Tecnologia**: Node.js (Express.js), Google Gemini API
- **Porta**: 3002
- **Containerização**: Contêiner Docker

### 3.4. APIs Externas

- **OpenWeatherMap API**: Dados de previsão do tempo
- **Google Gemini API**: IA generativa para criação de conteúdo

## 4. Fluxo de Dados (Implementado)

1. O cliente envia uma requisição `POST` para a API Principal: `http://localhost:3000/schedule-activity`
2. A API Principal chama o Agente 1 (Clima): `http://agent1-clima:3001/predict-optimal-hours`
3. O Agente 1 consulta a OpenWeatherMap API
4. O Agente 1 processa a resposta e envia os horários à API Principal
5. A API Principal chama o Agente 2 (Atividades): `http://agent2-atividades:3002/recommend-activities`
6. O Agente 2 interage com a Google Gemini API
7. O Agente 2 retorna as recomendações para a API Principal
8. A API Principal consolida e envia a resposta final ao cliente

## 5. Diagrama Arquitetônico (Final)

*(Irei colocar a imagem depois)*

## 6. Medidas de Mitigação Implementadas

### Exposição de Chaves de API

- **Mitigação**: Variáveis sensíveis armazenadas em `.env` (adicionado ao `.gitignore`). Docker Compose injeta as variáveis apenas nos contêineres que precisam.

### Indisponibilidade do Agente 1 ou Agente 2

- **Mitigação**: `try-catch` nas chamadas `axios` na API Principal. Erros são tratados e mensagens amigáveis são exibidas ao usuário.

### Indisponibilidade das APIs Externas

- **Mitigação**: Os agentes usam `try-catch` ao interagir com as APIs externas. Se houver falha, a API Principal é informada e comunica adequadamente ao usuário.

### Sobrecarga da API Principal

- **Mitigação**: Arquitetura escalável com microsserviços e contêineres. Está pronta para expansão com Docker Swarm ou Kubernetes.

### Injeção de Dados Maliciosos

- **Mitigação**: Validação básica na API Principal e nos agentes (ex: verificação de campos obrigatórios). Para produção, é necessário expandir para validações mais rigorosas.

### Custo Inesperado com a Google Gemini API

- **Mitigação**: Uso do *free tier* da API. Prompt engineering otimiza consumo de tokens (respostas concisas com 3-5 atividades).

### Respostas Inadequadas/Enviesadas da IA Generativa

- **Mitigação**: Prompt engineering bem definido no Agente 2. Em caso de parsing mal-sucedido, o texto bruto é retornado para depuração.

### Credenciais no `docker-compose.yml`

- **Mitigação**: O `docker-compose.yml` referencia variáveis do `.env`, que está no `.gitignore`, garantindo que chaves não sejam expostas no repositório público.

## 7. Conclusão da Visão Final

A arquitetura final do **Agendador Inteligente de Atividades ao Ar Livre** demonstra a aplicação de princípios modernos de sistemas distribuídos com microsserviços contentorizados e orquestrados por Docker Compose. As medidas de mitigação implementadas abordam ativamente os riscos identificados, resultando em uma solução mais robusta, segura e escalável para o desafio proposto.
