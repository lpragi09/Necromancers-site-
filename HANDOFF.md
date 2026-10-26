# Passagem de bastão: site do clã Necromancers

Para o próximo agente (Claude Code rodando **local** no PC do Luiz Paulo, com Claude in Chrome).
Leia tudo antes de agir. Responda sempre em português, direto ao ponto.

## Quem e o quê
- Dono: Luiz Paulo (GitHub **lpragi09**, e-mail lpmragi@gmail.com).
- Projeto: portal do clã **Necromancers**, uma guild de PokeTibia (Tibia online de Pokémon). Site interativo pros membros
  acompanharem sorteios, o ranking de drops com premiação no fim da temporada, avisos, novidades e eventos.
- Tema visual: **dark ghost** (preto-violeta, névoa animada, fantasminhas subindo, brilho verde-ectoplasma, títulos em Cinzel).
- Base: skill pessoal `site-next-supabase-kit` (mesma stack do site Barr4k). Regra central dela: **o navegador nunca decide
  nada importante**. Toda escrita e todo sorteio passam por rota `/api` que confere quem chama e usa a service role do Supabase.
- Regras da skill que valem aqui:
  - Commit só como `Luiz Paulo <lpmragi@gmail.com>`, **sem atribuição de IA**.
  - Quem cola chave em painel ou formulário é o usuário, nunca o agente. **Nunca commitar chaves.**
  - SQL novo vai num arquivo `supabase/migracao-*.sql` idempotente, e o usuário roda no SQL Editor. Não subir código que depende de tabela nova antes disso.
  - Depois do push, conferir no site publicado.

## Onde está
- Repo: https://github.com/lpragi09/Necromancers-site- (branch `main`). Primeiro commit: `b4d5008`.
- Vercel: projeto **necromancers** na conta "luiz-paulo-moreno-ragis-projects". URL: **https://necromancers.vercel.app**.
  Já ligado ao GitHub: push na `main` gera deploy.
- Supabase: projeto ref `regefsgxvvokmcyasccw` (URL `https://regefsgxvvokmcyasccw.supabase.co`).
  O usuário **já rodou** o `supabase/schema.sql`.
- O repo `Site-Gordinho` (loja de tabacaria) é **outro projeto**. Não mexer nele.

## Stack
Next **16.4** (App Router; `params`/`searchParams` são Promise) + React 19 + Tailwind **4** (`@theme` em `globals.css`, sem
tailwind.config) + Supabase (`@supabase/supabase-js`, service role só no servidor) + NextAuth v4 com **Discord** + Vercel.
Sem as variáveis do Supabase, o site roda em **modo demonstração**: dados de `src/lib/demo.ts` e uma faixa amarela no topo.

## O que já foi feito
| Área | Arquivos |
|---|---|
| Home (hero, aviso fixado, novidades, sorteio aberto, top 5, chamada pra drop) | `src/app/page.tsx` |
| Avisos, novidades e eventos | `src/app/avisos`, `components/PostCard.tsx` |
| Sorteios (membro ativo entra com 1 clique, 1 chance cada) | `src/app/sorteios`, `components/GiveawayCard.tsx`, `JoinButton.tsx`, `api/sorteios` |
| Provably fair (drand, lista congelada com SHA-256, verificação no navegador) | `lib/fair.ts`, `lib/fairServer.ts`, `api/provably-fair`, `app/provably-fair`, `components/ProvablyFair.tsx` |
| Ranking de drops por temporada (pódio com prêmios, tabela, temporadas antigas, envio com print) | `app/ranking`, `components/RankingTable.tsx`, `DropForm.tsx`, `api/drops` |
| Membros por cargo (líder, vice, veterano, membro, recruta) | `app/membros` |
| Perfil (cadastro do personagem; fica pendente até a liderança aprovar) | `app/perfil`, `api/me` |
| Painel `/admin`: aprovar drops vendo o print, aprovar membros e mudar cargos, avisos, sorteios com roleta, temporadas, itens que pontuam | `components/admin/AdminPanel.tsx`, `GiveawayDraw.tsx`, `api/admin/route.ts` (uma rota com `switch(action)`) |
| Sessão e permissão | `lib/viewer.ts` (`getViewer`), `lib/admins.ts`, `lib/auth.ts` |
| Banco | `supabase/schema.sql`: tabelas members, posts, seasons, drop_items, drops, giveaways, giveaway_entries, fair_draws (RLS ligado, sem policy pública); buckets `imagens` (público) e `provas` (privado); Temporada 1 |
| Keepalive do Supabase grátis | `api/keepalive` + `vercel.json` (cron diário) |

