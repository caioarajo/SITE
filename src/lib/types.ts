// Tipos das tabelas do Supabase, derivados do schema real gerado em
// `database.types.ts` (via mcp__supabase__generate_typescript_types).
// Para regenerar após uma mudança de schema, rode essa ferramenta de novo e
// substitua o conteúdo de database.types.ts.

import type { Database } from "@/lib/database.types";

export type { Database };

export type EventStatus = "novo" | "em_contato" | "fechado";
export type MediaType = "image" | "video";
export type UserRole = "admin" | "usuario_avancado" | "cliente";

type Tables = Database["public"]["Tables"];

export type ServiceRow = Tables["services"]["Row"];

export type PortfolioItemRow = Omit<Tables["portfolio_items"]["Row"], "media_type"> & {
  media_type: MediaType;
};

export type TestimonialRow = Tables["testimonials"]["Row"];

export type FaqRow = Tables["faqs"]["Row"];

export type LeadRow = Omit<Tables["leads"]["Row"], "status"> & {
  status: EventStatus;
};

export type SiteSettingRow = Tables["site_settings"]["Row"];

export type ProfileRow = Omit<Tables["profiles"]["Row"], "role"> & {
  role: UserRole;
};

// Combinação de public.profiles + auth.users (email, último acesso), montada
// pela rota /api/admin/users — não existe como uma única tabela no banco.
export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  is_active: boolean;
  must_change_password: boolean;
  created_at: string;
  last_sign_in_at: string | null;
};
