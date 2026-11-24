# Site do chá de casa nova · Marina & Marco Túlio

Site estático (GitHub Pages, grátis) + Planilha Google como "banco" (Apps Script, grátis).

## Arquivos
- `index.html`, `assets/` — o site (porta, história, almoço, presentes com Pix, geladeira de recados, confirmação)
- `config.js` — tudo que vocês editam: data, horário, endereço, Pix, textos da história, fotos
- `admin.html` — painel do casal (convidados com link pessoal, confirmações, aprovar recados, presentes, lembretes no WhatsApp)
- `apps-script/Code.gs` — automação da planilha
- `apps-script/presentes-base.csv` — lista base de presentes pra importar na aba Presentes

## Colocar no ar (uns 15 minutos)
1. **Planilha**: crie uma Planilha Google > Extensões > Apps Script > cole `Code.gs` > salve.
2. **Propriedades do script** (engrenagem > Propriedades do script): `ADMIN_SENHA` (obrigatória), `SITE_URL`, e opcionais `EMAIL_AVISOS`, `DATA_EVENTO` (AAAA-MM-DD), `PRAZO_CONFIRMACAO` (AAAA-MM-DD), `CAPSULA_ABRE` (AAAA-MM-DD; sem ela, a cápsula abre 1 ano depois da DATA_EVENTO), `CALLMEBOT_FONE` + `CALLMEBOT_APIKEY` (aviso no WhatsApp de vocês).
3. Rode a função **configurar** uma vez e autorize. Ela cria as abas e o resumo diário por e-mail às 9h.
4. A aba **Presentes** já vem preenchida com a lista base quando você roda **configurar** (o `presentes-base.csv` fica de cópia).
5. **Implantar > Nova implantação > App da Web**, executar como "Eu", acesso "Qualquer pessoa". Copie a URL que termina em `/exec`.
6. Cole essa URL em `API_URL` no `config.js`.
7. **GitHub Pages**: crie um repositório (ex.: `casa`), envie todos os arquivos, Settings > Pages > Branch `main` / root. O site fica em `https://SEU-USUARIO.github.io/casa`.

## O que é automático
- Confirmação: grava na planilha, e-mail pra vocês a cada resposta (e WhatsApp, se o CallMeBot estiver ligado), agradecimento na tela pro convidado, formulário fecha no prazo.
- Presentes: reservou, some pra ninguém repetir; vocês recebem aviso com nome e telefone.
- Recados: chegam como "pendente", vocês recebem e-mail e aprovam no painel. Fotos vão pra uma pasta no seu Drive.
- Resumo diário por e-mail quando há recados esperando, e aviso 7 e 2 dias antes da festa pra mandar os lembretes.
- Lembretes e agradecimentos pelo WhatsApp: o painel abre cada conversa com a mensagem pronta. Envio 100% automático pros convidados exige API paga de WhatsApp.

## Depois da festa
`posFesta: true` e a lista `galeria` no `config.js` mostram o álbum. O mural continua como lembrança.
