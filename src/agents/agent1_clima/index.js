const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001; // Porta para o Agente 1

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Endpoint para simular a previsão e recomendação de horários
app.post('/predict-optimal-hours', async (req, res) => {
    const { city, date } = req.body; // Espera receber a cidade e data

    if (!city || !date) {
        return res.status(400).json({ error: 'Cidade e data são obrigatórias.' });
    }

    try {
        const apiKey = process.env.OPENWEATHER_API_KEY;

        const weatherResponse = await axios.get('http://api.openweathermap.org/data/2.5/forecast', {
            params: {
                q: city,
                appid: apiKey,
                units: 'metric',
                lang: 'pt_br'
            }
        });

        const weatherData = weatherResponse.data;

        // --- LÓGICA DO SEU MODELO DE IA LEVE AQUI ---
        // console.log('Dados da Previsão Completa:', JSON.stringify(weatherData, null, 2)); // Use para ver a estrutura completa da resposta

        const optimalHours = [];
        // Filtra os dados para a data específica e itera sobre a lista de previsões
        const relevantForecasts = weatherData.list.filter(item =>
            item.dt_txt.startsWith(date) // Filtra pela data recebida (ex: '2025-06-15')
        );

        if (relevantForecasts.length === 0) {
            return res.json({
                message: `Nenhuma previsão encontrada para a data ${date} em ${city}.`,
                optimalHours: []
            });
        }

        relevantForecasts.forEach(item => {
            const temp = item.main.temp;
            const hour = new Date(item.dt * 1000).getHours(); // Pega a hora do timestamp
            const weatherDescription = item.weather[0].description;

            // Lógica para determinar horários ótimos (pode ser aprimorada)
            if (temp >= 18 && temp <= 28 && !weatherDescription.includes('chuva') && !weatherDescription.includes('garoa')) {
                optimalHours.push({
                    time: `${hour}:00`,
                    temperature: temp,
                    description: weatherDescription,
                    full_datetime: item.dt_txt // Para facilitar a visualização
                });
            }
        });
        // --- FIM DA LÓGICA DO MODELO ---

        res.json({
            message: `Sugestões de horários ótimos para atividades ao ar livre em ${city} em ${date}:`,
            optimalHours: optimalHours.length > 0 ? optimalHours : 'Nenhum horário ótimo encontrado com base nos critérios para esta data. Considere outras opções.'
        });

    } catch (error) {
        console.error('Erro ao buscar previsão do tempo:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Não foi possível obter a previsão do tempo ou calcular horários ótimos.' });
    }
});

app.listen(port, () => {
    console.log(`Agente 1 (Clima) rodando na porta ${port}`);
});