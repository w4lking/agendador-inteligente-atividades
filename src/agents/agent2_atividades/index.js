// src/agents/agent2_atividades/index.js
const express = require('express');
const app = express();
const port = process.env.PORT || 3002; // Porta do Agente 2 (diferente do Agente 1)

// Middleware para parsear JSON no corpo das requisições
app.use(express.json());

// Endpoint para classificar e recomendar atividades
// Este endpoint esperará receber dados climáticos processados
app.post('/recommend-activities', (req, res) => {
    const { temperature, weatherDescription, activityType } = req.body;

    if (temperature === undefined || !weatherDescription) {
        return res.status(400).json({ error: 'Temperatura e descrição do clima são obrigatórias.' });
    }

    let recommendedActivities = [];
    let justification = '';

    // --- LÓGICA DE CLASSIFICAÇÃO DE ATIVIDADES (IA LEVE - Baseada em Regras) ---

    // Condições de Calor Extremo
    if (temperature >= 30) {
        recommendedActivities.push('Natação', 'Exercícios leves em ambientes com ar condicionado', 'Hidroginástica');
        justification = 'Devido à temperatura elevada, atividades aquáticas ou em ambientes climatizados são mais seguras.';
    }
    // Condições de Calor Moderado/Ideal
    else if (temperature >= 18 && temperature < 30) {
        if (weatherDescription.includes('chuva') || weatherDescription.includes('garoa') || weatherDescription.includes('trovoada')) {
            recommendedActivities.push('Treino em academia', 'Yoga indoor', 'Caminhada em shopping/local coberto');
            justification = 'Apesar da temperatura agradável, há previsão de chuva/garoa, sugerindo atividades em locais cobertos.';
        } else if (weatherDescription.includes('ensolarado') || weatherDescription.includes('céu limpo')) {
            recommendedActivities.push('Caminhada ao ar livre', 'Corrida em parques', 'Ciclismo', 'Piquenique');
            justification = 'Tempo ensolarado e temperatura agradável são ideais para atividades ao ar livre.';
        } else {
            // Nublado, etc.
            recommendedActivities.push('Caminhada', 'Ciclismo leve', 'Leitura em parque');
            justification = 'Condições moderadas, bom para atividades tranquilas ao ar livre.';
        }
    }
    // Condições de Frio
    else if (temperature < 18) {
        recommendedActivities.push('Caminhada vigorosa', 'Corrida', 'Esportes coletivos (futebol, basquete)', 'Academia');
        justification = 'Temperaturas mais baixas são boas para atividades que geram calor corporal ou em ambientes fechados.';
    }
    // --- FIM DA LÓGICA DE CLASSIFICAÇÃO ---

    // Adiciona uma sugestão baseada no tipo de atividade desejada (se fornecida)
    if (activityType) {
        const lowerActivityType = activityType.toLowerCase();
        if (recommendedActivities.includes(lowerActivityType) || recommendedActivities.some(a => a.toLowerCase().includes(lowerActivityType))) {
            // Se já está na lista ou similar
        } else if (lowerActivityType.includes('caminhada') || lowerActivityType.includes('corrida')) {
            if (temperature < 10) recommendedActivities.unshift('Agasalhe-se bem para caminhada/corrida!');
            else if (temperature > 28) recommendedActivities.unshift('Evite o pico do sol para caminhada/corrida!');
        }
    }

    res.json({
        message: 'Atividades recomendadas com base nas condições climáticas:',
        temperature: temperature,
        weatherDescription: weatherDescription,
        recommendedActivities: recommendedActivities.length > 0 ? recommendedActivities : ['Não foi possível encontrar atividades ideais para as condições dadas.'] ,
        justification: justification
    });
});

app.listen(port, () => {
    console.log(`Agente 2 (Atividades) rodando na porta ${port}`);
});