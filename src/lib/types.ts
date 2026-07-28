// Tipos das tabelas do Supabase. Se preferir, gere automaticamente com:
// npx supabase gen types typescript --project-id SEU_PROJETO > src/lib/types.ts
// (isso substitui este arquivo por um gerado a partir do schema real)

export type EventStatus = "novo" | "em_contato" | "fechado";
export type MediaType = "image" | "video";

// Nota: `type` (não `interface`) de propósito — o supabase-js exige que cada
// `Row`/`Insert`/`Update` seja estruturalmente atribuível a
// `Record<string, unknown>`, e o TypeScript só reconhece essa compatibilidade
// implícita para aliases de tipo, não para interfaces nomeadas.
export type ServiceRow = {
  id: string;
  name: string;
  tagline: string | null;
  price_label: string | null;
  features: string[];
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export type PortfolioItemRow = {
  id: string;
  title: string;
  caption: string | null;
  media_type: MediaType;
  storage_path: string;
  url: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
};

export type TestimonialRow = {
  id: string;
  couple_names: string;
  quote: string;
  photo_url_1: string | null;
  photo_url_2: string | null;
  is_featured: boolean;
  is_published: boolean;
  display_order: number;
  created_at: string;
};

export type FaqRow = {
  id: string;
  question: string;
  answer: string;
  is_published: boolean;
  display_order: number;
  created_at: string;
};

export type LeadRow = {
  id: string;
  name: string;
  event_type: string | null;
  event_date: string | null;
  message: string | null;
  status: EventStatus;
  created_at: string;
};

export type SiteSettingRow = {
  key: string;
  value: string | null;
};

// Tipo genérico do banco, usado pelo cliente tipado do Supabase.
// Estrutura simplificada — funciona com createClient<Database>().
// Inclui `Relationships` e as demais chaves do schema (mesmo vazias) porque
// o supabase-js 2.x precisa exatamente desse formato para inferir os tipos
// de insert/update corretamente — sem isso, .update()/.insert() colapsam
// para `never` e o build (tsc) falha.
export type Database = {
  public: {
    Tables: {
      services: {
        Row: ServiceRow;
        Insert: Partial<ServiceRow>;
        Update: Partial<ServiceRow>;
        Relationships: [];
      };
      portfolio_items: {
        Row: PortfolioItemRow;
        Insert: Partial<PortfolioItemRow>;
        Update: Partial<PortfolioItemRow>;
        Relationships: [];
      };
      testimonials: {
        Row: TestimonialRow;
        Insert: Partial<TestimonialRow>;
        Update: Partial<TestimonialRow>;
        Relationships: [];
      };
      faqs: {
        Row: FaqRow;
        Insert: Partial<FaqRow>;
        Update: Partial<FaqRow>;
        Relationships: [];
      };
      leads: {
        Row: LeadRow;
        Insert: Partial<LeadRow>;
        Update: Partial<LeadRow>;
        Relationships: [];
      };
      site_settings: {
        Row: SiteSettingRow;
        Insert: Partial<SiteSettingRow>;
        Update: Partial<SiteSettingRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
