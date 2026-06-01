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
      ai_training: {
        Row: {
          custom_responses: string
          objections: string
          rules: string
          tone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          custom_responses?: string
          objections?: string
          rules?: string
          tone?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          custom_responses?: string
          objections?: string
          rules?: string
          tone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bot_conversations: {
        Row: {
          contact_phone: string
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          contact_phone: string
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          contact_phone?: string
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      customer_status: {
        Row: {
          contact_name: string
          contact_phone: string
          id: string
          notes: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_name?: string
          contact_phone: string
          id?: string
          notes?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_name?: string
          contact_phone?: string
          id?: string
          notes?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount_kz: number
          contact_name: string
          contact_phone: string
          created_at: string
          id: string
          notes: string
          product_id: string | null
          product_name: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_kz?: number
          contact_name?: string
          contact_phone: string
          created_at?: string
          id?: string
          notes?: string
          product_id?: string | null
          product_name?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_kz?: number
          contact_name?: string
          contact_phone?: string
          created_at?: string
          id?: string
          notes?: string
          product_id?: string | null
          product_name?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          id: string
          image_url: string
          label: string
          product_id: string
          sort_order: number
          storage_path: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          label?: string
          product_id: string
          sort_order?: number
          storage_path?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          label?: string
          product_id?: string
          sort_order?: number
          storage_path?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          benefits: string
          category: string
          created_at: string
          description: string
          faq: string
          id: string
          name: string
          payment_data: string
          price_kz: number
          sku: string
          stock: number
          updated_at: string
          user_id: string
          video_url: string
        }
        Insert: {
          benefits?: string
          category?: string
          created_at?: string
          description?: string
          faq?: string
          id?: string
          name: string
          payment_data?: string
          price_kz?: number
          sku?: string
          stock?: number
          updated_at?: string
          user_id: string
          video_url?: string
        }
        Update: {
          benefits?: string
          category?: string
          created_at?: string
          description?: string
          faq?: string
          id?: string
          name?: string
          payment_data?: string
          price_kz?: number
          sku?: string
          stock?: number
          updated_at?: string
          user_id?: string
          video_url?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          business_name: string
          currency: string
          default_greeting: string
          groq_api_key: string
          logo_url: string
          updated_at: string
          user_id: string
        }
        Insert: {
          business_name?: string
          currency?: string
          default_greeting?: string
          groq_api_key?: string
          logo_url?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          business_name?: string
          currency?: string
          default_greeting?: string
          groq_api_key?: string
          logo_url?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_instances: {
        Row: {
          created_at: string
          instance_name: string
          phone_number: string | null
          qr_code: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          instance_name: string
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          instance_name?: string
          phone_number?: string | null
          qr_code?: string | null
          status?: string
          updated_at?: string
          user_id?: string
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
