// Gerado a partir do schema real via `mcp__supabase__generate_typescript_types`.
// Não editar manualmente — para regenerar, rode a mesma ferramenta MCP após
// qualquer alteração de schema (supabase/migrations/*.sql).

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      faqs: {
        Row: {
          answer: string
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          question: string
        }
        Insert: {
          answer: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question: string
        }
        Update: {
          answer?: string
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          question?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          event_date: string | null
          event_type: string | null
          id: string
          message: string | null
          name: string
          status: string
        }
        Insert: {
          created_at?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          message?: string | null
          name: string
          status?: string
        }
        Update: {
          created_at?: string
          event_date?: string | null
          event_type?: string | null
          id?: string
          message?: string | null
          name?: string
          status?: string
        }
        Relationships: []
      }
      portfolio_items: {
        Row: {
          caption: string | null
          created_at: string
          display_order: number
          id: string
          is_published: boolean
          media_type: string
          storage_path: string
          title: string
          url: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          media_type?: string
          storage_path: string
          title: string
          url: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          display_order?: number
          id?: string
          is_published?: boolean
          media_type?: string
          storage_path?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          display_order: number
          features: string[]
          id: string
          is_featured: boolean
          is_published: boolean
          name: string
          price_label: string | null
          tagline: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          features?: string[]
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name: string
          price_label?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          features?: string[]
          id?: string
          is_featured?: boolean
          is_published?: boolean
          name?: string
          price_label?: string | null
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          value: string | null
        }
        Insert: {
          key: string
          value?: string | null
        }
        Update: {
          key?: string
          value?: string | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          couple_names: string
          created_at: string
          display_order: number
          id: string
          is_featured: boolean
          is_published: boolean
          photo_url_1: string | null
          photo_url_2: string | null
          quote: string
        }
        Insert: {
          couple_names: string
          created_at?: string
          display_order?: number
          id?: string
          is_featured?: boolean
          is_published?: boolean
          photo_url_1?: string | null
          photo_url_2?: string | null
          quote: string
        }
        Update: {
          couple_names?: string
          created_at?: string
          display_order?: number
          id?: string
          is_featured?: boolean
          is_published?: boolean
          photo_url_1?: string | null
          photo_url_2?: string | null
          quote?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
