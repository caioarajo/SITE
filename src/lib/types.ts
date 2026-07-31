// Tipos das tabelas do Supabase, derivados do schema real gerado em
// `database.types.ts` (via mcp__supabase__generate_typescript_types).
// Para regenerar após uma mudança de schema, rode essa ferramenta de novo e
// substitua o conteúdo de database.types.ts.

import type { Database } from "@/lib/database.types";

export type { Database };

export type EventStatus = "novo" | "em_contato" | "fechado";
export type MediaType = "image" | "video";
export type UserRole = "admin" | "usuario_avancado" | "cliente";

export type ClientType = "pessoa_fisica" | "pessoa_juridica";
export type EventCategory = "casamento" | "debutante" | "formatura" | "corporativo" | "infantil" | "aniversario" | "outro";
export type EventRecordStatus = "planejamento" | "confirmado" | "em_andamento" | "concluido" | "cancelado";
export type OpportunitySource = "site_form" | "whatsapp" | "manual" | "indicacao" | "outro";
export type OpportunityStage = "novo" | "qualificando" | "proposta" | "negociacao" | "ganho" | "perdido";
export type PayableStatus = "pendente" | "pago" | "cancelado";
export type ReceivableStatus = "pendente" | "recebido" | "cancelado";
export type RsvpStatus = "pendente" | "confirmado" | "recusado";
export type TableShape = "round" | "rectangle";
export type PortfolioCategory =
  | "quinze_anos"
  | "casamentos"
  | "formaturas"
  | "empresarial"
  | "infantil"
  | "eventos_gerais";

export type AgendaCategory = "reuniao" | "visita_tecnica" | "degustacao" | "prazo_fornecedor" | "dia_evento" | "interno";
export type AgendaStatus = "pendente" | "em_andamento" | "concluido";
export type AgendaLocationType = "presencial" | "online";
export type AgendaPriority = "baixa" | "normal" | "alta" | "critica";

type Tables = Database["public"]["Tables"];

export type ServiceRow = Tables["services"]["Row"];

export type PortfolioItemRow = Omit<Tables["portfolio_items"]["Row"], "media_type" | "category"> & {
  media_type: MediaType;
  category: PortfolioCategory;
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

export type ClientRow = Omit<Tables["clients"]["Row"], "client_type"> & {
  client_type: ClientType;
};

export type EventRow = Omit<Tables["events"]["Row"], "event_type" | "status"> & {
  event_type: EventCategory;
  status: EventRecordStatus;
};

export type StaffRow = Tables["staff"]["Row"];

export type SupplierRow = Tables["suppliers"]["Row"];

export type ProductRow = Tables["products"]["Row"];

export type OpportunityRow = Omit<Tables["opportunities"]["Row"], "source" | "stage"> & {
  source: OpportunitySource;
  stage: OpportunityStage;
};

export type PayableRow = Omit<Tables["accounts_payable"]["Row"], "status"> & {
  status: PayableStatus;
};

export type ReceivableRow = Omit<Tables["accounts_receivable"]["Row"], "status"> & {
  status: ReceivableStatus;
};

export type GuestListRow = Tables["guest_lists"]["Row"];

export type GuestRow = Omit<Tables["guests"]["Row"], "rsvp_status"> & {
  rsvp_status: RsvpStatus;
};

export type EventGuestListRow = Tables["event_guest_lists"]["Row"];

export type EventTableRow = Omit<Tables["event_tables"]["Row"], "shape"> & {
  shape: TableShape;
};

export type EventSeatRow = Tables["event_seats"]["Row"];

export type AgendaTemplateRow = Omit<Tables["agenda_templates"]["Row"], "event_type"> & {
  event_type: EventCategory;
};

export type AgendaTemplateItemRow = Omit<Tables["agenda_template_items"]["Row"], "category"> & {
  category: AgendaCategory;
};

export type AgendaItemRow = Omit<Tables["agenda_items"]["Row"], "category" | "location_type" | "priority" | "status"> & {
  category: AgendaCategory;
  location_type: AgendaLocationType;
  priority: AgendaPriority;
  status: AgendaStatus;
};

export type AgendaItemAttachmentRow = Tables["agenda_item_attachments"]["Row"];

export type AgendaReminder = {
  offset_minutes: number;
  channel: "sistema" | "email" | "whatsapp";
  recipient: "cliente" | "fornecedor" | "equipe";
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
