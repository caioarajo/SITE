# Changelog

Todas as mudanças relevantes do projeto ficam registradas aqui, da mais recente para a
mais antiga. Ao pedir uma alteração numa conversa futura, vale conferir este arquivo
primeiro para saber o estado atual.

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
