
const express = require('express');
const axios = require('axios');
require('dotenv').config(); // é as variáveis de ambiente do .env/ não to usando ainda, tem que pegar na api de clima ainda https://openweathermap.org/api

const app = express();
const port = process.env.PORT || 3001; // Porta para o Agente 1

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Aqui é um Endpoint para simular a previsão e recomendação de horários // em ingles pra padronizar os nomes dos endpoints
app.post('/predict-optimal-hours', async (req, res) => {
    const { city, date } = req.body; // Essa constante so espera cidade e data

    if (!city || !date) {
        return res.status(400).json({ error: 'Cidade e data são obrigatórias.' });
    }

    try {
        // Para chamar a API externa de clima (OpenWeatherMap)
        // Tem que substituir com a chave de API // To mandando isso pro github mas quando tiver com a chavee tem que ocultar
        const apiKey = process.env.OPENWEATHER_API_KEY;
        const weatherResponse = await axios.get(
            `http://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${apiKey}&units=metric&lang=pt_br`
        );
        const weatherData = weatherResponse.data;

        // --- LÓGICA DO MODELO DE IA BEM LEVE ---
        // Exemplo simples: Encontrar horários com temperatura entre 18°C e 28°C
        const optimalHours = [];
        // Filtra os dados para a data específica
        const relevantForecasts = weatherData.list.filter(item =>
            item.dt_txt.startsWith(date) // 'YYYY-MM-DD'
        );

        relevantForecasts.forEach(item => {
            const temp = item.main.temp;
            const hour = new Date(item.dt * 1000).getHours(); // Pega a hora
            const weatherDescription = item.weather[0].description;

            if (temp >= 18 && temp <= 28 && !weatherDescription.includes('chuva')) {
                optimalHours.push({
                    time: `${hour}:00`,
                    temperature: temp,
                    description: weatherDescription
                });
            }
        });
        // --- FIM DA LÓGICA DO MODELO ---

        res.json({
            message: `Horários ótimos para atividades ao ar livre em ${city} em ${date}:`,
            optimalHours: optimalHours.length > 0 ? optimalHours : 'Nenhum horário ótimo encontrado com base nos critérios.'
        });

    } catch (error) {
        console.error('Erro ao buscar previsão do tempo:', error.response ? error.response.data : error.message);
        res.status(500).json({ error: 'Não foi possível obter a previsão do tempo ou calcular horários ótimos.' });
    }
});

app.listen(port, () => {
    console.log(`Agente 1 (Clima) rodando na porta ${port}`);
});