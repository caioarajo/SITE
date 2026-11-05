# Contexto do Projeto — LP Assessoria e Cerimonial

> Este arquivo existe para que qualquer pessoa (ou qualquer sessão futura do Claude)
> consiga continuar este projeto sem precisar reconstruir o histórico de decisões do
> zero. Sempre que fizer uma mudança relevante, atualize este arquivo.

## O que é este projeto

Site institucional da LP Assessoria e Cerimonial (cerimonialista/assessora de eventos em
Manaus, AM — Lia Pontes), que evoluiu de um site estático em HTML para uma aplicação
completa em Next.js com painel administrativo e banco de dados no Supabase.

**Histórico**: o site nasceu como uma landing page estática (HTML/CSS/JS puro), construída
a partir do portfólio em PDF/PPTX da cliente. Depois de várias rodadas de ajuste visual
(logo, cores, animações, carrossel testado e revertido para grade de fotos), a cliente
pediu a transformação em uma aplicação de verdade — daí o stack atual.

## Stack técnico (decisões e por quê)

| Peça | Escolha | Por quê |
|---|---|---|
| Framework | Next.js 14, App Router | Pedido explícito da cliente; App Router é o padrão atual |
| Linguagem | TypeScript | Pedido explícito |
| Banco/Auth/Storage | Supabase | Pedido explícito; Postgres + RLS + Auth + Storage tudo junto |
| Animações | Framer Motion | Pedido explícito — só faz sentido com React (daí a migração do HTML puro) |
| Gráficos (admin) | ECharts (direto, sem wrapper) | Pedido explícito |
| Datas | date-fns | Pedido explícito |
| CSS | CSS puro (`globals.css`), sem Tailwind/Bootstrap | Já existia um design system customizado aprovado pela cliente em várias rodadas de feedback; Bootstrap foi pedido em algum momento mas **recusado conscientemente** (conflitaria com o design já aprovado) — ver seção "Decisões recusadas" abaixo |
| Deploy alvo | Vercel | Pedido explícito |

## Decisões recusadas (e por quê — importante não reverter sem avisar a cliente)

- **Bootstrap**: pedido em algum momento junto com Framer Motion. Foi recusado
  explicitamente porque o site já tinha (e tem) um sistema de design customizado
  totalmente aprovado pela cliente ao longo de várias iterações — sobrepor Bootstrap
  significaria ou conflito visual ou reescrever tudo por cima, sem ganho real.
- **Carrossel de imagens no portfólio**: foi implementado a pedido da cliente, depois
  explicitamente revertido de volta para a grade de fotos (mosaico) porque a rolagem
  automática atrapalhava a leitura do resto do site. **Não reintroduzir carrossel sem
  confirmação explícita.**

## Estrutura de dados (Supabase)

Ver `supabase/migrations/0001_init.sql` para o schema completo e comentado. Resumo:

- `services` — os 3 pacotes (Intermediário, Completo, Cerimonial do Dia). `is_featured`
  controla qual aparece com o selo "Mais completo". `features` é um array de texto.
- `portfolio_items` — fotos/vídeos da galeria. `media_type` é `'image'` ou `'video'`.
  Os 7 itens iniciais apontam para `/public/images/portfolio-0X.jpg` (arquivos estáticos);
  itens novos, cadastrados pelo admin, vão para o Supabase Storage (bucket `portfolio`).
- `testimonials` — depoimentos. Só um deve ter `is_featured = true` por vez (o card
  grande com duas fotos circulares — hoje é "Endria & Davidson").
- `faqs` — perguntas frequentes, ordenadas por `display_order`.
- `leads` — envios do formulário de contato do site. Status: `novo` → `em_contato` →
  `fechado`.
- `site_settings` — chave/valor simples (`phone`, `whatsapp`, `email`, `instagram`).

**Row Level Security**: público (anon) só lê linhas com `is_published = true` (exceto
`leads`, que o público só consegue INSERIR, nunca ler). Escrita nas tabelas de conteúdo
exige o papel `admin` ou `usuario_avancado` (ver `profiles` abaixo); `site_settings` é
exclusivo de `admin`.

- `profiles` — um usuário do painel (nome, `role`: `admin` | `usuario_avancado` |
  `cliente`, `is_active`, `must_change_password`). Ver `supabase/migrations/0002_user_management.sql`.
  Gerenciado inteiramente por `/admin/usuarios` (só visível para `admin`) e pelas rotas
  `src/app/api/admin/users/*`, que usam a Service Role Key — o navegador nunca cria,
  edita ou desativa usuário diretamente. O papel `cliente` está reservado no schema/
  formulário mas ainda não tem área própria (cai em `/admin/sem-acesso`): este app não
  tem hoje nenhum dado "por cliente" (leads são só formulário de contato, não contas).

