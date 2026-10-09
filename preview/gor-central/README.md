# GOR Central — prévia interativa

Esta prévia é um **protótipo de interface**, independente do Next.js e do Supabase. Não tem login de produção, banco, IA ou integração real com YouTube/Instagram. A partir desta versão, o servidor exige usuário e senha temporários de demonstração. **Não exponha diretamente à internet.** O servidor Node escuta somente em `127.0.0.1`.

## Testar em ambiente isolado

No servidor Ubuntu (sem sudo, sem reiniciar serviços):

```bash
git clone --filter=blob:none --no-checkout --single-branch --branch feature/gor-central https://github.com/gorio/deskcomm.git "$HOME/gorcentral-preview"
cd "$HOME/gorcentral-preview"
git sparse-checkout init --cone
git sparse-checkout set preview/gor-central
git checkout feature/gor-central
read -r -p 'Usuario da previa: ' GOR_PREVIEW_USER\nread -r -s -p 'Senha da previa (minimo 16 caracteres): ' GOR_PREVIEW_PASSWORD\necho\nexport GOR_PREVIEW_USER GOR_PREVIEW_PASSWORD\nnode preview/gor-central/server.mjs
```

A aplicação escuta em `127.0.0.1:41040`. Em outro terminal do seu computador, abra túnel SSH (ajuste o host conforme seu acesso):

```bash
ssh -N -L 41040:127.0.0.1:41040 gorio@186.232.81.19
```

Abra `http://localhost:41040` no computador que iniciou o túnel. Caso a porta local 41040 já esteja ocupada, substitua **somente a primeira porta** do `-L` por outra disponível, como `51040`, e abra `http://localhost:51040`.

## Funcionalidades demonstrativas

- Visão geral com indicadores.
- Cadastro de publicações de exemplo e fluxo de revisão/aprovação/agendamento simulado.
- Calendário ordenado por data.
- Comentários fictícios com aprovação simulada de respostas.
- Persistência local no navegador e restauração dos exemplos.

**Não use dados sensíveis** nesta prévia: os registros ficam no `localStorage` do navegador, sem criptografia ou sincronização entre dispositivos.

## Próximas fases

Implementar autenticação e MFA reais, Supabase isolado, APIs de publicação, workers de agendamento, controle de acesso e testes. A prévia não substitui essas etapas.

## Atualizar uma instalação de teste existente

Pare apenas o processo Node da prévia com `Ctrl+C` no terminal em que ela está rodando. No diretório `$HOME/gorcentral-preview`, execute `git pull --ff-only` e inicie novamente com as variáveis `GOR_PREVIEW_USER` e `GOR_PREVIEW_PASSWORD` definidas sem colocá-las na linha de comando ou no histórico.

A autenticação Basic é uma **barreira temporária** para testar a interface, não substitui contas individuais, MFA, RBAC ou uma configuração HTTPS. Não configure o Apache para expor a prévia antes de TLS, controle de acesso e serviço isolado estarem validados. Em HTTP local, use apenas o túnel SSH.
