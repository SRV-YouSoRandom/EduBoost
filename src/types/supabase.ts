
// src/types/supabase.ts
import type { Institution } from "./institution";
import type { GenerateContentIdeasOutput } from "@/ai/schemas/content-ideas-schemas";
import type { GenerateGMBOptimizationsOutput } from "@/ai/schemas/gmb-optimizer-schemas";
import type { GenerateLocalSEOStrategyOutput } from "@/ai/schemas/local-seo-schemas";
import type { GeneratePerformanceMarketingStrategyOutput } from "@/ai/schemas/performance-marketing-schemas";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      institutions: {
        Row: {
          id: string // UUID
          user_id: string | null // UUID, references auth.users
          name: string
          type: string
          location: string
          programs_offered: string
          target_audience: string
          unique_selling_points: string
          website_url: string | null
          created_at: string // timestamp with time zone
          updated_at: string // timestamp with time zone
        }
        Insert: {
          id?: string // UUID, defaults to uuid_generate_v4()
          user_id?: string | null // For now, assuming anon or placeholder
          name: string
          type: string
          location: string
          programs_offered: string
          target_audience: string
          unique_selling_points: string
          website_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          type?: string
          location?: string
          programs_offered?: string
          target_audience?: string
          unique_selling_points?: string
          website_url?: string | null
          updated_at?: string
        }
      }
      content_ideas: {
        Row: {
          id: string // UUID
          institution_id: string // UUID, FK to institutions.id
          user_id: string | null // UUID
          ideas_data: GenerateContentIdeasOutput | null // JSONB
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          user_id?: string | null
          ideas_data?: GenerateContentIdeasOutput | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          user_id?: string | null
          ideas_data?: GenerateContentIdeasOutput | null
          updated_at?: string
        }
      }
      gmb_optimizations: {
        Row: {
          id: string // UUID
          institution_id: string // UUID, FK to institutions.id
          user_id: string | null // UUID
          optimization_data: GenerateGMBOptimizationsOutput | null // JSONB
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          user_id?: string | null
          optimization_data?: GenerateGMBOptimizationsOutput | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          user_id?: string | null
          optimization_data?: GenerateGMBOptimizationsOutput | null
          updated_at?: string
        }
      }
      local_seo_strategies: {
        Row: {
          id: string // UUID
          institution_id: string // UUID, FK to institutions.id
          user_id: string | null // UUID
          strategy_data: GenerateLocalSEOStrategyOutput | null // JSONB
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          user_id?: string | null
          strategy_data?: GenerateLocalSEOStrategyOutput | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          user_id?: string | null
          strategy_data?: GenerateLocalSEOStrategyOutput | null
          updated_at?: string
        }
      }
      performance_marketing_strategies: {
        Row: {
          id: string // UUID
          institution_id: string // UUID, FK to institutions.id
          user_id: string | null // UUID
          strategy_data: GeneratePerformanceMarketingStrategyOutput | null // JSONB
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          institution_id: string
          user_id?: string | null
          strategy_data?: GeneratePerformanceMarketingStrategyOutput | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          institution_id?: string
          user_id?: string | null
          strategy_data?: GeneratePerformanceMarketingStrategyOutput | null
          updated_at?: string
        }
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

// Helper type to map Supabase row to our app's Institution type
export const fromSupabaseInstitution = (row: Database['public']['Tables']['institutions']['Row']): Institution => ({
  id: row.id,
  name: row.name,
  type: row.type,
  location: row.location,
  programsOffered: row.programs_offered,
  targetAudience: row.target_audience,
  uniqueSellingPoints: row.unique_selling_points,
  websiteUrl: row.website_url || undefined,
});

export const toSupabaseInstitutionInsert = (institution: Omit<Institution, 'id'>, userId?: string | null): Database['public']['Tables']['institutions']['Insert'] => ({
  name: institution.name,
  type: institution.type,
  location: institution.location,
  programs_offered: institution.programsOffered,
  target_audience: institution.targetAudience,
  unique_selling_points: institution.uniqueSellingPoints,
  website_url: institution.websiteUrl,
  user_id: userId || null, // Add user_id, default to null if not provided
});

export const toSupabaseInstitutionUpdate = (institution: Partial<Omit<Institution, 'id'>>): Database['public']['Tables']['institutions']['Update'] => ({
  name: institution.name,
  type: institution.type,
  location: institution.location,
  programs_offered: institution.programsOffered,
  target_audience: institution.targetAudience,
  unique_selling_points: institution.uniqueSellingPoints,
  website_url: institution.websiteUrl,
});

