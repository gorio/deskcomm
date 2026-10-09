# GOR Central — Plano de adaptação (fase 1)

Status: planejamento técnico; nenhuma implantação realizada.

## Objetivo

Criar o GOR Central como aplicação privada e independente para Golf Oscar Romeo® Aviação, hospedada em `central.golfoscarromeo.com.br`, adaptando o DeskcommCRM sem interferir no site principal ou nas transmissões.

## Ambiente alvo

- Repositório: `gorio/deskcomm`; branch de desenvolvimento: `feature/gor-central`.
- Diretório: `/srv/modonorte/sites/gorcentral`, com `app/`, `shared/`, `logs/` e `backups/`.
- Usuário Unix: `site_gorcentral`; serviço: `gorcentral`.
- Porta de aplicação: `127.0.0.1:41040`; Apache existente faz o proxy HTTPS.
- Banco, contas, segredos e storage exclusivos do GOR Central. Não compartilhar credenciais com Post Fácil, WhatsApp ou outros projetos.
- DNS A confirmado para o host planejado; emissão e validação de TLS ainda pendentes.

## Escopo funcional

1. Painel de gestão de publicações, biblioteca de mídia e calendário editorial.
2. Integração YouTube via OAuth e APIs oficiais; uploads e publicação exigem aprovação explícita.
3. Integração Instagram profissional via Meta OAuth/APIs oficiais; respeitar permissões, limites e requisitos da conta.
4. Central de comentários com sincronização incremental e respostas sugeridas por IA, **nunca enviadas sem aprovação humana**.
5. Auditoria de alterações, agendamentos, tentativas e resultados de publicação.

## Segurança e autenticação

- Somente Eduardo e Carolina no lançamento; cadastro público desabilitado em **página, API, convite e políticas do provedor de autenticação**, não apenas ocultado na interface.
- MFA TOTP obrigatório para administradores, com recuperação segura.
- Sessões seguras, controle de acesso em cada API, rate limit em autenticação e trilha de auditoria.
- Tokens OAuth criptografados em repouso, com escopos mínimos, revogação e renovação controladas; não armazenar tokens em logs ou Git.
- Operações de publicação, respostas e jobs começam desativadas até homologação.

## Decisões técnicas antes de implantar

O Deskcomm atual usa Supabase Auth, Postgres com RLS, Realtime e Storage. O PostgreSQL 16 local, sozinho, **não substitui** esse conjunto. Escolher e validar uma instalação Supabase dedicada ou adaptar explicitamente essas dependências antes de subir o app.

O `db:migrate` do package.json é placeholder; validar e aplicar migrações de `supabase/migrations/` por processo real e reversível.

Não executar `docker-compose.prod.yml` original: ele inclui Caddy nas portas 80/443 e serviços WAHA/worker/scheduler fora do escopo inicial.

Usar `pnpm@9.15.9` do projeto via Corepack sem alterar o gerenciador global do servidor.

O provisionador Modo Norte passou em `check --no-db --no-build`, mas seu `apply` **não está autorizado** até revisão de unidade systemd, comando de inicialização, autenticação, banco e proxy.

## Ordem de execução

1. Inventariar fluxos de login/signup, dependências Supabase e rotas relevantes; documentar incompatibilidades.
2. Implementar configuração de marca, RBAC/allowlist, MFA obrigatório e bloqueio de signup com testes.
3. Definir infraestrutura Supabase isolada, migrações, backup e storage.
4. Implementar módulos de publicações e comentários com adaptadores oficiais e testes em modo sem envio.
5. Criar implantação específica para Apache/loopback, healthcheck e preview privado.
6. Validar build, testes, segurança, permissões, DNS/TLS e apenas então liberar uso real.

## Critérios de aceite

- Dois administradores autorizados; terceiro usuário e signup público bloqueados.
- Nenhuma ação de publicar/responder sem aprovação registrada.
- Falha em integração externa não derruba o painel nem interfere nos demais sites.
- Backups e recuperação testados; logs sem segredos.
- HTTPS válido; aplicação não acessível diretamente pela porta interna.
- Serviços existentes intactos.
