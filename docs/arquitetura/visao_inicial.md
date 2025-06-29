### Análise de Ameaças Iniciais

* **Ameaça:** Exposição da chave da API do OpenWeatherMap.
    * **Tipo:** Information Disclosure.
    * **Impacto:** Uso indevido da chave, excedendo limites de requisição.

* **Ameaça:** Indisponibilidade do Agente 1 (Clima).
    * **Tipo:** Denial of Service.
    * **Impacto:** O sistema não consegue obter previsões, falhando para o usuário.

* **Ameaça:** Indisponibilidade da Google Gemini API.
    * **Tipo:** Denial of Service.
    * **Impacto:** O Agente 2 não consegue gerar recomendações, e a API Principal não pode retornar uma resposta completa.

* **Ameaça:** Sobrecarga da API Principal.
    * **Tipo:** Denial of Service.
    * **Impacto:** O ponto de entrada do sistema fica inacessível, impedindo que os usuários utilizem o agendador.

* **Ameaça:** Injeção de dados maliciosos na entrada do usuário.
    * **Tipo:** Tampering, Spoofing.
    * **Impacto:** Comportamentos inesperados, falhas ou vulnerabilidades exploráveis.

* **Ameaça:** Exposição da chave da API Gemini no `docker-compose.yml` (se o repositório for público).
    * **Tipo:** Information Disclosure.
    * **Impacto:** A chave se torna pública e pode ser abusada.