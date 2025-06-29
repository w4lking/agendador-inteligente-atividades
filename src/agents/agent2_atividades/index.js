// src/agents/agent2_atividades/index.js
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // Para carregar sua chave de API do Gemini

const app = express();
const port = process.env.PORT || 3002; // Porta do Agente 2

// Inicializa a API Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" }); // ou "gemini-1.5-pro-latest" para mais capacidade (verifique limites)

app.use(express.json());

// Endpoint para classificar e recomendar atividades
app.post('/recommend-activities', async (req, res) => {
    const { temperature, weatherDescription, activityType } = req.body;

    if (temperature === undefined || !weatherDescription) {
        return res.status(400).json({ error: 'Temperatura e descrição do clima são obrigatórias.' });
    }

    try {
        // Crie um prompt para a IA generativa
        let prompt = `Como um especialista em atividades ao ar livre, considerando as seguintes condições climáticas:
        - Temperatura: ${temperature}°C
        - Condição do tempo: ${weatherDescription}
        `;

        if (activityType) {
            prompt += `- Atividade preferida pelo usuário: ${activityType}\n`;
        }

        prompt += `
        Sugira 3-5 atividades ao ar livre mais adequadas para essas condições.
        Para cada atividade, forneça uma breve justificativa de por que ela é adequada.
        Se as condições forem ruins para atividades ao ar livre (ex: chuva forte, temperatura extrema), sugira atividades alternativas em locais cobertos ou forneça um aviso.
        Formato da resposta: uma lista numerada de atividades e justificativas.`;

        console.log('Agente 2: Enviando prompt para Gemini:', prompt);

        // Faz a chamada para a API Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        console.log('Agente 2: Resposta do Gemini:', text);

        // Opcional: tentar parsear o texto gerado em uma lista estruturada
        let recommendedActivitiesParsed = [];
        let rawRecommendationText = text;

        try {
            // Tenta extrair as atividades e justificativas do texto gerado
            // Isso pode ser complexo e exigir refinamento do prompt ou do parsing
            const lines = text.split('\n').filter(line => line.trim() !== '');
            lines.forEach(line => {
                const match = line.match(/^\d+\.\s*(.+?):?\s*(.+)$/);
                if (match) {
                    recommendedActivitiesParsed.push({
                        activity: match[1].trim(),
                        justification: match[2] ? match[2].trim() : ''
                    });
                } else {
                    // Se não conseguir parsear, adicione como uma linha de texto simples
                    recommendedActivitiesParsed.push({ activity: line.trim(), justification: '' });
                }
            });
            if (recommendedActivitiesParsed.length === 0 && text.length > 0) {
                 // Se o parsing falhou completamente mas há texto, coloque tudo como uma atividade
                 recommendedActivitiesParsed.push({ activity: text, justification: 'Gerado pela IA' });
            }
        } catch (parseError) {
            console.warn('Agente 2: Erro ao parsear resposta do Gemini, usando texto bruto.', parseError);
            recommendedActivitiesParsed = [{ activity: text, justification: 'Não foi possível estruturar a resposta da IA.' }];
        }

        res.json({
            message: 'Atividades recomendadas com base em IA generativa e condições climáticas:',
            temperature: temperature,
            weatherDescription: weatherDescription,
            // Retorna o texto bruto gerado pela IA, ou tenta retornar o parsed
            recommendedActivities: recommendedActivitiesParsed.length > 0 ? recommendedActivitiesParsed : [{activity: rawRecommendationText, justification: 'Resposta da IA não estruturada.'}]
        });

    } catch (error) {
        console.error('Agente 2: Erro ao chamar a API Gemini ou processar:', error.message);
        res.status(500).json({
            error: 'Não foi possível gerar recomendações de atividades. Erro na IA generativa.',
            details: error.message
        });
    }
});

app.listen(port, () => {
    console.log(`Agente 2 (Atividades - com Gemini IA) rodando na porta ${port}`);
});