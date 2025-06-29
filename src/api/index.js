// src/api/index.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000; // Porta da API Principal

// URLs dos Agentes (podem vir de variáveis de ambiente)
const AGENT1_CLIMA_URL = process.env.AGENT1_CLIMA_URL || 'http://agent1-clima:3001'; // 'agent1-clima' é o nome do serviço no docker-compose.yml
const AGENT2_ATIVIDADES_URL = process.env.AGENT2_ATIVIDADES_URL || 'http://agent2-atividades:3002'; // 'agent2-atividades' é o nome do serviço

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
        console.log(`API Principal: Chamando Agente 1 (Clima) para ${city} em ${date}`);
        const climaResponse = await axios.post(`${AGENT1_CLIMA_URL}/predict-optimal-hours`, { city, date });
        const { optimalHours: optimalHoursToday, recommendedFutureDates, message: climaMessage } = climaResponse.data;

        let finalWeatherRecommendation = {};
        let activitiesToRecommend = [];
        let finalJustification = '';
        let statusMessage = '';

        if (optimalHoursToday && optimalHoursToday.length > 0) {
            // Caso 1: Há horários ótimos para a data solicitada
            const bestOptimalHour = optimalHoursToday[0]; // Pega o melhor horário pela pontuação
            finalWeatherRecommendation = {
                message: `Encontramos horários ótimos para ${city} em ${date}. O melhor horário é às ${bestOptimalHour.time}.`,
                optimalTime: bestOptimalHour.time,
                temperature: bestOptimalHour.temperature,
                weatherDescription: bestOptimalHour.description,
                forecastDetails: bestOptimalHour,
                otherOptimalHoursToday: optimalHoursToday.slice(1) // Outros horários ótimos para o dia
            };
            statusMessage = 'Sucesso! Horários ótimos encontrados para a data solicitada.';

            // Chamar o Agente 2 com as condições do melhor horário
            console.log(`API Principal: Chamando Agente 2 (Atividades) para ${bestOptimalHour.temperature}°C e ${bestOptimalHour.description}`);
            const atividadesResponse = await axios.post(`${AGENT2_ATIVIDADES_URL}/recommend-activities`, {
                temperature: bestOptimalHour.temperature,
                weatherDescription: bestOptimalHour.description,
                activityType: preferredActivity
            });
            activitiesToRecommend = atividadesResponse.data.recommendedActivities;
            finalJustification = atividadesResponse.data.justification;

        } else if (recommendedFutureDates && recommendedFutureDates.length > 0) {
            // Caso 2: Não há horários ótimos para a data solicitada, mas há para dias futuros
            const firstFutureRecommendation = recommendedFutureDates[0];
            finalWeatherRecommendation = {
                message: `Não encontramos horários ótimos para ${city} em ${date}. Sugerimos opções em datas futuras.`,
                suggestedFutureDate: firstFutureRecommendation.date,
                suggestedFutureTime: firstFutureRecommendation.bestHour.time,
                temperature: firstFutureRecommendation.bestHour.temperature,
                weatherDescription: firstFutureRecommendation.bestHour.description,
                forecastDetails: firstFutureRecommendation.bestHour,
                otherFutureDates: recommendedFutureDates.slice(1) // Outras datas futuras sugeridas
            };
            statusMessage = 'Sucesso! Opções encontradas para datas futuras.';

            // Chamar o Agente 2 com as condições do melhor horário da primeira data futura
            console.log(`API Principal: Chamando Agente 2 (Atividades) para ${firstFutureRecommendation.bestHour.temperature}°C e ${firstFutureRecommendation.bestHour.description} na data futura.`);
            const atividadesResponse = await axios.post(`${AGENT2_ATIVIDADES_URL}/recommend-activities`, {
                temperature: firstFutureRecommendation.bestHour.temperature,
                weatherDescription: firstFutureRecommendation.bestHour.description,
                activityType: preferredActivity
            });
            activitiesToRecommend = atividadesResponse.data.recommendedActivities;
            finalJustification = atividadesResponse.data.justification;

        } else {
            // Caso 3: Nenhuma previsão ótima encontrada em nenhuma data próxima
            finalWeatherRecommendation = {
                message: `Não foi possível encontrar horários ótimos para atividades ao ar livre em ${city} na data ${date} ou nos próximos 5 dias. As condições climáticas podem não ser favoráveis.`,
            };
            statusMessage = 'Nenhuma opção de agendamento encontrada.';
            activitiesToRecommend = ['Sugira ao usuário que verifique as condições localmente ou tente uma data diferente.'];
            finalJustification = 'Condições climáticas não se encaixam nos critérios de otimalidade.';
        }

        // 4. Consolidar e retornar a resposta ao usuário
        res.json({
            status: statusMessage,
            requested: { city, date, preferredActivity },
            weatherRecommendation: finalWeatherRecommendation,
            activityRecommendation: {
                activities: activitiesToRecommend,
                justification: finalJustification
            },
            // Opcional: para depuração, pode incluir as respostas completas dos agentes
            // fullResponses: {
            //     clima: climaResponse.data,
            //     atividades: atividadesResponse.data
            // }
        });

    } catch (error) {
        console.error('API Principal: Erro na orquestração da requisição:', error.message);
        if (error.response) {
            console.error('API Principal: Dados do erro da resposta:', error.response.data);
            // Tenta pegar o status e a mensagem de erro do serviço interno
            res.status(error.response.status || 500).json({
                status: 'error',
                message: 'Erro na comunicação com um dos serviços internos.',
                details: error.response.data.error || error.message
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Erro interno do servidor ao processar sua requisição.'
            });
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