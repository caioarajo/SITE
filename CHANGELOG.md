# Changelog

Todas as mudanças relevantes do projeto ficam registradas aqui, da mais recente para a
mais antiga. Ao pedir uma alteração numa conversa futura, vale conferir este arquivo
primeiro para saber o estado atual.

## [1.1.0] — Gestão de usuários e controle de acesso por papel (RBAC)

**Adicionado:**
- Migration `0002_user_management.sql`: tabela `public.profiles` (nome, papel,
  ativo/inativo, troca de senha obrigatória) e função `current_user_role()` usada nas
  policies de RLS de todas as tabelas operacionais — antes qualquer usuário
  autenticado tinha acesso total; agora `admin` e `usuario_avancado` têm escrita nas
  tabelas de conteúdo, e `site_settings` é exclusivo de `admin`
- Tela `/admin/usuarios` (só visível para `admin`): CRUD de usuários com busca, filtro
  por papel/status e paginação; redefinição de senha (gera senha temporária exibida
  uma única vez); ativar/desativar conta
- Rotas server-side (`/api/admin/users/*`, com a Service Role Key) para todas as ações
  acima — o navegador nunca tem acesso direto a essas operações
- Tela de troca de senha obrigatória (`/admin/change-password`) para contas recém-
  criadas ou com senha redefinida pelo admin
- Papel "Cliente" reservado no schema e no formulário de criação, mas sem área própria
  ainda (cai em `/admin/sem-acesso`) — este app não tem hoje nenhum dado por cliente
- Componente de Toast (`src/components/admin/Toast.tsx`) para feedback de
  sucesso/erro nas ações da tela de usuários

**Corrigido:**
- `middleware.ts` estava na raiz do projeto em vez de `src/middleware.ts` — no local
  errado, o Next.js nunca o reconhecia, e `/admin/*` nunca teve proteção real em
  nenhum deploy. Corrigido durante esta sessão, antes da feature de RBAC
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` na Vercel (produção) tinha um caractere BOM
  colado no início do valor, quebrando todo `fetch` autenticado feito pelo navegador
  (login incluído). Variável recriada sem o BOM

## [1.0.1] — Banco de dados provisionado e build validado

**Adicionado:**
- Migration `0001_init.sql` aplicada no projeto Supabase real via MCP: as 6 tabelas,
  RLS completo, bucket de storage `portfolio` e dados de seed agora existem no banco
  remoto (antes só existiam como arquivo local, nunca aplicados)
- Tipos TypeScript gerados a partir do schema real (`src/lib/database.types.ts`),
  substituindo a versão escrita manualmente. `src/lib/types.ts` passou a derivar os
  aliases (`ServiceRow`, `LeadRow` etc.) desse arquivo gerado

**Corrigido:**
- Primeiro `npm run build` real do projeto (nunca havia sido compilado antes).
  Os tipos gerados são mais estritos que os manuais — passaram a exigir os campos
  obrigatórios no insert e não inferem os `check constraints` de texto como union
  literal. Ajustados os pontos de admin (depoimentos, serviços, FAQ) que faziam
  `insert({ ...form })` a partir de um `Partial<Row>`, e os pontos que liam
  `leads.status`/`portfolio_items.media_type` do Supabase, com cast explícito para o
  tipo estreito — o runtime já garante esses valores via constraint no banco

## [1.0.0] — Versão inicial da aplicação Next.js

Transformação completa do site estático (HTML/CSS/JS) numa aplicação Next.js 14 +
TypeScript + Supabase + Framer Motion + ECharts + date-fns, mantendo a identidade visual
já aprovada.

**Adicionado:**
- Site público completo (Hero, Sobre, Como Funciona, Serviços, Portfólio, Depoimentos,
  FAQ, Contato, Rodapé) como Server/Client Components React
- Banco de dados Supabase com 6 tabelas, RLS completo e dados iniciais (seed)
- Área administrativa (`/admin`) com login por e-mail/senha (Supabase Auth)
- Dashboard com gráficos ECharts (leads nos últimos 30 dias, status, tipo de evento)
- CRUD completo de: portfólio (com upload real de imagem/vídeo para Supabase Storage),
  depoimentos, serviços, FAQ
- Inbox de leads com atualização de status
- Página de configurações (telefone/e-mail/instagram)
- Formulário de contato do site grava lead no banco E abre o WhatsApp com a mensagem
  pronta
- Middleware protegendo todas as rotas `/admin/*`

**Migrado do site estático:**
- Toda a paleta de cores, tipografia e CSS customizado (`globals.css`)
- Animações de entrada e parallax do Hero (antes em CSS/JS puro, agora em Framer Motion)
- Accordion do FAQ (antes JS manual medindo altura em pixels, agora Framer Motion nativo)
- Galeria do portfólio em grade/mosaico (o carrossel havia sido testado e revertido antes
  desta migração — mantido como grade)

**Notas de build:**
- Este projeto foi escrito sem acesso a `npm install`/`npm run build` no ambiente de
  geração — nunca foi de fato compilado. Rodar `npm install && npm run build` é o
  primeiro passo antes de qualquer deploy.
