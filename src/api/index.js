// src/api/index.js
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const Joi = require('joi'); // Importa o Joi
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

const AGENT1_CLIMA_URL = process.env.AGENT1_CLIMA_URL || 'http://agent1-clima:3001';
const AGENT2_ATIVIDADES_URL = process.env.AGENT2_ATIVIDADES_URL || 'http://agent2-atividades:3002';

app.use(cors());
app.use(express.json());

// ---------------------------------------------------
// SCHEMA DE VALIDAÇÃO DE ENTRADA COM JOI
// ---------------------------------------------------
const scheduleActivitySchema = Joi.object({
    city: Joi.string()
        .min(2) // Cidade deve ter no mínimo 2 caracteres
        .max(50) // Cidade deve ter no máximo 50 caracteres
        .required() // Cidade é obrigatória
        .messages({ // Mensagens de erro personalizadas
            'string.base': 'A cidade deve ser um texto.',
            'string.min': 'A cidade deve ter no mínimo {#limit} caracteres.',
            'string.max': 'A cidade deve ter no máximo {#limit} caracteres.',
            'string.empty': 'A cidade não pode ser vazia.',
            'any.required': 'A cidade é obrigatória.'
        }),
    date: Joi.string()
        .pattern(/^\d{4}-\d{2}-\d{2}$/) // Formato AAAA-MM-DD
        .required() // Data é obrigatória
        .messages({
            'string.base': 'A data deve ser um texto.',
            'string.pattern.base': 'A data deve estar no formato AAAA-MM-DD.',
            'string.empty': 'A data não pode ser vazia.',
            'any.required': 'A data é obrigatória.'
        }),
    preferredActivity: Joi.string()
        .max(100) // Atividade preferida no máximo 100 caracteres
        .optional() // Atividade preferida é opcional
        .allow('') // Permite string vazia se for opcional
        .messages({
            'string.base': 'A atividade preferida deve ser um texto.',
            'string.max': 'A atividade preferida deve ter no máximo {#limit} caracteres.'
        })
});
// ---------------------------------------------------


// Endpoint principal para o agendamento inteligente
app.post('/schedule-activity', async (req, res) => {
    // Valida a entrada do utilizador com o schema Joi
    const { error, value } = scheduleActivitySchema.validate(req.body);

    if (error) {
        // Se houver erro de validação, retorna 400 Bad Request
        return res.status(400).json({
            status: 'error',
            message: 'Dados de entrada inválidos.',
            details: error.details.map(d => d.message).join('; ') // Retorna todas as mensagens de erro
        });
    }

    // Se a validação for bem-sucedida, use 'value' que contém os dados validados e limpos
    const { city, date, preferredActivity } = value;

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
            const bestOptimalHour = optimalHoursToday[0];
            finalWeatherRecommendation = {
                message: `Encontramos horários ótimos para ${city} em ${date}. O melhor horário é às ${bestOptimalHour.time}.`,
                optimalTime: bestOptimalHour.time,
                temperature: bestOptimalHour.temperature,
                weatherDescription: bestOptimalHour.description,
                forecastDetails: bestOptimalHour,
                otherOptimalHoursToday: optimalHoursToday.slice(1)
            };
            statusMessage = 'Sucesso! Horários ótimos encontrados para a data solicitada.';

            console.log(`API Principal: Chamando Agente 2 (Atividades) para ${bestOptimalHour.temperature}°C e ${bestOptimalHour.description}`);
            const atividadesResponse = await axios.post(`${AGENT2_ATIVIDADES_URL}/recommend-activities`, {
                temperature: bestOptimalHour.temperature,
                weatherDescription: bestOptimalHour.description,
                activityType: preferredActivity
            });
            activitiesToRecommend = atividadesResponse.data.recommendedActivities;
            finalJustification = atividadesResponse.data.justification;

        } else if (recommendedFutureDates && recommendedFutureDates.length > 0) {
            const firstFutureRecommendation = recommendedFutureDates[0];
            finalWeatherRecommendation = {
                message: `Não encontramos horários ótimos para ${city} em ${date}. Sugerimos opções em datas futuras.`,
                suggestedFutureDate: firstFutureRecommendation.date,
                suggestedFutureTime: firstFutureRecommendation.bestHour.time,
                temperature: firstFutureRecommendation.bestHour.temperature,
                weatherDescription: firstFutureRecommendation.bestHour.description,
                forecastDetails: firstFutureRecommendation.bestHour,
                otherFutureDates: recommendedFutureDates.slice(1)
            };
            statusMessage = 'Sucesso! Opções encontradas para datas futuras.';

            console.log(`API Principal: Chamando Agente 2 (Atividades) para ${firstFutureRecommendation.bestHour.temperature}°C e ${firstFutureRecommendation.bestHour.description} na data futura.`);
            const atividadesResponse = await axios.post(`${AGENT2_ATIVIDADES_URL}/recommend-activities`, {
                temperature: firstFutureRecommendation.bestHour.temperature,
                weatherDescription: firstFutureRecommendation.bestHour.description,
                activityType: preferredActivity
            });
            activitiesToRecommend = atividadesResponse.data.recommendedActivities;
            finalJustification = atividadesResponse.data.justification;

        } else {
            finalWeatherRecommendation = {
                message: `Não foi possível encontrar horários ótimos para atividades ao ar livre em ${city} na data ${date} ou nos próximos 5 dias. As condições climáticas podem não ser favoráveis.`,
            };
            statusMessage = 'Nenhuma opção de agendamento encontrada.';
            activitiesToRecommend = ['Sugira ao utilizador que verifique as condições localmente ou tente uma data diferente.'];
            finalJustification = 'Condições climáticas não se encaixam nos critérios de otimalidade.';
        }

        res.json({
            status: statusMessage,
            requested: { city, date, preferredActivity },
            weatherRecommendation: finalWeatherRecommendation,
            activityRecommendation: {
                activities: activitiesToRecommend,
                justification: finalJustification
            },
        });

    } catch (error) {
        console.error('API Principal: Erro na orquestração da requisição:', error.message);
        if (error.response) {
            console.error('API Principal: Dados do erro da resposta:', error.response.data);
            res.status(error.response.status || 500).json({
                status: 'error',
                message: 'Erro na comunicação com um dos serviços internos.',
                details: error.response.data.error || error.message
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Erro interno do servidor ao processar a requisição.'
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