## LP Memórias (fotos dos convidados no telão)

Serviço vendido em `/lp-memorias` (com `noindex` e sem link no menu público, por decisão
do cliente). Operação em `/admin/memorias`; convidados em `/lp-memorias/enviar?t=`; telão em
`/lp-memorias/telao?t=`. Schema em `supabase/migrations/0017_lp_memorias.sql`.

- **Acesso:** as tabelas `memorias_*` têm RLS ligado e nenhuma policy, de propósito. Tudo passa
  pelas rotas `api/memorias` (token do link) e `api/admin/memorias` (`requireStaff`), com service role.
- **Upload:** direto do navegador para o bucket privado `memorias` com URL assinada, porque a
  Vercel recusa corpos acima de cerca de 4,5 MB. Depois, `upload/finish` valida pelos bytes e gera as versões.
- **Mídia:** sempre pela rota de redirecionamento: a URL assinada muda a cada chamada, e usá-la
  direto no estado faria as fotos recarregarem no telão.
- **Tempo real:** Realtime Broadcast só para telão e painel, com a mensagem "mudou", sem dados.
  Convidados consultam a cada 15s para não consumir o limite de conexões do plano.
- **Clientes (quem contrata):** contas em `memorias_clients`, criadas em `/admin/memorias/clientes`. Usam o Supabase Auth,
  mas sem linha em `profiles`: é isso que os mantém fora de `/admin` e de `/admin/usuarios`. Entram por `/lp-memorias/entrar`
  (que também aceita a equipe) e veem só os próprios eventos em `/lp-memorias/conta`. A regra fica em `lib/memorias/access.ts`.
  Só a equipe cria eventos, vincula cliente, muda o prazo e exclui.
- **Pendências:** a exclusão ao vencer o prazo de guarda é manual (o painel só avisa). O prazo de
  1 ano é um padrão provisório, editável por evento, até a Lia definir. Vídeos limitados a 50 MB.

## LP Casar (site de casamento feito pelos noivos)

Inspirado no fluxo do Casar.com, com textos, temas e artes próprios e as cores da LP. Fica em `/lp-casar`, com `noindex` e
sem link no menu público. Noivos entram em `/lp-casar/entrar`, criam o site em `/lp-casar/criar`, editam em `/lp-casar/painel`;
convidados abrem `/lp-casar/[slug]`. Schema em `supabase/migrations/0019_lp_casar.sql`.

- **Acesso:** `casar_*` com RLS ligado e sem policy, como na LP Memórias. Tudo passa por `api/casar`, que confere o dono
  (`requireOwnSite`) ou a senha do site. Contas de noivos usam o Supabase Auth, sem linha em `profiles`, e por isso não alcançam `/admin`.
- **Modo local:** com `LP_CASAR_LOCAL=1` em `next dev`, dados e contas ficam em `.data/lp-casar` (fora do git) e o Supabase não é usado.
  Em produção a variável é ignorada. Sem ela, o módulo só funciona depois de aplicar a migration 0019.
- **Presentes:** Pix direto na chave dos noivos (`lib/casar/pix.ts` gera o BR Code). O LP Casar não recebe nem repassa dinheiro, então
  não confirma pagamento: o aviso do convidado fica "a conferir" até os noivos marcarem como recebido. A "Carteira" é um controle, não um saldo.
- **Chave Pix:** nunca vai para o navegador do convidado como dado do site (`toPublicData`); só aparece dentro do QR, no momento do presente.
- **Logos:** `public/logo-*.svg` são vetores: o símbolo foi vetorizado do PNG original e o nome da assessoria recriado em Inter Light, parecido com o original.
- **Papelaria:** fundos em `public/images/casar/papelaria`, com fontes SVG editáveis em `design/papelaria`. O texto entra por cima, no canvas (`panels/other.tsx`).
- **Temas:** a identidade de cada um fica nas classes `.t-<id>` de `lp-casar.css`.
- **Fontes:** `@import` com vírgula na URL é descartado pelo compilador sem aviso; usar `%2C`. Ver `lp-casar.css`.
- **Redefinir senha (Supabase):** o e-mail aponta para `/api/casar/auth/callback`, que precisa estar nas Redirect URLs do projeto Supabase.
- **E-mails:** só saem com `RESEND_API_KEY` e `LP_CASAR_EMAIL_FROM` configurados. Sem isso, os avisos ficam só no painel (números nos menus).
- **Fora de propósito:** cartão, boleto, saldo real, taxas, shopping/cashback, cartão postal físico e venda de domínio pelo site dependem de contrato com intermediador, gráfica ou registrador. Não simular esses recursos.
- **Pendências:** sem limite de envios por IP nos formulários públicos (só campo invisível e teto por site). Texto dos termos precisa de revisão jurídica. Backend Supabase ainda não testado de ponta a ponta. Definir preço do serviço antes de divulgar.

