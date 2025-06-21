// src/api/index.js
const express = require('express');
const axios = require('axios');
require('dotenv').config(); // Para carregar variáveis de ambiente

const app = express();
const port = process.env.PORT || 3000; // Porta da API Principal (geralmente 3000)

// URLs dos Agentes (podem vir de variáveis de ambiente em um sistema maior)
const AGENT1_CLIMA_URL = process.env.AGENT1_CLIMA_URL || 'http://localhost:3001';
const AGENT2_ATIVIDADES_URL = process.env.AGENT2_ATIVIDADES_URL || 'http://localhost:3002';

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Endpoint principal para o agendamento inteligente
app.post('/schedule-activity', async (req, res) => {
    const { city, date, preferredActivity } = req.body; // preferredActivity é opcional

    if (!city || !date) {
        return res.status(400).json({ error: 'Cidade e data são obrigatórias.' });
    }

    try {
        // 1. Chamar o Agente 1 (Clima)
        console.log(`Chamando Agente 1 (Clima) em: ${AGENT1_CLIMA_URL}/predict-optimal-hours`);
        const climaResponse = await axios.post(`${AGENT1_CLIMA_URL}/predict-optimal-hours`, { city, date });
        const { optimalHours, message: climaMessage } = climaResponse.data;

        if (!optimalHours || optimalHours.length === 0 || typeof optimalHours === 'string') {
            return res.status(404).json({
                message: climaMessage || 'Não foi possível obter horários ótimos de clima para a data e cidade fornecidas.',
                details: climaResponse.data
            });
        }

        // 2. Processar a resposta do Agente 1 para pegar a primeira previsão ótima (ou a mais relevante)
        // Para simplificar, pegaremos o primeiro horário ótimo encontrado
        const firstOptimalForecast = optimalHours[0];
        const { temperature, description: weatherDescription, time, full_datetime } = firstOptimalForecast;

        // 3. Chamar o Agente 2 (Atividades)
        console.log(`Chamando Agente 2 (Atividades) em: ${AGENT2_ATIVIDADES_URL}/recommend-activities`);
        const atividadesResponse = await axios.post(`${AGENT2_ATIVIDADES_URL}/recommend-activities`, {
            temperature,
            weatherDescription,
            activityType: preferredActivity // Passa a atividade preferida, se houver
        });
        const { recommendedActivities, justification, message: atividadesMessage } = atividadesResponse.data;

        // 4. Consolidar e retornar a resposta ao usuário
        res.json({
            status: 'success',
            requested: { city, date, preferredActivity },
            weatherRecommendation: {
                message: climaMessage,
                optimalTime: time,
                temperature: temperature,
                weatherDescription: weatherDescription,
                forecastDetails: firstOptimalForecast // Opcional: para mostrar mais detalhes da previsão
            },
            activityRecommendation: {
                message: atividadesMessage,
                activities: recommendedActivities,
                justification: justification
            },
            fullResponse: { // Opcional: para depuração
                climaResponse: climaResponse.data,
                atividadesResponse: atividadesResponse.data
            }
        });

    } catch (error) {
        console.error('Erro na orquestração da requisição:', error.message);
        if (error.response) {
            console.error('Dados do erro da resposta:', error.response.data);
            res.status(error.response.status).json({
                error: 'Erro na comunicação com os serviços internos.',
                details: error.response.data.error || error.message
            });
        } else {
            res.status(500).json({ error: 'Erro interno do servidor.' });
        }
    }
});

// Endpoint de teste simples
app.get('/status', (req, res) => {
    res.json({ status: 'API Principal Online!' });
});

app.listen(port, () => {
    console.log(`API Principal rodando na porta ${port}`);
    console.log(`Agente 1 (Clima) URL: ${AGENT1_CLIMA_URL}`);
    console.log(`Agente 2 (Atividades) URL: ${AGENT2_ATIVIDADES_URL}`);
});