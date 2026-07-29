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
`leads`, que o público só consegue INSERIR, nunca ler). Qualquer usuário autenticado tem
acesso total de escrita — não há hierarquia de permissões (assumindo que só a Lia terá
login). Se no futuro houver mais de um usuário admin com permissões diferentes, isso
precisa ser revisto.

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
- [ ] E-mail de notificação quando um lead novo chega (ex: via Resend)
- [ ] Múltiplos usuários administrativos com permissões diferentes
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
