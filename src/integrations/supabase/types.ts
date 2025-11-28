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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      analyses: {
        Row: {
          analysis_depth: string
          collection_name: string
          collection_type: string
          created_at: string | null
          focus_colors: boolean | null
          focus_fabrics: boolean | null
          focus_models: boolean | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          analysis_depth: string
          collection_name: string
          collection_type: string
          created_at?: string | null
          focus_colors?: boolean | null
          focus_fabrics?: boolean | null
          focus_models?: boolean | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          analysis_depth?: string
          collection_name?: string
          collection_type?: string
          created_at?: string | null
          focus_colors?: boolean | null
          focus_fabrics?: boolean | null
          focus_models?: boolean | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      analysis_products: {
        Row: {
          analysis_description: string | null
          analysis_id: string
          category: string | null
          color: string | null
          created_at: string | null
          demand_score: number | null
          estimated_price: number | null
          fabric: string | null
          id: string
          image_url: string | null
          insights: Json | null
          projected_revenue: number | null
          recommended_quantity: number | null
          risk_level: string | null
          score_justification: string | null
          sku: string | null
          sources: Json | null
          target_audience_size: number | null
        }
        Insert: {
          analysis_description?: string | null
          analysis_id: string
          category?: string | null
          color?: string | null
          created_at?: string | null
          demand_score?: number | null
          estimated_price?: number | null
          fabric?: string | null
          id?: string
          image_url?: string | null
          insights?: Json | null
          projected_revenue?: number | null
          recommended_quantity?: number | null
          risk_level?: string | null
          score_justification?: string | null
          sku?: string | null
          sources?: Json | null
          target_audience_size?: number | null
        }
        Update: {
          analysis_description?: string | null
          analysis_id?: string
          category?: string | null
          color?: string | null
          created_at?: string | null
          demand_score?: number | null
          estimated_price?: number | null
          fabric?: string | null
          id?: string
          image_url?: string | null
          insights?: Json | null
          projected_revenue?: number | null
          recommended_quantity?: number | null
          risk_level?: string | null
          score_justification?: string | null
          sku?: string | null
          sources?: Json | null
          target_audience_size?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_products_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      market_insights: {
        Row: {
          analysis_id: string
          created_at: string | null
          id: string
          insight: string
          source: string | null
        }
        Insert: {
          analysis_id: string
          created_at?: string | null
          id?: string
          insight: string
          source?: string | null
        }
        Update: {
          analysis_id?: string
          created_at?: string | null
          id?: string
          insight?: string
          source?: string | null
        }
        Relationships: []
      }
      recommendations: {
        Row: {
          analysis_id: string
          created_at: string | null
          id: string
          priority: string | null
          recommendation: string
        }
        Insert: {
          analysis_id: string
          created_at?: string | null
          id?: string
          priority?: string | null
          recommendation: string
        }
        Update: {
          analysis_id?: string
          created_at?: string | null
          id?: string
          priority?: string | null
          recommendation?: string
        }
        Relationships: []
      }
      trending_colors: {
        Row: {
          analysis_id: string
          confidence_score: number
          created_at: string | null
          hex_code: string
          id: string
          name: string
          reason: string | null
          search_appearances: number | null
          sources: string[] | null
          visual_reference_url: string | null
        }
        Insert: {
          analysis_id: string
          confidence_score: number
          created_at?: string | null
          hex_code: string
          id?: string
          name: string
          reason?: string | null
          search_appearances?: number | null
          sources?: string[] | null
          visual_reference_url?: string | null
        }
        Update: {
          analysis_id?: string
          confidence_score?: number
          created_at?: string | null
          hex_code?: string
          id?: string
          name?: string
          reason?: string | null
          search_appearances?: number | null
          sources?: string[] | null
          visual_reference_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trending_colors_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_fabrics: {
        Row: {
          analysis_id: string
          created_at: string | null
          id: string
          name: string
          reason: string | null
          search_appearances: number | null
          sources: string[] | null
          trend_percentage: string
          visual_reference_url: string | null
        }
        Insert: {
          analysis_id: string
          created_at?: string | null
          id?: string
          name: string
          reason?: string | null
          search_appearances?: number | null
          sources?: string[] | null
          trend_percentage: string
          visual_reference_url?: string | null
        }
        Update: {
          analysis_id?: string
          created_at?: string | null
          id?: string
          name?: string
          reason?: string | null
          search_appearances?: number | null
          sources?: string[] | null
          trend_percentage?: string
          visual_reference_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trending_fabrics_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "analyses"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_models: {
        Row: {
          analysis_id: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          popularity: string
          search_appearances: number | null
          sources: string[] | null
          visual_reference_url: string | null
        }
        Insert: {
          analysis_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          popularity: string
          search_appearances?: number | null
          sources?: string[] | null
          visual_reference_url?: string | null
        }
        Update: {
          analysis_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          popularity?: string
          search_appearances?: number | null
          sources?: string[] | null
          visual_reference_url?: string | null
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
