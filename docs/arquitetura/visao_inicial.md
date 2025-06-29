# Visão Arquitetônica Inicial: Agendador Inteligente de Atividades

## Introdução

Este documento apresenta a visão arquitetônica inicial do sistema **"Agendador Inteligente de Atividades"**, conforme sua concepção atual, antes da aplicação de qualquer metodologia formal de modelagem de ameaças. O objetivo é descrever os componentes principais do sistema, suas interações e os fluxos de dados, fornecendo uma base para a posterior identificação e mitigação de riscos de segurança.

O sistema é projetado como uma arquitetura de microserviços, orquestrada por uma API principal e composta por agentes de Inteligência Artificial especializados.

---

## Componentes do Sistema

O sistema é composto pelos seguintes microserviços, cada um encapsulado em um contêiner Docker, conforme definido no arquivo `docker-compose.yml`:

### 1. API Principal (Orquestrador)

- **Função**: Ponto de entrada central do sistema. Recebe requisições do frontend (ou de outros clientes), orquestra a comunicação entre os agentes de IA e retorna respostas consolidadas. Responsável por rotear requisições e agregar resultados.
- **Tecnologia**: Node.js (`src/api/index.js`, `Dockerfile`)
- **Porta Exposta**: `3000`
- **Dependências**: `agent1-clima` e `agent2-atividades`

### 2. Agente 1: Previsor de Horários Climáticos Otimizados (`agent1-clima`)

- **Função**: Interage com APIs externas (como OpenWeather) para obter dados meteorológicos e prever os melhores horários para atividades ao ar livre.
- **Tecnologia**: Node.js (`src/agents/agent1_clima/index.js`, `Dockerfile`)
- **Porta Exposta**: `3001`
- **Dependências**: Chave da API `OPENWEATHER_API_KEY`

### 3. Agente 2: Classificador de Atividades Recomendadas (`agent2-atividades`)

- **Função**: Utiliza IA generativa (como Gemini) para classificar e recomendar atividades com base no clima e preferências do usuário.
- **Tecnologia**: Node.js (`src/agents/agent2_atividades/index.js`, `Dockerfile`)
- **Porta Exposta**: `3002`
- **Dependências**: Chave da API `GEMINI_API_KEY`

### 4. Frontend

- **Função**: Interface de usuário que permite interações com o sistema. Envia requisições à API Principal e exibe os resultados.
- **Tecnologia**: HTML estático (`frontend/index.html`) com JavaScript para comunicação via API.

---

## Fluxo de Dados e Interações

1. **Usuário → Frontend**: O usuário solicita o agendamento de uma atividade.
2. **Frontend → API Principal**: O frontend envia uma requisição HTTP para a API Principal (`porta 3000`).
3. **API Principal → Agente 1 (Clima)**: A API envia dados como localização e data para o `agent1-clima` (`porta 3001`), que consulta a OpenWeather.
4. **Agente 1 → OpenWeather API**: Consulta à API externa de clima.
5. **OpenWeather API → Agente 1**: Retorno dos dados climáticos.
6. **Agente 1 → API Principal**: Retorno dos horários otimizados.
7. **API Principal → Agente 2 (Atividades)**: Envia dados ao `agent2-atividades` (`porta 3002`), como tipo de atividade e clima.
8. **Agente 2 → Gemini API**: Consulta à IA para recomendação de atividades.
9. **Gemini API → Agente 2**: Retorno das sugestões.
10. **Agente 2 → API Principal**: Retorno das recomendações.
11. **API Principal → Frontend**: Consolidação e retorno ao frontend.
12. **Frontend → Usuário**: Exibição dos resultados ao usuário.

---

## Limites de Confiança

- **Usuário ↔ Frontend**: Deve validar e sanitizar entradas.
- **Frontend ↔ API Principal**: Comunicação crítica, deve ser protegida.
- **API Principal ↔ Agentes**: Comunicação via rede Docker interna.
- **Agentes ↔ APIs Externas**: Comunicação com serviços externos via HTTPS.

---

## Considerações Iniciais de Segurança

- **Proteção de Chaves de API**: Nunca expor chaves diretamente no código ou repositórios públicos.
- **Comunicação Segura**: Uso obrigatório de HTTPS.
- **Validação de Entrada**: Prevenir injeções e dados maliciosos.
- **Controle de Acesso**: Definir estratégias para controle e autenticação.

---

> Esta visão inicial servirá como base para a aplicação da metodologia STRIDE e a identificação sistemática de ameaças, abordadas na próxima fase do projeto.