Quem é admin: IDs em `ADMIN_DISCORD_IDS` (entram como líder ativo ao se cadastrar em /perfil), mais qualquer membro ativo
com cargo `lider` ou `vice`.

Regras de negócio que foram **escolhidas sem confirmar com o dono** (perguntar se ele quiser mudar):
- Sorteio: 1 chance por membro ativo.
- Ranking: pontos do item × quantidade, contando só drops aprovados.
- Só uma temporada ativa por vez: ativar uma encerra as outras.

## PENDENTE (fazer nesta ordem)

### 1. ~~Corrigir o erro de 100% em produção~~ (FEITO, já no GitHub)
O deploy dava 500 (`[next-auth][error][NO_SECRET]`) porque sem `NEXTAUTH_SECRET` o `getServerSession` lança erro em produção.
`getViewer()` em `src/lib/viewer.ts` agora retorna `null` sem a variável (o site funciona, só sem login). Testado:
antes 500, depois todas as páginas 200. O push na `main` já disparou um deploy novo na Vercel.

### 2. Criar o app do Discord (com o usuário, pelo Claude in Chrome)
- https://discord.com/developers/applications → New Application ("Necromancers").
- OAuth2 → Redirects: `https://necromancers.vercel.app/api/auth/callback/discord` e `http://localhost:3000/api/auth/callback/discord`.
- Pegar Client ID e Client Secret. **Quem cola o secret na Vercel é o usuário.**
- O ID do Discord do usuário (pra `ADMIN_DISCORD_IDS`): Configurações → Avançado → Modo desenvolvedor → botão direito no nome → Copiar ID.

### 3. Variáveis de ambiente na Vercel
Projeto necromancers → Settings → Environment Variables (Production, Preview e Development):

| Name | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://regefsgxvvokmcyasccw.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | chave **service_role** (o usuário tem; é o JWT com `"role":"service_role"`) |
| `NEXTAUTH_SECRET` | o usuário já gerou (32 caracteres hex) |
| `NEXTAUTH_URL` | `https://necromancers.vercel.app` |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | do passo 2 |
| `ADMIN_DISCORD_IDS` | ID do Discord do usuário |

Depois: Deployments → ⋯ → Redeploy.
Segurança: a service_role foi colada num chat. Depois que tudo funcionar, sugerir **gerar uma nova** no Supabase
(Settings → API) e trocar na Vercel.

### 4. Conferir no ar
- A faixa amarela de "modo demonstração" sumiu, então o Supabase conectou.
- Login com Discord funciona; em /perfil, cadastrar o personagem do usuário; ele vira líder e aparece "Painel" no menu.
- No painel: cadastrar os itens que valem pontos (aba "Temporadas & itens"), ajustar nome, datas e prêmios da Temporada 1,
  publicar um aviso de boas-vindas.
- Testar um sorteio de ponta a ponta (a Vercel precisa alcançar `api.drand.sh`; o sorteio leva de 3 a 7 s).

### Ideias pro futuro (só se o usuário pedir)
Página de eventos com calendário, galeria de prints dos drops aprovados, avisos indo também pro Discord por webhook,
chances do sorteio por cargo ou por pontos do ranking, domínio próprio.
