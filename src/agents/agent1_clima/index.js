// src/agents/agent1_clima/index.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001; // Porta para o Agente 1

app.use(express.json());

// Função AUX para formatar a data de AAAA-MM-DD para DD/MM/AAAA e mandar pro front
function formatDateToDDMMYYYY(dateString) {
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString; // Retorna a string original se não for um formato esperado
    }
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
}

app.post('/predict-optimal-hours', async (req, res) => {
    const { city, date } = req.body; // Espera receber a cidade e data (YYYY-MM-DD)

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
        const allForecasts = weatherData.list;

        const calculateOptimalityScore = (temp, description) => {
            let score = 0;
            score += 100 - Math.abs(temp - 23);

            if (description.includes('céu limpo') || description.includes('poucas nuvens')) {
                score += 50;
            } else if (description.includes('nuvens dispersas') || description.includes('nublado')) {
                score += 20;
            }

            if (description.includes('chuva') || description.includes('garoa') || description.includes('trovoada')) {
                score -= 200;
            }

            if (temp < 10 || temp > 35) {
                score -= 100;
            }

            return Math.max(0, score);
        };

        let optimalHoursToday = [];
        const requestedDateForecasts = allForecasts.filter(item =>
            item.dt_txt.startsWith(date)
        );

        requestedDateForecasts.forEach(item => {
            const temp = item.main.temp;
            const hour = new Date(item.dt * 1000).getHours();
            const weatherDescription = item.weather[0].description;
            const score = calculateOptimalityScore(temp, weatherDescription);

            if (temp >= 15 && temp <= 30 && !weatherDescription.includes('chuva') && !weatherDescription.includes('garoa') && !weatherDescription.includes('trovoada')) {
                 optimalHoursToday.push({
                    time: `${hour}:00`,
                    temperature: temp,
                    description: weatherDescription,
                    full_datetime: item.dt_txt,
                    optimalityScore: score
                });
            }
        });

        optimalHoursToday.sort((a, b) => b.optimalityScore - a.optimalityScore);

        let recommendedFutureDates = [];
        if (optimalHoursToday.length === 0) {
            const now = new Date();
            const requestedDateTime = new Date(date);

            let startCheckingDate = new Date(requestedDateTime.getTime() + (24 * 60 * 60 * 1000));
            if (startCheckingDate.getTime() < now.getTime()) {
                 startCheckingDate = new Date(now.getTime() + (24 * 60 * 60 * 1000));
            }

            for (let i = 0; i < 5; i++) {
                const checkDate = new Date(startCheckingDate.getTime() + (i * 24 * 60 * 60 * 1000));
                const formattedCheckDate = checkDate.toISOString().split('T')[0];

                const futureDateOptimalHours = [];
                const futureForecasts = allForecasts.filter(item => item.dt_txt.startsWith(formattedCheckDate));

                futureForecasts.forEach(item => {
                    const temp = item.main.temp;
                    const hour = new Date(item.dt * 1000).getHours();
                    const weatherDescription = item.weather[0].description;
                    const score = calculateOptimalityScore(temp, weatherDescription);

                    if (temp >= 15 && temp <= 30 && !weatherDescription.includes('chuva') && !weatherDescription.includes('garoa') && !weatherDescription.includes('trovoada')) {
                        futureDateOptimalHours.push({
                            time: `${hour}:00`,
                            temperature: temp,
                            description: weatherDescription,
                            full_datetime: item.dt_txt,
                            optimalityScore: score
                        });
                    }
                });

                if (futureDateOptimalHours.length > 0) {
                    futureDateOptimalHours.sort((a, b) => b.optimalityScore - a.optimalityScore);
                    recommendedFutureDates.push({
                        date: formattedCheckDate,
                        bestHour: futureDateOptimalHours[0]
                    });
                }
            }
        }

        // --- Resposta Final ---
        // Aplica a formatação da data nas mensagens antes de enviar para o frontend
        const formattedRequestedDate = formatDateToDDMMYYYY(date);

        if (optimalHoursToday.length > 0) {
            res.json({
                message: `Horários ótimos para atividades ao ar livre em ${city} em ${formattedRequestedDate}:`,
                optimalHours: optimalHoursToday,
                recommendedFutureDates: recommendedFutureDates
            });
        } else if (recommendedFutureDates.length > 0) {
             res.json({
                message: `Não foram encontrados horários ótimos para ${city} em ${formattedRequestedDate}. No entanto, encontramos opções nos próximos dias:`,
                optimalHours: [],
                recommendedFutureDates: recommendedFutureDates
            });
        }
        else {
            res.json({
                message: `Nenhum horário ótimo encontrado com base nos critérios para ${city} na data ${formattedRequestedDate} ou nos próximos dias. Considere outras opções.`,
                optimalHours: [],
                recommendedFutureDates: []
            });
        }

    } catch (error) {
        console.error('Erro ao buscar previsão do tempo:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Não foi possível obter a previsão do tempo ou calcular horários ótimos.' });
    }
});

app.listen(port, () => {
    console.log(`Agente 1 (Clima) rodando na porta ${port}`);
});