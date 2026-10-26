# Necromancers · site do clã

Portal do clã **Necromancers** (PokeTibia), no tema dark ghost: avisos, novidades, eventos,
sorteios comprovados (provably fair), ranking de drops por temporada com premiação e lista de membros.

Mesma stack do kit `site-next-supabase-kit`: **Next 16 (App Router) + React 19 + Tailwind 4 +
Supabase + NextAuth (Discord) + Vercel**. O navegador nunca decide nada importante: toda escrita e
todo sorteio passam por uma rota `/api` que confere quem está chamando e usa a service role do Supabase.

## O que tem

| Página | O que faz |
|---|---|
| `/` | Hero, aviso fixado, últimas novidades, sorteio aberto, top 5 da temporada |
| `/avisos` | Mural de avisos, novidades e eventos (com data) |
| `/sorteios` | Sorteios abertos e passados; membro ativo entra com 1 clique (1 chance por pessoa) |
| `/ranking` | Pódio com prêmios, tabela, histórico de temporadas, envio de drop com print, tabela de pontos |
| `/membros` | Membros ativos agrupados por cargo |
| `/perfil` | Cadastro no clã (personagem + level) e "meus drops" |
| `/provably-fair` | Registro público dos sorteios e verificação da conta no navegador (drand) |
| `/admin` | Painel da liderança: aprovar drops (vê o print), aprovar membros e mudar cargos, publicar avisos, criar e sortear sorteios (roleta), temporadas e itens que pontuam |

### Como funciona o ranking
1. A liderança cadastra os **itens que valem pontos** (nome, raridade, pontos) e a **temporada** (datas + prêmios do 1º, 2º, 3º…).
2. O membro registra o drop em `/ranking`: escolhe o item, a quantidade e anexa o print (comprimido no navegador; fica num bucket **privado**).
3. A liderança aprova ou recusa no painel. Só drops aprovados contam: pontos = pontos do item × quantidade.
4. No fim, a liderança encerra a temporada e cria a próxima. As antigas continuam visíveis em `/ranking`.

### Como funciona o sorteio
Inscrição: só membros **ativos**, 1 chance cada. Ao clicar em **Sortear** no painel, as inscrições fecham,
a lista é congelada com hash SHA-256 e o ganhador sai de uma rodada futura do [drand](https://drand.love)
(número público que ninguém conhece antes). A roleta só anima o resultado. Qualquer pessoa pode refazer a
conta em `/provably-fair`.

## Rodar sem configurar nada (modo demonstração)

```bash
npm install
npm run dev
```

Sem as variáveis do Supabase, o site abre com **dados de exemplo** e uma faixa amarela avisando. Nada é salvo.

## Configurar de verdade

### 1. Supabase
1. Crie um projeto em [supabase.com](https://supabase.com).
2. **SQL Editor** → cole e rode `supabase/schema.sql` (cria tabelas, buckets `imagens` e `provas` e a Temporada 1).
3. **Project Settings → API**: copie a URL e a `service_role` key.

### 2. Discord (login)
1. [discord.com/developers/applications](https://discord.com/developers/applications) → **New Application**.
2. **OAuth2** → copie Client ID e Client Secret.
3. **Redirects**: adicione `http://localhost:3000/api/auth/callback/discord` e `https://SEU-SITE/api/auth/callback/discord`.

### 3. Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha:

| Variável | De onde vem |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → API (secreta, só no servidor) |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | `http://localhost:3000` (local) / URL do site (produção) |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord Developer Portal |
| `ADMIN_DISCORD_IDS` | Seu ID do Discord (Configurações → Avançado → Modo desenvolvedor → botão direito no seu nome → Copiar ID). Vários separados por vírgula |

Quem está em `ADMIN_DISCORD_IDS` entra direto como **líder ativo** ao se cadastrar em `/perfil`.
Depois disso, quem for promovido a **líder** ou **vice** no painel também ganha acesso ao `/admin`.

### 4. Deploy na Vercel
1. Importe o repositório na Vercel.
2. Cole as variáveis acima em **Settings → Environment Variables** (com `NEXTAUTH_URL` = URL do site).
3. O `vercel.json` já agenda o `/api/keepalive` todo dia, pra o Supabase grátis não pausar por inatividade.

## Estrutura

```
src/app/            páginas e rotas /api (admin, drops, sorteios, me, provably-fair, keepalive)
src/components/     visual (navbar, cards, pódio, roleta, painel admin)
src/lib/            dados (data.ts), sessão (viewer.ts), sorteio (fair*.ts), demo.ts
supabase/schema.sql banco (idempotente: pode rodar de novo sem perder dados)
```
