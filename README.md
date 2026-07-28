# LP Assessoria e Cerimonial — aplicação completa

Site institucional + sistema de gestão da LP Assessoria e Cerimonial, construído em
**Next.js 14 (App Router) + TypeScript**, com **Supabase** como banco de dados/autenticação/
armazenamento de arquivos, **Framer Motion** para as animações, **ECharts** para os gráficos
do painel administrativo e **date-fns** para formatação de datas.

O site público (home) continua exatamente como antes — a mudança é que agora todo o
conteúdo (serviços, portfólio, depoimentos, FAQ) vem de um banco de dados de verdade, e
existe uma área administrativa em `/admin` para editar tudo isso sem precisar mexer em código.

---

## 1. Estrutura do projeto

```
src/
  app/
    page.tsx              → home do site público
    layout.tsx             → layout raiz (fontes, MotionConfig)
    globals.css             → todo o CSS (mesma identidade visual de antes)
    admin/
      login/page.tsx        → tela de login
      page.tsx               → dashboard (KPIs + gráficos ECharts)
      leads/page.tsx          → inbox de contatos recebidos pelo site
      portfolio/page.tsx      → upload e gestão de fotos/vídeos
      depoimentos/page.tsx    → CRUD de depoimentos
      servicos/page.tsx       → CRUD dos pacotes de serviço
      faq/page.tsx             → CRUD das perguntas frequentes
      settings/page.tsx       → telefone/e-mail/instagram exibidos no site
  components/
    site/    → componentes do site público (Hero, Sobre, Serviços, Portfólio, etc.)
    admin/   → componentes da área administrativa (sidebar, gráficos, modais)
  lib/
    supabase/  → clientes Supabase (browser, servidor, middleware)
    data.ts     → funções que buscam o conteúdo do Supabase para a home
    types.ts    → tipos TypeScript das tabelas do banco
    utils.ts    → formatação de datas (date-fns) e helpers pequenos
middleware.ts     → protege as rotas /admin/* (exige login)
supabase/
  migrations/0001_init.sql  → schema completo do banco (rode isso no Supabase)
public/
  images/  → fotos do site (as mesmas do portfólio atual)
  logo-*.png
```

---

## 2. Configurando o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com) (gratuito para começar).
2. No painel do projeto, vá em **SQL Editor** → **New query**, cole todo o conteúdo do
   arquivo `supabase/migrations/0001_init.sql` e rode. Isso cria:
   - as tabelas (`services`, `portfolio_items`, `testimonials`, `faqs`, `leads`, `site_settings`)
   - as políticas de segurança (RLS) — o público só lê o que está publicado; só quem
     estiver logado pode criar/editar/apagar
   - o bucket de Storage `portfolio`, usado para os uploads de fotos e vídeos
   - o conteúdo inicial (os mesmos textos e pacotes que já estavam no site)
3. Crie o usuário administrativo (a conta da Lia): **Authentication** → **Users** →
   **Add user** → preencha e-mail e senha, e marque **Auto Confirm User**. É esse e-mail/
   senha que serão usados para entrar em `/admin/login`.
4. Copie as chaves do projeto em **Project Settings → API**:
   - `Project URL`
   - `anon public` key
   - `service_role` key (guarde com cuidado — nunca vai para o navegador)

---

## 3. Rodando localmente

```bash
npm install
cp .env.local.example .env.local
# edite .env.local com as chaves do passo anterior
npm run dev
```

Abra `http://localhost:3000` para o site e `http://localhost:3000/admin/login` para entrar
no painel.

---

## 4. Publicando no Vercel

1. Suba este projeto para um repositório Git (GitHub, GitLab ou Bitbucket).
2. Em [vercel.com](https://vercel.com), clique em **Add New → Project** e importe o repositório.
3. Em **Environment Variables**, adicione as mesmas variáveis do `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
4. Clique em **Deploy**. Pronto — o Vercel builda e publica automaticamente a cada push.

Nada mais precisa ser configurado: o Next.js já sabe otimizar as imagens vindas do
Supabase Storage (isso está configurado em `next.config.mjs`).

---

## 5. Como usar o painel administrativo no dia a dia

- **Portfólio**: arraste fotos/vídeos direto para a área de upload. Eles já aparecem na
  galeria do site (em até 1 minuto, graças ao `revalidate` da home). Clique no ícone do
  olho para publicar/ocultar um item sem apagar, ou no ícone de lixeira para remover de vez.
- **Depoimentos**: adicione novos depoimentos a qualquer momento. Marque "destaque" para
  que apareça no card grande com fotos (como o de Endria & Davidson).
- **Serviços**: edite os pacotes, adicione ou remova itens da lista de "o que está incluso"
  usando os campos de texto — não precisa editar código.
- **FAQ**: adicione/reordene perguntas com as setinhas ↑ ↓.
- **Leads**: toda vez que alguém preenche o formulário de contato do site, aparece aqui,
  com filtro por status (novo / em contato / fechado).
- **Configurações**: altere telefone, WhatsApp, e-mail e Instagram exibidos no site sem
  precisar mexer em nenhum arquivo.

---

## 6. Notas técnicas

- **Autenticação**: usa Supabase Auth (e-mail/senha) via `@supabase/ssr`, com sessão
  guardada em cookies e renovada automaticamente pelo `middleware.ts`.
- **Segurança**: todas as tabelas têm Row Level Security ativado. Mesmo que alguém
  descubra a `anon key` (que já é pública por natureza), não consegue escrever nada —
  só o usuário autenticado pode.
- **Upload de mídia**: vai para o bucket público `portfolio` do Supabase Storage. Os
  arquivos das fotos "originais" (as que já existiam no site) continuam em `/public/images`
  e são referenciados diretamente nas linhas iniciais da tabela — pode substituí-las a
  qualquer momento pela área de portfólio.
- **Sem Bootstrap/Tailwind**: o visual usa o mesmo sistema de CSS customizado que já
  existia (variáveis de cor, tipografia, componentes), agora em `globals.css`, para manter
  a identidade visual exatamente igual à aprovada.
- **Gráficos**: `DashboardCharts.tsx` usa a biblioteca `echarts` diretamente (sem
  dependência extra de wrapper React), com um componente `<EChart>` reutilizável.

---

## 7. Próximos passos sugeridos (não implementados ainda)

- Geração automática dos tipos TypeScript do banco via
  `npx supabase gen types typescript --project-id SEU_PROJETO`
- E-mail de notificação (via Resend ou similar) toda vez que um lead novo chega
- Página pública de "álbum" por casamento (hoje o portfólio é uma galeria única)
- Múltiplos usuários administrativos com permissões diferentes
