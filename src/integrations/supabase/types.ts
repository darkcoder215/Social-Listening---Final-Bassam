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
      candidate_searches: {
        Row: {
          cities: string[] | null
          city: string
          companies: string[] | null
          created_at: string
          education: string[] | null
          exclude_terms: string[] | null
          experience_level: string[] | null
          id: string
          job_title: string
          job_titles: string[] | null
          search_query: string
          skills: string[] | null
          total_results: number | null
          user_id: string | null
        }
        Insert: {
          cities?: string[] | null
          city: string
          companies?: string[] | null
          created_at?: string
          education?: string[] | null
          exclude_terms?: string[] | null
          experience_level?: string[] | null
          id?: string
          job_title: string
          job_titles?: string[] | null
          search_query: string
          skills?: string[] | null
          total_results?: number | null
          user_id?: string | null
        }
        Update: {
          cities?: string[] | null
          city?: string
          companies?: string[] | null
          created_at?: string
          education?: string[] | null
          exclude_terms?: string[] | null
          experience_level?: string[] | null
          id?: string
          job_title?: string
          job_titles?: string[] | null
          search_query?: string
          skills?: string[] | null
          total_results?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          ai_analysis: Json | null
          ai_relevancy_analysis: Json | null
          citizenship: string | null
          citizenship_confidence: number | null
          citizenship_explanation: string | null
          comment: string | null
          created_at: string
          enriched_profile: Json | null
          gender: string | null
          gender_confidence: number | null
          gender_explanation: string | null
          id: string
          industry_relevancy_score: number | null
          job_title_relevancy_score: number | null
          linkedin_url: string
          name: string
          overall_relevancy_score: number | null
          profile_summary: string | null
          qualification_status: string | null
          saved: boolean | null
          search_id: string | null
          status: string | null
          total_years_experience: number | null
          updated_at: string
          user_id: string | null
          years_relevant_experience: number | null
        }
        Insert: {
          ai_analysis?: Json | null
          ai_relevancy_analysis?: Json | null
          citizenship?: string | null
          citizenship_confidence?: number | null
          citizenship_explanation?: string | null
          comment?: string | null
          created_at?: string
          enriched_profile?: Json | null
          gender?: string | null
          gender_confidence?: number | null
          gender_explanation?: string | null
          id?: string
          industry_relevancy_score?: number | null
          job_title_relevancy_score?: number | null
          linkedin_url: string
          name: string
          overall_relevancy_score?: number | null
          profile_summary?: string | null
          qualification_status?: string | null
          saved?: boolean | null
          search_id?: string | null
          status?: string | null
          total_years_experience?: number | null
          updated_at?: string
          user_id?: string | null
          years_relevant_experience?: number | null
        }
        Update: {
          ai_analysis?: Json | null
          ai_relevancy_analysis?: Json | null
          citizenship?: string | null
          citizenship_confidence?: number | null
          citizenship_explanation?: string | null
          comment?: string | null
          created_at?: string
          enriched_profile?: Json | null
          gender?: string | null
          gender_confidence?: number | null
          gender_explanation?: string | null
          id?: string
          industry_relevancy_score?: number | null
          job_title_relevancy_score?: number | null
          linkedin_url?: string
          name?: string
          overall_relevancy_score?: number | null
          profile_summary?: string | null
          qualification_status?: string | null
          saved?: boolean | null
          search_id?: string | null
          status?: string | null
          total_years_experience?: number | null
          updated_at?: string
          user_id?: string | null
          years_relevant_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "candidates_search_id_fkey"
            columns: ["search_id"]
            isOneToOne: false
            referencedRelation: "candidate_searches"
            referencedColumns: ["id"]
          },
        ]
      }
      commentary_analyses: {
        Row: {
          accuracy: Json | null
          clarity: Json | null
          created_at: string
          emotional_analysis: Json | null
          emotional_timeline: Json | null
          enthusiasm: Json | null
          event_reaction: Json | null
          excitement_timeline: Json
          filename: string
          id: string
          improvements: Json
          overall_score: number
          segments: Json
          strengths: Json
          style_variety: Json | null
          terminology: Json | null
          timing: Json | null
          transcription: string
          user_id: string | null
        }
        Insert: {
          accuracy?: Json | null
          clarity?: Json | null
          created_at?: string
          emotional_analysis?: Json | null
          emotional_timeline?: Json | null
          enthusiasm?: Json | null
          event_reaction?: Json | null
          excitement_timeline?: Json
          filename: string
          id?: string
          improvements?: Json
          overall_score: number
          segments?: Json
          strengths?: Json
          style_variety?: Json | null
          terminology?: Json | null
          timing?: Json | null
          transcription: string
          user_id?: string | null
        }
        Update: {
          accuracy?: Json | null
          clarity?: Json | null
          created_at?: string
          emotional_analysis?: Json | null
          emotional_timeline?: Json | null
          enthusiasm?: Json | null
          event_reaction?: Json | null
          excitement_timeline?: Json
          filename?: string
          id?: string
          improvements?: Json
          overall_score?: number
          segments?: Json
          strengths?: Json
          style_variety?: Json | null
          terminology?: Json | null
          timing?: Json | null
          transcription?: string
          user_id?: string | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          created_at: string
          group_name: string
          id: string
          name: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          group_name: string
          id?: string
          name: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          group_name?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      tweet_analyses: {
        Row: {
          all_tweets: Json | null
          created_at: string
          id: string
          insights: string | null
          main_issues: string | null
          max_items: number
          negative_count: number
          neutral_count: number
          positive_count: number
          recommendations: string | null
          sample_tweets: Json | null
          search_terms: string[]
          sort_order: string
          total_tweets: number
        }
        Insert: {
          all_tweets?: Json | null
          created_at?: string
          id?: string
          insights?: string | null
          main_issues?: string | null
          max_items: number
          negative_count?: number
          neutral_count?: number
          positive_count?: number
          recommendations?: string | null
          sample_tweets?: Json | null
          search_terms: string[]
          sort_order: string
          total_tweets?: number
        }
        Update: {
          all_tweets?: Json | null
          created_at?: string
          id?: string
          insights?: string | null
          main_issues?: string | null
          max_items?: number
          negative_count?: number
          neutral_count?: number
          positive_count?: number
          recommendations?: string | null
          sample_tweets?: Json | null
          search_terms?: string[]
          sort_order?: string
          total_tweets?: number
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