## Identidade visual (não mexer sem pedido explícito)

Paleta de cores (definida em `:root` no `globals.css`):
- `--navy: #182c52` / `--navy-deep: #0c1830` — azul-marinho, cor principal da marca
- `--cream: #faf6ef` — fundo padrão
- `--taupe: #b6a48d` — seção de Serviços
- `--gold: #ab7f3f` — acentos, botões primários, "brilho" decorativo
- `--espresso: #352b22` — texto padrão

Tipografia: Playfair Display (itálico, títulos), Cormorant Garamond (citações), Jost (corpo/UI).

Elemento de assinatura: um "brilho"/estrela de 4 pontas (SVG `#ic-spark`) usado como
motivo decorativo recorrente (divisores, selos, partículas flutuantes no Hero) — isso
veio do logo original da marca e foi identificado como elemento a reforçar no design.

Diferencial de negócio destacado no site: **"Especialista em casamentos católicos"** —
aparece como selo no Hero e na seção Sobre, e como item de destaque no pacote Completo.
Não é um "nicho" genérico como os outros (15 anos, formaturas etc.) — é tratado
visualmente como uma credencial à parte.

## O que falta / próximos passos possíveis

- [x] Migration `0001_init.sql` aplicada no projeto Supabase real (via MCP) — as 6
      tabelas, RLS e dados de seed já existem no banco remoto.
- [x] Tipos TypeScript reais gerados a partir do schema (`mcp__supabase__generate_typescript_types`)
      em `src/lib/database.types.ts`. `src/lib/types.ts` deriva os aliases nomeados
      (`ServiceRow`, `LeadRow` etc.) desse arquivo — para regenerar após uma mudança de
      schema, rode a mesma ferramenta de novo e substitua o conteúdo de `database.types.ts`.
      `EventStatus`/`MediaType` continuam como unions manuais (o Postgres não expõe
      `check constraints` em colunas `text` como enum, então o codegen tipa essas colunas
      como `string` genérico); por isso alguns pontos de leitura fazem um cast explícito
      para o tipo estreito (`as LeadRow[]`, `as PortfolioItemRow[]`) — o runtime já garante
      os valores via constraint no banco.
- [x] Build testado (`npm install && npm run build`) — compila e tipa limpo.
- [x] Múltiplos usuários administrativos com níveis de acesso (`admin` /
      `usuario_avancado` / `cliente` reservado) — `/admin/usuarios`, ver seção RLS acima.
- [ ] E-mail de notificação quando um lead novo chega (ex: via Resend)
- [ ] Área própria para o papel "Cliente" (hoje só existe o enum/gating, sem tela real)
- [ ] Página de álbum individual por casamento (hoje o portfólio é uma galeria única,
      sem agrupamento por evento)

## Convenções do código

- Componentes do site público ficam em `src/components/site/`, os do admin em
  `src/components/admin/`.
- Toda tela do admin que precisa de interatividade (formulários, upload, gráficos) é
  Client Component (`"use client"`) e busca/grava dados direto com o cliente Supabase do
  navegador (`src/lib/supabase/client.ts`) — a segurança fica por conta do RLS, não da UI.
- A home (`src/app/page.tsx`) é Server Component e busca os dados via
  `src/lib/data.ts` (cliente Supabase de servidor) — isso mantém a home rápida e
  indexável, sem esperar JavaScript no navegador para mostrar conteúdo.
- `revalidate = 60` na home: mudanças feitas no admin aparecem no site público em até
  1 minuto, sem precisar de novo deploy.
- **`middleware.ts` tem que ficar em `src/middleware.ts`**, nunca na raiz do projeto —
  como o app usa a pasta `src/`, o Next.js só reconhece o middleware lá. Na raiz, ele é
  silenciosamente ignorado (sem erro, sem aviso) e `/admin/*` fica sem proteção nenhuma;
  isso já aconteceu uma vez neste projeto.
- Ações que precisam de privilégio total sobre usuários (criar, redefinir senha,
  ativar/desativar) só existem como rotas server-side em `src/app/api/admin/users/*`,
  usando `createServiceRoleClient()` (`src/lib/supabase/server.ts`) — nunca no cliente,
  e cada rota confere com `requireAdmin()`/`requireActiveUser()`
  (`src/lib/supabase/admin-guard.ts`) que quem está chamando tem permissão antes de
  fazer qualquer coisa.
