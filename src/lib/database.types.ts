// Gerado a partir do schema real (supabase/migrations/*.sql).
// Não editar manualmente — para regenerar, rode:
//   npx supabase@latest gen types typescript --linked > src/lib/database.types.ts
// (ou a ferramenta MCP mcp__supabase__generate_typescript_types, quando autenticada)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      accounts_payable: {
        Row: {
          amount: number
          category: string | null
          created_at: string
          description: string
          due_date: string
          event_id: string | null
          id: string
          notes: string | null
          paid_date: string | null
          payment_method: string | null
          staff_id: string | null
          status: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string
          description: string
          due_date: string
          event_id?: string | null
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          staff_id?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string
          description?: string
          due_date?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          paid_date?: string | null
          payment_method?: string | null
          staff_id?: string | null
          status?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_payable_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_payable_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      accounts_receivable: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string
          description: string
          due_date: string
          event_id: string | null
          id: string
          notes: string | null
          payment_method: string | null
          received_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string
          description: string
          due_date: string
          event_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          received_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string
          description?: string
          due_date?: string
          event_id?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          received_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounts_receivable_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_receivable_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_item_attachments: {
        Row: {
          agenda_item_id: string
          created_at: string
          file_name: string
          file_url: string
          id: string
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          agenda_item_id: string
          created_at?: string
          file_name: string
          file_url: string
          id?: string
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          agenda_item_id?: string
          created_at?: string
          file_name?: string
          file_url?: string
          id?: string
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "agenda_item_attachments_agenda_item_id_fkey"
            columns: ["agenda_item_id"]
            isOneToOne: false
            referencedRelation: "agenda_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_item_attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_items: {
        Row: {
          all_day: boolean
          category: string
          client_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          end_at: string | null
          event_id: string | null
          id: string
          location: string | null
          location_type: string
          meeting_link: string | null
          meeting_minutes: string | null
          priority: string
          reminders: Json
          responsible_id: string | null
          start_at: string
          status: string
          supplier_confirmed_at: string | null
          supplier_id: string | null
          supplier_invite_token: string | null
          template_id: string | null
          template_item_id: string | null
          title: string
          updated_at: string
          visible_to_client: boolean
        }
        Insert: {
          all_day?: boolean
          category: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          event_id?: string | null
          id?: string
          location?: string | null
          location_type?: string
          meeting_link?: string | null
          meeting_minutes?: string | null
          priority?: string
          reminders?: Json
          responsible_id?: string | null
          start_at: string
          status?: string
          supplier_confirmed_at?: string | null
          supplier_id?: string | null
          supplier_invite_token?: string | null
          template_id?: string | null
          template_item_id?: string | null
          title: string
          updated_at?: string
          visible_to_client?: boolean
        }
        Update: {
          all_day?: boolean
          category?: string
          client_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_at?: string | null
          event_id?: string | null
          id?: string
          location?: string | null
          location_type?: string
          meeting_link?: string | null
          meeting_minutes?: string | null
          priority?: string
          reminders?: Json
          responsible_id?: string | null
          start_at?: string
          status?: string
          supplier_confirmed_at?: string | null
          supplier_id?: string | null
          supplier_invite_token?: string | null
          template_id?: string | null
          template_item_id?: string | null
          title?: string
          updated_at?: string
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agenda_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_items_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_items_responsible_id_fkey"
            columns: ["responsible_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agenda_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agenda_items_template_item_id_fkey"
            columns: ["template_item_id"]
            isOneToOne: false
            referencedRelation: "agenda_template_items"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_template_items: {
        Row: {
          category: string
          created_at: string
          id: string
          offset_days: number
          order_index: number
          template_id: string
          title: string
          visible_to_client: boolean
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          offset_days: number
          order_index?: number
          template_id: string
          title: string
          visible_to_client?: boolean
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          offset_days?: number
          order_index?: number
          template_id?: string
          title?: string
          visible_to_client?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "agenda_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "agenda_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      agenda_templates: {
        Row: {
          created_at: string
          description: string | null
          event_type: string
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_type: string
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          event_type?: string
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          address: string | null
          client_type: string
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          client_type?: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          client_type?: string
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      event_guest_lists: {
        Row: {
          created_at: string
          event_id: string
          guest_list_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          guest_list_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          guest_list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_guest_lists_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_guest_lists_guest_list_id_fkey"
            columns: ["guest_list_id"]
            isOneToOne: false
            referencedRelation: "guest_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      event_seats: {
        Row: {
          created_at: string
          event_id: string
          event_table_id: string
          guest_id: string | null
          id: string
          seat_code: string
          seat_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          event_table_id: string
          guest_id?: string | null
          id?: string
          seat_code: string
          seat_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          event_table_id?: string
          guest_id?: string | null
          id?: string
          seat_code?: string
          seat_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_seats_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_seats_event_table_id_fkey"
            columns: ["event_table_id"]
            isOneToOne: false
            referencedRelation: "event_tables"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_seats_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tables: {
        Row: {
          created_at: string
          event_id: string
          id: string
          label: string
          pos_x: number
          pos_y: number
          seat_count: number
          shape: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          label: string
          pos_x?: number
          pos_y?: number
          seat_count?: number
          shape?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          label?: string
          pos_x?: number
          pos_y?: number
          seat_count?: number
          shape?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tables_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          budget_total: number | null
          client_id: string
          created_at: string
          event_date: string | null
          event_type: string
          guest_count: number | null
          id: string
          location: string | null
          notes: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          budget_total?: number | null
          client_id: string
          created_at?: string
          event_date?: string | null
          event_type?: string
          guest_count?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          budget_total?: number | null
          client_id?: string
          created_at?: string
          event_date?: string | null
          event_type?: string
          guest_count?: number | null
          id?: string
          location?: string | null
          notes?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
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
      guest_lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          category: string | null
          companions: number
          created_at: string
          email: string | null
          guest_list_id: string
          id: string
          name: string
          notes: string | null
          phone: string | null
          rsvp_status: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          companions?: number
          created_at?: string
          email?: string | null
          guest_list_id: string
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          rsvp_status?: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          companions?: number
          created_at?: string
          email?: string | null
          guest_list_id?: string
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rsvp_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guests_guest_list_id_fkey"
            columns: ["guest_list_id"]
            isOneToOne: false
            referencedRelation: "guest_lists"
            referencedColumns: ["id"]
          },
        ]
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
      opportunities: {
        Row: {
          client_id: string | null
          created_at: string
          email: string | null
          estimated_value: number | null
          event_type: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          lost_reason: string | null
          name: string
          notes: string | null
          phone: string | null
          source: string
          stage: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          event_type?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          source?: string
          stage?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          event_type?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          source?: string
          stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_items: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          display_order: number
          id: string
          is_cover: boolean
          is_published: boolean
          media_type: string
          poster_url: string | null
          storage_path: string
          title: string
          url: string
        }
        Insert: {
          caption?: string | null
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_cover?: boolean
          is_published?: boolean
          media_type?: string
          poster_url?: string | null
          storage_path: string
          title: string
          url: string
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          display_order?: number
          id?: string
          is_cover?: boolean
          is_published?: boolean
          media_type?: string
          poster_url?: string | null
          storage_path?: string
          title?: string
          url?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          is_active: boolean
          must_change_password: boolean
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id: string
          is_active?: boolean
          must_change_password?: boolean
          name: string
          role?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          must_change_password?: boolean
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
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
      staff: {
        Row: {
          created_at: string
          day_rate: number | null
          document: string | null
          email: string | null
          hire_date: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          role_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_rate?: number | null
          document?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          role_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_rate?: number | null
          document?: string | null
          email?: string | null
          hire_date?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          role_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          category: string | null
          contact_name: string | null
          created_at: string
          document: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          contact_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          contact_name?: string | null
          created_at?: string
          document?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
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
      current_user_role: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
