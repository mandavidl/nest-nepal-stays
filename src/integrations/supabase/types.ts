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
      bookings: {
        Row: {
          check_in: string
          check_out: string
          city: string
          created_at: string
          guest_id: string
          guests: number
          host_name: string
          host_phone: string | null
          id: string
          image: string | null
          nights: number
          property_id: string
          property_name: string
          reference: string
          reviewed: boolean
          status: string
          total: number
          type_label: string
        }
        Insert: {
          check_in: string
          check_out: string
          city?: string
          created_at?: string
          guest_id: string
          guests?: number
          host_name?: string
          host_phone?: string | null
          id?: string
          image?: string | null
          nights: number
          property_id: string
          property_name?: string
          reference?: string
          reviewed?: boolean
          status?: string
          total: number
          type_label?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          city?: string
          created_at?: string
          guest_id?: string
          guests?: number
          host_name?: string
          host_phone?: string | null
          id?: string
          image?: string | null
          nights?: number
          property_id?: string
          property_name?: string
          reference?: string
          reviewed?: boolean
          status?: string
          total?: number
          type_label?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          property_id?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_host: boolean
          phone_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string
          id: string
          is_host?: boolean
          phone_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_host?: boolean
          phone_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[]
          approval_status: string
          area: string
          availability_from: string | null
          badges: string[]
          bathrooms: number
          bedrooms: number
          beds: number
          booked_days: number[]
          cancellation_policy: string
          city: string
          cleaning_fee: number
          cover_photo: string | null
          created_at: string
          description: string
          host_id: string
          host_initials: string
          host_name: string
          host_response_rate: number
          host_since: string
          host_verified: boolean
          house_rules: string[]
          id: string
          max_guests: number
          pet_fee: number
          pet_friendly: boolean
          pet_rules: string | null
          pet_types: string[]
          phone_number: string
          photos: string[]
          price_per_night: number
          property_category: string
          property_name: string
          rating: number
          rating_breakdown: Json
          review_count: number
          reviews: Json
          status: string
          type_label: string
          updated_at: string
        }
        Insert: {
          address?: string
          amenities?: string[]
          approval_status?: string
          area?: string
          availability_from?: string | null
          badges?: string[]
          bathrooms?: number
          bedrooms?: number
          beds?: number
          booked_days?: number[]
          cancellation_policy?: string
          city?: string
          cleaning_fee?: number
          cover_photo?: string | null
          created_at?: string
          description?: string
          host_id: string
          host_initials?: string
          host_name?: string
          host_response_rate?: number
          host_since?: string
          host_verified?: boolean
          house_rules?: string[]
          id?: string
          max_guests?: number
          pet_fee?: number
          pet_friendly?: boolean
          pet_rules?: string | null
          pet_types?: string[]
          phone_number: string
          photos?: string[]
          price_per_night?: number
          property_category: string
          property_name: string
          rating?: number
          rating_breakdown?: Json
          review_count?: number
          reviews?: Json
          status?: string
          type_label?: string
          updated_at?: string
        }
        Update: {
          address?: string
          amenities?: string[]
          approval_status?: string
          area?: string
          availability_from?: string | null
          badges?: string[]
          bathrooms?: number
          bedrooms?: number
          beds?: number
          booked_days?: number[]
          cancellation_policy?: string
          city?: string
          cleaning_fee?: number
          cover_photo?: string | null
          created_at?: string
          description?: string
          host_id?: string
          host_initials?: string
          host_name?: string
          host_response_rate?: number
          host_since?: string
          host_verified?: boolean
          house_rules?: string[]
          id?: string
          max_guests?: number
          pet_fee?: number
          pet_friendly?: boolean
          pet_rules?: string | null
          pet_types?: string[]
          phone_number?: string
          photos?: string[]
          price_per_night?: number
          property_category?: string
          property_name?: string
          rating?: number
          rating_breakdown?: Json
          review_count?: number
          reviews?: Json
          status?: string
          type_label?: string
          updated_at?: string
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
