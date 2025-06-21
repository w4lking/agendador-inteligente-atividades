const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3001; // Porta para o Agente 1

app.use(express.json());

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
        const allForecasts = weatherData.list; // Todas as previsões disponíveis (5 dias / 3 em 3h)

        // Função auxiliar para calcular uma "pontuação de otimalidade"
        const calculateOptimalityScore = (temp, description) => {
            let score = 0;
            // Quanto mais perto de 23°C, melhor
            score += 100 - Math.abs(temp - 23); // Max 100 (se for 23°C)

            // Condições climáticas ideais adicionam pontos
            if (description.includes('céu limpo') || description.includes('poucas nuvens')) {
                score += 50;
            } else if (description.includes('nuvens dispersas') || description.includes('nublado')) {
                score += 20;
            }

            // Condições ruins subtraem pontos significativamente
            if (description.includes('chuva') || description.includes('garoa') || description.includes('trovoada')) {
                score -= 200; // Penalidade alta para chuva
            }

            // Exemplo: penalidade para temperaturas extremas fora da faixa
            if (temp < 10 || temp > 35) {
                score -= 100; // Penalidade por estar muito frio ou muito quente
            }

            return Math.max(0, score); // Garante que a pontuação mínima é 0
        };

        // --- Lógica para encontrar horários ótimos para a DATA ESPECÍFICA ---
        let optimalHoursToday = [];
        const requestedDateForecasts = allForecasts.filter(item =>
            item.dt_txt.startsWith(date) // Filtra para a data solicitada
        );

        requestedDateForecasts.forEach(item => {
            const temp = item.main.temp;
            const hour = new Date(item.dt * 1000).getHours();
            const weatherDescription = item.weather[0].description;
            const score = calculateOptimalityScore(temp, weatherDescription);

            // Condições mínimas para ser considerado "ótimo"
            // Podemos ser menos restritivos aqui, pois o score já filtra
            if (temp >= 15 && temp <= 30 && !weatherDescription.includes('chuva') && !weatherDescription.includes('garoa') && !weatherDescription.includes('trovoada')) {
                 optimalHoursToday.push({
                    time: `${hour}:00`,
                    temperature: temp,
                    description: weatherDescription,
                    full_datetime: item.dt_txt,
                    optimalityScore: score // Inclui a pontuação
                });
            }
        });

        // Ordena os horários ótimos pela pontuação (do melhor para o pior)
        optimalHoursToday.sort((a, b) => b.optimalityScore - a.optimalityScore);

        // --- Se não encontrou horários ótimos para a data solicitada, busca em datas futuras ---
        let recommendedFutureDates = [];
        if (optimalHoursToday.length === 0) {
            const now = new Date();
            const requestedDateTime = new Date(date);

            // Evita buscar no passado ou no dia atual se já passou
            let startCheckingDate = new Date(requestedDateTime.getTime() + (24 * 60 * 60 * 1000)); // Começa a verificar do dia seguinte ao solicitado
            if (startCheckingDate.getTime() < now.getTime()) { // Se a data solicitada já passou, começa do próximo dia útil ou do dia atual
                 startCheckingDate = new Date(now.getTime() + (24 * 60 * 60 * 1000));
                 // Se o dia atual já passou (após certa hora), pode-se começar a buscar do próximo dia
            }


            for (let i = 0; i < 5; i++) { // Verifica os próximos 5 dias a partir de 'startCheckingDate'
                const checkDate = new Date(startCheckingDate.getTime() + (i * 24 * 60 * 60 * 1000));
                const formattedCheckDate = checkDate.toISOString().split('T')[0]; // YYYY-MM-DD

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
                        bestHour: futureDateOptimalHours[0] // Pega o melhor horário desse dia
                    });
                    // Opcional: Quebrar aqui se quiser apenas a primeira data futura com horários ótimos
                    // break;
                }
            }
        }


        // --- Resposta Final ---
        if (optimalHoursToday.length > 0) {
            res.json({
                message: `Horários ótimos para atividades ao ar livre em ${city} em ${date}:`,
                optimalHours: optimalHoursToday,
                recommendedFutureDates: recommendedFutureDates // Inclui futuras datas se tiver buscado
            });
        } else if (recommendedFutureDates.length > 0) {
             res.json({
                message: `Não foram encontrados horários ótimos para ${city} em ${date}. No entanto, encontramos opções nos próximos dias:`,
                optimalHours: [], // Array vazio para a data solicitada
                recommendedFutureDates: recommendedFutureDates // Lista de sugestões futuras
            });
        }
        else {
            res.json({
                message: `Nenhum horário ótimo encontrado com base nos critérios para ${city} na data ${date} ou nos próximos dias. Considere outras opções.`,
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