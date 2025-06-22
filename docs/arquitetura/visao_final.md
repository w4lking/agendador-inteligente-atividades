### Medidas de Mitigação Implementadas

* **Ameaça:** Exposição da chave da API do OpenWeatherMap.
    * **Mitigação:** Utilização de variáveis de ambiente (`.env` e `process.env`) para armazenar a chave da API, evitando que ela seja hardcoded no código-fonte e comprometida no controle de versão. No Docker, o arquivo `.env` é montado de forma segura.
* **Ameaça:** Indisponibilidade do Agente 1 (Clima).
    * **Mitigação:** Implementação de tratamento de erros (`try-catch` com `axios`) na API Principal para lidar com falhas de comunicação com o Agente 1, retornando uma mensagem de erro apropriada ao usuário em vez de quebrar o sistema. Considerar retries para chamadas a serviços externos (futuro aprimoramento).