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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      abandoned_carts: {
        Row: {
          buyer_name: string | null
          converted: boolean
          converted_at: string | null
          created_at: string
          email: string | null
          id: string
          last_reminder_at: string | null
          opened_at: string
          organization_id: string
          product_id: string
          reminder_sent_count: number
          user_id: string | null
        }
        Insert: {
          buyer_name?: string | null
          converted?: boolean
          converted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_reminder_at?: string | null
          opened_at?: string
          organization_id: string
          product_id: string
          reminder_sent_count?: number
          user_id?: string | null
        }
        Update: {
          buyer_name?: string | null
          converted?: boolean
          converted_at?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_reminder_at?: string | null
          opened_at?: string
          organization_id?: string
          product_id?: string
          reminder_sent_count?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abandoned_carts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_attributions: {
        Row: {
          affiliate_link_id: string | null
          captured_at: string
          converted: boolean
          cookie_id: string
          created_at: string
          expires_at: string
          id: string
          landing_url: string | null
          user_id: string | null
        }
        Insert: {
          affiliate_link_id?: string | null
          captured_at?: string
          converted?: boolean
          cookie_id: string
          created_at?: string
          expires_at?: string
          id?: string
          landing_url?: string | null
          user_id?: string | null
        }
        Update: {
          affiliate_link_id?: string | null
          captured_at?: string
          converted?: boolean
          cookie_id?: string
          created_at?: string
          expires_at?: string
          id?: string
          landing_url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_attributions_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_links: {
        Row: {
          campaign_id: string | null
          clicks: number | null
          code: string
          conversions: number | null
          created_at: string | null
          freeze_reason: string | null
          id: string
          is_active: boolean | null
          is_frozen: boolean | null
          link_type: string | null
          organization_id: string
          product_id: string | null
          total_earned: number | null
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          clicks?: number | null
          code: string
          conversions?: number | null
          created_at?: string | null
          freeze_reason?: string | null
          id?: string
          is_active?: boolean | null
          is_frozen?: boolean | null
          link_type?: string | null
          organization_id: string
          product_id?: string | null
          total_earned?: number | null
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          clicks?: number | null
          code?: string
          conversions?: number | null
          created_at?: string | null
          freeze_reason?: string | null
          id?: string
          is_active?: boolean | null
          is_frozen?: boolean | null
          link_type?: string | null
          organization_id?: string
          product_id?: string | null
          total_earned?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_links_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_sales: {
        Row: {
          affiliate_link_id: string
          affiliate_user_id: string
          commission_amount: number
          commission_percent: number
          created_at: string | null
          gross_amount: number
          id: string
          organization_id: string
          paid_at: string | null
          payable_at: string | null
          status: Database["public"]["Enums"]["affiliate_sale_status"] | null
          transaction_id: string
          transaction_type: string
        }
        Insert: {
          affiliate_link_id: string
          affiliate_user_id: string
          commission_amount: number
          commission_percent: number
          created_at?: string | null
          gross_amount: number
          id?: string
          organization_id: string
          paid_at?: string | null
          payable_at?: string | null
          status?: Database["public"]["Enums"]["affiliate_sale_status"] | null
          transaction_id: string
          transaction_type: string
        }
        Update: {
          affiliate_link_id?: string
          affiliate_user_id?: string
          commission_amount?: number
          commission_percent?: number
          created_at?: string | null
          gross_amount?: number
          id?: string
          organization_id?: string
          paid_at?: string | null
          payable_at?: string | null
          status?: Database["public"]["Enums"]["affiliate_sale_status"] | null
          transaction_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_sales_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_assets: {
        Row: {
          asset_type: string
          created_at: string
          id: string
          job_id: string | null
          metadata: Json
          mime_type: string | null
          org_id: string
          project_id: string | null
          storage_bucket: string
          storage_path: string
        }
        Insert: {
          asset_type: string
          created_at?: string
          id?: string
          job_id?: string | null
          metadata?: Json
          mime_type?: string | null
          org_id: string
          project_id?: string | null
          storage_bucket: string
          storage_path: string
        }
        Update: {
          asset_type?: string
          created_at?: string
          id?: string
          job_id?: string | null
          metadata?: Json
          mime_type?: string | null
          org_id?: string
          project_id?: string | null
          storage_bucket?: string
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_assets_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ai_generation_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_assets_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ai_content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_content_projects: {
        Row: {
          age_range: string | null
          art_style: string | null
          characters: string | null
          created_at: string
          created_by: string
          data_json: Json
          description: string | null
          id: string
          keywords: string[] | null
          language: string
          line_art_style: string | null
          linked_media_id: string | null
          linked_product_id: string | null
          linked_program_id: string | null
          moral: string | null
          objective: string | null
          organization_id: string
          project_type: Database["public"]["Enums"]["ai_project_type"]
          published_at: string | null
          quality_flags: string[] | null
          quality_score: number | null
          requires_human_review: boolean | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          sermon_points: Json | null
          sermon_text: string | null
          sermon_theme: string | null
          status: Database["public"]["Enums"]["ai_project_status"]
          structure_json: Json | null
          style_notes: string | null
          target_audience: string | null
          target_length: number | null
          template_id: string | null
          title: string
          tone: string | null
          updated_at: string
        }
        Insert: {
          age_range?: string | null
          art_style?: string | null
          characters?: string | null
          created_at?: string
          created_by: string
          data_json?: Json
          description?: string | null
          id?: string
          keywords?: string[] | null
          language?: string
          line_art_style?: string | null
          linked_media_id?: string | null
          linked_product_id?: string | null
          linked_program_id?: string | null
          moral?: string | null
          objective?: string | null
          organization_id: string
          project_type?: Database["public"]["Enums"]["ai_project_type"]
          published_at?: string | null
          quality_flags?: string[] | null
          quality_score?: number | null
          requires_human_review?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sermon_points?: Json | null
          sermon_text?: string | null
          sermon_theme?: string | null
          status?: Database["public"]["Enums"]["ai_project_status"]
          structure_json?: Json | null
          style_notes?: string | null
          target_audience?: string | null
          target_length?: number | null
          template_id?: string | null
          title: string
          tone?: string | null
          updated_at?: string
        }
        Update: {
          age_range?: string | null
          art_style?: string | null
          characters?: string | null
          created_at?: string
          created_by?: string
          data_json?: Json
          description?: string | null
          id?: string
          keywords?: string[] | null
          language?: string
          line_art_style?: string | null
          linked_media_id?: string | null
          linked_product_id?: string | null
          linked_program_id?: string | null
          moral?: string | null
          objective?: string | null
          organization_id?: string
          project_type?: Database["public"]["Enums"]["ai_project_type"]
          published_at?: string | null
          quality_flags?: string[] | null
          quality_score?: number | null
          requires_human_review?: boolean | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sermon_points?: Json | null
          sermon_text?: string | null
          sermon_theme?: string | null
          status?: Database["public"]["Enums"]["ai_project_status"]
          structure_json?: Json | null
          style_notes?: string | null
          target_audience?: string | null
          target_length?: number | null
          template_id?: string | null
          title?: string
          tone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_content_projects_linked_media_id_fkey"
            columns: ["linked_media_id"]
            isOneToOne: false
            referencedRelation: "media_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_projects_linked_product_id_fkey"
            columns: ["linked_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_projects_linked_program_id_fkey"
            columns: ["linked_program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_content_projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generation_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          error_message: string | null
          estimated_cost_units: number | null
          id: string
          input_params: Json | null
          job_type: Database["public"]["Enums"]["ai_job_type"]
          organization_id: string
          output_data: Json | null
          progress: number | null
          project_id: string
          provider: string
          result_summary: Json
          started_at: string | null
          status: Database["public"]["Enums"]["ai_job_status"]
          template_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          error_message?: string | null
          estimated_cost_units?: number | null
          id?: string
          input_params?: Json | null
          job_type: Database["public"]["Enums"]["ai_job_type"]
          organization_id: string
          output_data?: Json | null
          progress?: number | null
          project_id: string
          provider?: string
          result_summary?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_job_status"]
          template_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          error_message?: string | null
          estimated_cost_units?: number | null
          id?: string
          input_params?: Json | null
          job_type?: Database["public"]["Enums"]["ai_job_type"]
          organization_id?: string
          output_data?: Json | null
          progress?: number | null
          project_id?: string
          provider?: string
          result_summary?: Json
          started_at?: string | null
          status?: Database["public"]["Enums"]["ai_job_status"]
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_jobs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_jobs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ai_content_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_generation_jobs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ai_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_policies: {
        Row: {
          applies_to: Database["public"]["Enums"]["ai_project_type"][] | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          requires_human_review: boolean | null
          rules: Json
          updated_at: string
        }
        Insert: {
          applies_to?: Database["public"]["Enums"]["ai_project_type"][] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          requires_human_review?: boolean | null
          rules?: Json
          updated_at?: string
        }
        Update: {
          applies_to?: Database["public"]["Enums"]["ai_project_type"][] | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          requires_human_review?: boolean | null
          rules?: Json
          updated_at?: string
        }
        Relationships: []
      }
      ai_policy_profiles: {
        Row: {
          created_at: string
          id: string
          name: string
          requires_human_review: boolean
          rules_json: Json
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          requires_human_review?: boolean
          rules_json?: Json
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          requires_human_review?: boolean
          rules_json?: Json
        }
        Relationships: []
      }
      ai_project_assets: {
        Row: {
          asset_type: Database["public"]["Enums"]["ai_asset_type"]
          created_at: string
          display_order: number | null
          file_size: number | null
          file_url: string
          id: string
          is_cover: boolean | null
          is_preview: boolean | null
          label: string | null
          metadata: Json | null
          mime_type: string | null
          organization_id: string
          project_id: string
        }
        Insert: {
          asset_type?: Database["public"]["Enums"]["ai_asset_type"]
          created_at?: string
          display_order?: number | null
          file_size?: number | null
          file_url: string
          id?: string
          is_cover?: boolean | null
          is_preview?: boolean | null
          label?: string | null
          metadata?: Json | null
          mime_type?: string | null
          organization_id: string
          project_id: string
        }
        Update: {
          asset_type?: Database["public"]["Enums"]["ai_asset_type"]
          created_at?: string
          display_order?: number | null
          file_size?: number | null
          file_url?: string
          id?: string
          is_cover?: boolean | null
          is_preview?: boolean | null
          label?: string | null
          metadata?: Json | null
          mime_type?: string | null
          organization_id?: string
          project_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_project_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_project_assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ai_content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_quality_scores: {
        Row: {
          created_at: string
          flags_json: Json
          id: string
          job_id: string
          org_id: string
          project_id: string | null
          review_notes: string | null
          review_required: boolean
          review_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          score_overall: number | null
          scores_json: Json
        }
        Insert: {
          created_at?: string
          flags_json?: Json
          id?: string
          job_id: string
          org_id: string
          project_id?: string | null
          review_notes?: string | null
          review_required?: boolean
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score_overall?: number | null
          scores_json?: Json
        }
        Update: {
          created_at?: string
          flags_json?: Json
          id?: string
          job_id?: string
          org_id?: string
          project_id?: string | null
          review_notes?: string | null
          review_required?: boolean
          review_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          score_overall?: number | null
          scores_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "ai_quality_scores_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "ai_generation_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_quality_scores_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_quality_scores_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ai_content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_templates: {
        Row: {
          created_at: string
          created_by: string | null
          default_params: Json | null
          description: string | null
          display_order: number | null
          id: string
          is_active: boolean | null
          is_global: boolean | null
          name: string
          organization_id: string | null
          policy_profile_id: string | null
          project_type: Database["public"]["Enums"]["ai_project_type"]
          prompt_system: string | null
          prompt_template: string | null
          prompt_user_pattern: string | null
          template_type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          default_params?: Json | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          name: string
          organization_id?: string | null
          policy_profile_id?: string | null
          project_type: Database["public"]["Enums"]["ai_project_type"]
          prompt_system?: string | null
          prompt_template?: string | null
          prompt_user_pattern?: string | null
          template_type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          default_params?: Json | null
          description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean | null
          is_global?: boolean | null
          name?: string
          organization_id?: string | null
          policy_profile_id?: string | null
          project_type?: Database["public"]["Enums"]["ai_project_type"]
          prompt_system?: string | null
          prompt_template?: string | null
          prompt_user_pattern?: string | null
          template_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_templates_policy_profile_id_fkey"
            columns: ["policy_profile_id"]
            isOneToOne: false
            referencedRelation: "ai_policy_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          body: string
          created_at: string | null
          created_by: string | null
          expires_at: string | null
          id: string
          image_position: string | null
          image_url: string | null
          is_pinned: boolean | null
          is_published: boolean | null
          organization_id: string
          publication_status: string
          published_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_at: string | null
          submitted_for_review_at: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_position?: string | null
          image_url?: string | null
          is_pinned?: boolean | null
          is_published?: boolean | null
          organization_id: string
          publication_status?: string
          published_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          submitted_for_review_at?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          created_by?: string | null
          expires_at?: string | null
          id?: string
          image_position?: string | null
          image_url?: string | null
          is_pinned?: boolean | null
          is_published?: boolean | null
          organization_id?: string
          publication_status?: string
          published_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          submitted_for_review_at?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "announcements_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          organization_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      badges: {
        Row: {
          condition_type: string
          condition_value: number
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
        }
        Insert: {
          condition_type?: string
          condition_value?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
        }
        Update: {
          condition_type?: string
          condition_value?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bundle_items: {
        Row: {
          bundle_product_id: string
          created_at: string
          display_order: number | null
          id: string
          included_product_id: string
        }
        Insert: {
          bundle_product_id: string
          created_at?: string
          display_order?: number | null
          id?: string
          included_product_id: string
        }
        Update: {
          bundle_product_id?: string
          created_at?: string
          display_order?: number | null
          id?: string
          included_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bundle_items_bundle_product_id_fkey"
            columns: ["bundle_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bundle_items_included_product_id_fkey"
            columns: ["included_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
      client_events: {
        Row: {
          created_at: string
          device_type: string | null
          event_data: Json | null
          event_name: string
          id: string
          page_url: string | null
          referrer: string | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_type?: string | null
          event_data?: Json | null
          event_name: string
          id?: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_type?: string | null
          event_data?: Json | null
          event_name?: string
          id?: string
          page_url?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      coloring_book_projects: {
        Row: {
          created_at: string
          id: string
          line_art_style: string
          org_id: string
          pages_count: number
          pages_json: Json
          project_id: string
          theme: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_art_style?: string
          org_id: string
          pages_count?: number
          pages_json?: Json
          project_id: string
          theme: string
        }
        Update: {
          created_at?: string
          id?: string
          line_art_style?: string
          org_id?: string
          pages_count?: number
          pages_json?: Json
          project_id?: string
          theme?: string
        }
        Relationships: [
          {
            foreignKeyName: "coloring_book_projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coloring_book_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ai_content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          created_at: string
          email: string
          id: string
          is_subscribed: boolean
          metadata: Json | null
          name: string | null
          organization_id: string
          phone: string | null
          source: string | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_subscribed?: boolean
          metadata?: Json | null
          name?: string | null
          organization_id: string
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_subscribed?: boolean
          metadata?: Json | null
          name?: string | null
          organization_id?: string
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      content_comments: {
        Row: {
          body: string
          content_id: string
          content_type: string
          created_at: string
          id: string
          is_hidden: boolean
          parent_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          is_hidden?: boolean
          parent_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "content_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_reports: {
        Row: {
          content_id: string
          content_type: string
          created_at: string | null
          id: string
          organization_id: string | null
          reason: string
          reporter_user_id: string
          status: Database["public"]["Enums"]["report_status"] | null
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          reason: string
          reporter_user_id: string
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          reason?: string
          reporter_user_id?: string
          status?: Database["public"]["Enums"]["report_status"] | null
        }
        Relationships: []
      }
      content_scripture_links: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          note: string | null
          org_id: string
          scripture_reference_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          note?: string | null
          org_id: string
          scripture_reference_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          note?: string | null
          org_id?: string
          scripture_reference_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_scripture_links_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_scripture_links_scripture_reference_id_fkey"
            columns: ["scripture_reference_id"]
            isOneToOne: false
            referencedRelation: "scripture_references"
            referencedColumns: ["id"]
          },
        ]
      }
      content_versions: {
        Row: {
          changed_by: string | null
          content_id: string
          content_type: string
          created_at: string
          id: string
          snapshot: Json
          version_number: number
        }
        Insert: {
          changed_by?: string | null
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          snapshot?: Json
          version_number?: number
        }
        Update: {
          changed_by?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          snapshot?: Json
          version_number?: number
        }
        Relationships: []
      }
      digital_products: {
        Row: {
          ai_generated: boolean
          ai_project_id: string | null
          average_rating: number | null
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          external_link: string | null
          faq_json: Json | null
          featured_score: number | null
          file_url: string | null
          fts_vector: unknown
          guarantee_text: string | null
          id: string
          is_bundle: boolean | null
          is_express_demo: boolean
          is_featured: boolean | null
          is_free: boolean | null
          is_published: boolean | null
          order_bump_discount_percent: number | null
          order_bump_product_id: string | null
          organization_id: string
          page_count: number | null
          preview_images: string[] | null
          preview_page_count: number | null
          price: number | null
          product_type: string | null
          publication_status: string
          review_count: number | null
          reviewed_at: string | null
          reviewed_by: string | null
          sale_ends_at: string | null
          sale_price: number | null
          sales_count: number | null
          scheduled_at: string | null
          slug: string | null
          submitted_for_review_at: string | null
          testimonials_json: Json | null
          title: string
          updated_at: string | null
          upsell_product_ids: string[] | null
        }
        Insert: {
          ai_generated?: boolean
          ai_project_id?: string | null
          average_rating?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          external_link?: string | null
          faq_json?: Json | null
          featured_score?: number | null
          file_url?: string | null
          fts_vector?: unknown
          guarantee_text?: string | null
          id?: string
          is_bundle?: boolean | null
          is_express_demo?: boolean
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          order_bump_discount_percent?: number | null
          order_bump_product_id?: string | null
          organization_id: string
          page_count?: number | null
          preview_images?: string[] | null
          preview_page_count?: number | null
          price?: number | null
          product_type?: string | null
          publication_status?: string
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sale_ends_at?: string | null
          sale_price?: number | null
          sales_count?: number | null
          scheduled_at?: string | null
          slug?: string | null
          submitted_for_review_at?: string | null
          testimonials_json?: Json | null
          title: string
          updated_at?: string | null
          upsell_product_ids?: string[] | null
        }
        Update: {
          ai_generated?: boolean
          ai_project_id?: string | null
          average_rating?: number | null
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          external_link?: string | null
          faq_json?: Json | null
          featured_score?: number | null
          file_url?: string | null
          fts_vector?: unknown
          guarantee_text?: string | null
          id?: string
          is_bundle?: boolean | null
          is_express_demo?: boolean
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          order_bump_discount_percent?: number | null
          order_bump_product_id?: string | null
          organization_id?: string
          page_count?: number | null
          preview_images?: string[] | null
          preview_page_count?: number | null
          price?: number | null
          product_type?: string | null
          publication_status?: string
          review_count?: number | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          sale_ends_at?: string | null
          sale_price?: number | null
          sales_count?: number | null
          scheduled_at?: string | null
          slug?: string | null
          submitted_for_review_at?: string | null
          testimonials_json?: Json | null
          title?: string
          updated_at?: string | null
          upsell_product_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_products_ai_project_id_fkey"
            columns: ["ai_project_id"]
            isOneToOne: false
            referencedRelation: "ai_content_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "digital_products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      directory_applications: {
        Row: {
          created_at: string
          decision_reason: string | null
          id: string
          organization_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
        }
        Insert: {
          created_at?: string
          decision_reason?: string | null
          id?: string
          organization_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
        }
        Update: {
          created_at?: string
          decision_reason?: string | null
          id?: string
          organization_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "directory_applications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_campaigns: {
        Row: {
          created_at: string | null
          created_by: string | null
          currency: string | null
          current_amount: number | null
          description: string | null
          end_date: string | null
          featured_score: number | null
          goal_amount: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_express_demo: boolean
          is_featured: boolean | null
          is_published: boolean | null
          organization_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_amount?: number | null
          description?: string | null
          end_date?: string | null
          featured_score?: number | null
          goal_amount?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_express_demo?: boolean
          is_featured?: boolean | null
          is_published?: boolean | null
          organization_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          current_amount?: number | null
          description?: string | null
          end_date?: string | null
          featured_score?: number | null
          goal_amount?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_express_demo?: boolean
          is_featured?: boolean | null
          is_published?: boolean | null
          organization_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donation_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          affiliate_commission: number | null
          affiliate_link_id: string | null
          amount: number
          buyer_ip: string | null
          campaign_id: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          device_hash: string | null
          dispute_id: string | null
          dispute_status: string | null
          donor_email: string | null
          donor_name: string | null
          gateway: string | null
          id: string
          is_recurring: boolean | null
          organization_amount: number | null
          organization_id: string
          paystack_reference: string
          platform_fee: number | null
          promo_code_id: string | null
          settlement_released_at: string | null
          settlement_status: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          user_id: string | null
        }
        Insert: {
          affiliate_commission?: number | null
          affiliate_link_id?: string | null
          amount: number
          buyer_ip?: string | null
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          device_hash?: string | null
          dispute_id?: string | null
          dispute_status?: string | null
          donor_email?: string | null
          donor_name?: string | null
          gateway?: string | null
          id?: string
          is_recurring?: boolean | null
          organization_amount?: number | null
          organization_id: string
          paystack_reference: string
          platform_fee?: number | null
          promo_code_id?: string | null
          settlement_released_at?: string | null
          settlement_status?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          user_id?: string | null
        }
        Update: {
          affiliate_commission?: number | null
          affiliate_link_id?: string | null
          amount?: number
          buyer_ip?: string | null
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          device_hash?: string | null
          dispute_id?: string | null
          dispute_status?: string | null
          donor_email?: string | null
          donor_name?: string | null
          gateway?: string | null
          id?: string
          is_recurring?: boolean | null
          organization_amount?: number | null
          organization_id?: string
          paystack_reference?: string
          platform_fee?: number | null
          promo_code_id?: string | null
          settlement_released_at?: string | null
          settlement_status?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "donation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      download_logs: {
        Row: {
          created_at: string
          id: string
          ip_address: string | null
          purchase_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address?: string | null
          purchase_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string | null
          purchase_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_logs_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "product_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          body: string
          click_count: number | null
          created_at: string
          created_by: string | null
          id: string
          open_count: number | null
          organization_id: string
          recipient_count: number | null
          recipient_tags: string[] | null
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          body: string
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          open_count?: number | null
          organization_id: string
          recipient_count?: number | null
          recipient_tags?: string[] | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          body?: string
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          id?: string
          open_count?: number | null
          organization_id?: string
          recipient_count?: number | null
          recipient_tags?: string[] | null
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_logs: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          recipient: string
          resend_message_id: string | null
          status: string
          subject: string | null
          template: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          recipient: string
          resend_message_id?: string | null
          status?: string
          subject?: string | null
          template: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          recipient?: string
          resend_message_id?: string | null
          status?: string
          subject?: string | null
          template?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          display_order: number | null
          event_date: string | null
          fts_vector: unknown
          id: string
          image_url: string | null
          is_featured: boolean | null
          is_published: boolean | null
          location: string | null
          organization_id: string
          publication_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_at: string | null
          submitted_for_review_at: string | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          event_date?: string | null
          fts_vector?: unknown
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          location?: string | null
          organization_id: string
          publication_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          submitted_for_review_at?: string | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          display_order?: number | null
          event_date?: string | null
          fts_vector?: unknown
          id?: string
          image_url?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          location?: string | null
          organization_id?: string
          publication_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          submitted_for_review_at?: string | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          traffic_percent: number
          updated_at: string
          variants: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          traffic_percent?: number
          updated_at?: string
          variants?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          traffic_percent?: number
          updated_at?: string
          variants?: Json
        }
        Relationships: []
      }
      fraud_flags: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          organization_id: string | null
          reason: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          reason: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          reason?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fraud_flags_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      kids_book_projects: {
        Row: {
          age_range: string
          character_bible_json: Json
          created_at: string
          id: string
          org_id: string
          pages_json: Json
          project_id: string
          safety_status: string
          style: string | null
        }
        Insert: {
          age_range: string
          character_bible_json?: Json
          created_at?: string
          id?: string
          org_id: string
          pages_json?: Json
          project_id: string
          safety_status?: string
          style?: string | null
        }
        Update: {
          age_range?: string
          character_bible_json?: Json
          created_at?: string
          id?: string
          org_id?: string
          pages_json?: Json
          project_id?: string
          safety_status?: string
          style?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kids_book_projects_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kids_book_projects_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "ai_content_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      kyc_submissions: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          id: string
          id_document_type: string | null
          id_document_url: string | null
          kyc_level: number | null
          org_document_type: string | null
          org_document_url: string | null
          organization_id: string
          paystack_recipient_code: string | null
          phone_verified: boolean | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          submitted_at: string | null
          submitted_by: string
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          id?: string
          id_document_type?: string | null
          id_document_url?: string | null
          kyc_level?: number | null
          org_document_type?: string | null
          org_document_url?: string | null
          organization_id: string
          paystack_recipient_code?: string | null
          phone_verified?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by: string
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          id?: string
          id_document_type?: string | null
          id_document_url?: string | null
          kyc_level?: number | null
          org_document_type?: string | null
          org_document_url?: string | null
          organization_id?: string
          paystack_recipient_code?: string | null
          phone_verified?: boolean | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          submitted_at?: string | null
          submitted_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "kyc_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "program_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      media_content: {
        Row: {
          aspect_ratio: string | null
          created_at: string | null
          created_by: string
          description: string | null
          display_order: number | null
          duration_seconds: number | null
          fts_vector: unknown
          id: string
          is_featured: boolean | null
          is_premium: boolean | null
          is_published: boolean | null
          like_count: number | null
          media_type: Database["public"]["Enums"]["media_type"] | null
          media_url: string | null
          organization_id: string
          publication_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_at: string | null
          series: string | null
          speaker: string | null
          submitted_for_review_at: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          aspect_ratio?: string | null
          created_at?: string | null
          created_by: string
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          fts_vector?: unknown
          id?: string
          is_featured?: boolean | null
          is_premium?: boolean | null
          is_published?: boolean | null
          like_count?: number | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          organization_id: string
          publication_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          series?: string | null
          speaker?: string | null
          submitted_for_review_at?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          aspect_ratio?: string | null
          created_at?: string | null
          created_by?: string
          description?: string | null
          display_order?: number | null
          duration_seconds?: number | null
          fts_vector?: unknown
          id?: string
          is_featured?: boolean | null
          is_premium?: boolean | null
          is_published?: boolean | null
          like_count?: number | null
          media_type?: Database["public"]["Enums"]["media_type"] | null
          media_url?: string | null
          organization_id?: string
          publication_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          series?: string | null
          speaker?: string | null
          submitted_for_review_at?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_content_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      media_likes: {
        Row: {
          created_at: string | null
          id: string
          media_id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_id: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          media_id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_likes_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_content"
            referencedColumns: ["id"]
          },
        ]
      }
      media_saves: {
        Row: {
          created_at: string | null
          id: string
          media_id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          media_id: string
          organization_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          media_id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "media_saves_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_content"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          affiliate: boolean
          announcements: boolean
          comments: boolean
          created_at: string
          donations: boolean
          email_enabled: boolean
          events: boolean
          id: string
          marketing: boolean
          programs: boolean
          purchases: boolean
          push_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          affiliate?: boolean
          announcements?: boolean
          comments?: boolean
          created_at?: string
          donations?: boolean
          email_enabled?: boolean
          events?: boolean
          id?: string
          marketing?: boolean
          programs?: boolean
          purchases?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          affiliate?: boolean
          announcements?: boolean
          comments?: boolean
          created_at?: string
          donations?: boolean
          email_enabled?: boolean
          events?: boolean
          id?: string
          marketing?: boolean
          programs?: boolean
          purchases?: boolean
          push_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offering_transactions: {
        Row: {
          affiliate_commission: number | null
          affiliate_link_id: string | null
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          donor_email: string | null
          donor_name: string | null
          id: string
          is_recurring: boolean
          offering_id: string
          organization_amount: number | null
          organization_id: string
          payment_gateway: string | null
          payment_reference: string | null
          platform_fee: number | null
          recurring_interval: string | null
          settlement_released_at: string | null
          settlement_status: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          affiliate_commission?: number | null
          affiliate_link_id?: string | null
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          is_recurring?: boolean
          offering_id: string
          organization_amount?: number | null
          organization_id: string
          payment_gateway?: string | null
          payment_reference?: string | null
          platform_fee?: number | null
          recurring_interval?: string | null
          settlement_released_at?: string | null
          settlement_status?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          affiliate_commission?: number | null
          affiliate_link_id?: string | null
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          is_recurring?: boolean
          offering_id?: string
          organization_amount?: number | null
          organization_id?: string
          payment_gateway?: string | null
          payment_reference?: string | null
          platform_fee?: number | null
          recurring_interval?: string | null
          settlement_released_at?: string | null
          settlement_status?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "offering_transactions_affiliate_link_id_fkey"
            columns: ["affiliate_link_id"]
            isOneToOne: false
            referencedRelation: "affiliate_links"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offering_transactions_offering_id_fkey"
            columns: ["offering_id"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offering_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      offerings: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string
          description: string | null
          display_order: number | null
          id: string
          image_url: string | null
          is_active: boolean
          is_recurring_allowed: boolean
          organization_id: string
          preset_amounts: number[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_recurring_allowed?: boolean
          organization_id: string
          preset_amounts?: number[] | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string
          description?: string | null
          display_order?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_recurring_allowed?: boolean
          organization_id?: string
          preset_amounts?: number[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offerings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_daily_metrics: {
        Row: {
          affiliate_commission_total: number | null
          affiliate_sales_count: number | null
          created_at: string
          donations_count: number | null
          id: string
          metric_date: string
          new_members: number | null
          organization_id: string
          page_views: number | null
          products_sold: number | null
          revenue: number | null
          transactions_count: number | null
        }
        Insert: {
          affiliate_commission_total?: number | null
          affiliate_sales_count?: number | null
          created_at?: string
          donations_count?: number | null
          id?: string
          metric_date: string
          new_members?: number | null
          organization_id: string
          page_views?: number | null
          products_sold?: number | null
          revenue?: number | null
          transactions_count?: number | null
        }
        Update: {
          affiliate_commission_total?: number | null
          affiliate_sales_count?: number | null
          created_at?: string
          donations_count?: number | null
          id?: string
          metric_date?: string
          new_members?: number | null
          organization_id?: string
          page_views?: number | null
          products_sold?: number | null
          revenue?: number | null
          transactions_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "org_daily_metrics_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_page_settings: {
        Row: {
          facebook_pixel_id: string | null
          google_tag_id: string | null
          hidden_sections: string[] | null
          id: string
          organization_id: string
          popup_config: Json | null
          section_order: string[] | null
          theme_accent_color: string | null
          theme_primary_color: string | null
          tiktok_pixel_id: string | null
          updated_at: string
        }
        Insert: {
          facebook_pixel_id?: string | null
          google_tag_id?: string | null
          hidden_sections?: string[] | null
          id?: string
          organization_id: string
          popup_config?: Json | null
          section_order?: string[] | null
          theme_accent_color?: string | null
          theme_primary_color?: string | null
          tiktok_pixel_id?: string | null
          updated_at?: string
        }
        Update: {
          facebook_pixel_id?: string | null
          google_tag_id?: string | null
          hidden_sections?: string[] | null
          id?: string
          organization_id?: string
          popup_config?: Json | null
          section_order?: string[] | null
          theme_accent_color?: string | null
          theme_primary_color?: string | null
          tiktok_pixel_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_page_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          created_by: string | null
          display_order: number | null
          id: string
          image_url: string
          is_published: boolean | null
          organization_id: string
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          image_url: string
          is_published?: boolean | null
          organization_id: string
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          created_by?: string | null
          display_order?: number | null
          id?: string
          image_url?: string
          is_published?: boolean | null
          organization_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_photos_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string | null
          organization_id: string
          role: Database["public"]["Enums"]["org_member_role"] | null
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id: string
          role?: Database["public"]["Enums"]["org_member_role"] | null
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          organization_id?: string
          role?: Database["public"]["Enums"]["org_member_role"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          affiliation_commission_percent: number | null
          affiliation_enabled: boolean | null
          banner_url: string | null
          category: Database["public"]["Enums"]["org_category"] | null
          country: string | null
          country_code: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          fts_vector: unknown
          id: string
          is_active: boolean | null
          is_suspended: boolean | null
          is_verified: boolean | null
          kyc_status: Database["public"]["Enums"]["kyc_status"] | null
          leader_bio: string | null
          leader_image_url: string | null
          leader_name: string | null
          leader_title: string | null
          logo_url: string | null
          momo_number: string | null
          momo_provider: string | null
          monetization_enabled: boolean | null
          name: string
          offerings_enabled: boolean
          owner_id: string
          payout_freeze_reason: string | null
          payout_method: string | null
          payouts_frozen: boolean | null
          payouts_frozen_until: string | null
          paystack_recipient_code: string | null
          paystack_subaccount_code: string | null
          plan_type: Database["public"]["Enums"]["org_plan"] | null
          platform_fee_percent: number | null
          settlement_released: boolean | null
          slug: string
          stripe_account_id: string | null
          stripe_onboarding_complete: boolean
          suspended_until: string | null
          suspension_reason: string | null
          updated_at: string | null
          webhook_events: string[] | null
          webhook_url: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          affiliation_commission_percent?: number | null
          affiliation_enabled?: boolean | null
          banner_url?: string | null
          category?: Database["public"]["Enums"]["org_category"] | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          fts_vector?: unknown
          id?: string
          is_active?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          leader_bio?: string | null
          leader_image_url?: string | null
          leader_name?: string | null
          leader_title?: string | null
          logo_url?: string | null
          momo_number?: string | null
          momo_provider?: string | null
          monetization_enabled?: boolean | null
          name: string
          offerings_enabled?: boolean
          owner_id: string
          payout_freeze_reason?: string | null
          payout_method?: string | null
          payouts_frozen?: boolean | null
          payouts_frozen_until?: string | null
          paystack_recipient_code?: string | null
          paystack_subaccount_code?: string | null
          plan_type?: Database["public"]["Enums"]["org_plan"] | null
          platform_fee_percent?: number | null
          settlement_released?: boolean | null
          slug: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          suspended_until?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          webhook_events?: string[] | null
          webhook_url?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          affiliation_commission_percent?: number | null
          affiliation_enabled?: boolean | null
          banner_url?: string | null
          category?: Database["public"]["Enums"]["org_category"] | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          fts_vector?: unknown
          id?: string
          is_active?: boolean | null
          is_suspended?: boolean | null
          is_verified?: boolean | null
          kyc_status?: Database["public"]["Enums"]["kyc_status"] | null
          leader_bio?: string | null
          leader_image_url?: string | null
          leader_name?: string | null
          leader_title?: string | null
          logo_url?: string | null
          momo_number?: string | null
          momo_provider?: string | null
          monetization_enabled?: boolean | null
          name?: string
          offerings_enabled?: boolean
          owner_id?: string
          payout_freeze_reason?: string | null
          payout_method?: string | null
          payouts_frozen?: boolean | null
          payouts_frozen_until?: string | null
          paystack_recipient_code?: string | null
          paystack_subaccount_code?: string | null
          plan_type?: Database["public"]["Enums"]["org_plan"] | null
          platform_fee_percent?: number | null
          settlement_released?: boolean | null
          slug?: string
          stripe_account_id?: string | null
          stripe_onboarding_complete?: boolean
          suspended_until?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          webhook_events?: string[] | null
          webhook_url?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      partner_commissions: {
        Row: {
          commission_amount: number
          commission_percent: number
          created_at: string
          currency: string
          id: string
          organization_id: string
          paid_at: string | null
          partner_id: string
          payable_at: string | null
          payment_reference: string
          payout_request_id: string | null
          platform_fee_amount: number
          status: Database["public"]["Enums"]["partner_commission_status"]
        }
        Insert: {
          commission_amount: number
          commission_percent: number
          created_at?: string
          currency?: string
          id?: string
          organization_id: string
          paid_at?: string | null
          partner_id: string
          payable_at?: string | null
          payment_reference: string
          payout_request_id?: string | null
          platform_fee_amount: number
          status?: Database["public"]["Enums"]["partner_commission_status"]
        }
        Update: {
          commission_amount?: number
          commission_percent?: number
          created_at?: string
          currency?: string
          id?: string
          organization_id?: string
          paid_at?: string | null
          partner_id?: string
          payable_at?: string | null
          payment_reference?: string
          payout_request_id?: string | null
          platform_fee_amount?: number
          status?: Database["public"]["Enums"]["partner_commission_status"]
        }
        Relationships: [
          {
            foreignKeyName: "fk_commission_payout"
            columns: ["payout_request_id"]
            isOneToOne: false
            referencedRelation: "partner_payout_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_commissions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_payout_requests: {
        Row: {
          amount: number
          commission_ids: string[] | null
          currency: string
          failure_reason: string | null
          id: string
          metadata: Json | null
          paid_at: string | null
          partner_id: string
          paystack_reference: string | null
          paystack_transfer_code: string | null
          processed_at: string | null
          processed_by: string | null
          requested_at: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["partner_payout_status"]
        }
        Insert: {
          amount: number
          commission_ids?: string[] | null
          currency?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          partner_id: string
          paystack_reference?: string | null
          paystack_transfer_code?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["partner_payout_status"]
        }
        Update: {
          amount?: number
          commission_ids?: string[] | null
          currency?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json | null
          paid_at?: string | null
          partner_id?: string
          paystack_reference?: string | null
          paystack_transfer_code?: string | null
          processed_at?: string | null
          processed_by?: string | null
          requested_at?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["partner_payout_status"]
        }
        Relationships: [
          {
            foreignKeyName: "partner_payout_requests_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_referrals: {
        Row: {
          attributed_at: string
          id: string
          locked_at: string | null
          notes: string | null
          organization_id: string
          partner_id: string
          status: Database["public"]["Enums"]["partner_referral_status"]
        }
        Insert: {
          attributed_at?: string
          id?: string
          locked_at?: string | null
          notes?: string | null
          organization_id: string
          partner_id: string
          status?: Database["public"]["Enums"]["partner_referral_status"]
        }
        Update: {
          attributed_at?: string
          id?: string
          locked_at?: string | null
          notes?: string | null
          organization_id?: string
          partner_id?: string
          status?: Database["public"]["Enums"]["partner_referral_status"]
        }
        Relationships: [
          {
            foreignKeyName: "partner_referrals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_referrals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          city: string | null
          country: string
          created_at: string
          custom_rate_override: number | null
          email: string
          experience_description: string | null
          full_name: string
          how_heard_about_us: string | null
          id: string
          id_document_type: string | null
          id_document_url: string | null
          invite_code: string | null
          invite_link_slug: string | null
          invite_uses_count: number
          kyc_rejection_reason: string | null
          kyc_reviewed_at: string | null
          kyc_reviewed_by: string | null
          kyc_status: string
          kyc_submitted_at: string | null
          last_invite_used_at: string | null
          level: number
          min_payout_threshold: number
          motivation: string | null
          network_size: string | null
          notes: string | null
          organization_name: string | null
          organization_type: string | null
          payout_account_name: string | null
          payout_account_number: string | null
          payout_bank_code: string | null
          payout_country: string | null
          payout_method: string | null
          payout_provider: string | null
          paystack_recipient_code: string | null
          phone: string | null
          profession: string | null
          rate_percent: number
          scope: Database["public"]["Enums"]["partner_scope"]
          selfie_url: string | null
          social_media_url: string | null
          status: Database["public"]["Enums"]["partner_status"]
          suspended_at: string | null
          suspension_reason: string | null
          target_audience: string | null
          terms_accepted_at: string | null
          updated_at: string
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          country?: string
          created_at?: string
          custom_rate_override?: number | null
          email: string
          experience_description?: string | null
          full_name: string
          how_heard_about_us?: string | null
          id?: string
          id_document_type?: string | null
          id_document_url?: string | null
          invite_code?: string | null
          invite_link_slug?: string | null
          invite_uses_count?: number
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_reviewed_by?: string | null
          kyc_status?: string
          kyc_submitted_at?: string | null
          last_invite_used_at?: string | null
          level?: number
          min_payout_threshold?: number
          motivation?: string | null
          network_size?: string | null
          notes?: string | null
          organization_name?: string | null
          organization_type?: string | null
          payout_account_name?: string | null
          payout_account_number?: string | null
          payout_bank_code?: string | null
          payout_country?: string | null
          payout_method?: string | null
          payout_provider?: string | null
          paystack_recipient_code?: string | null
          phone?: string | null
          profession?: string | null
          rate_percent?: number
          scope?: Database["public"]["Enums"]["partner_scope"]
          selfie_url?: string | null
          social_media_url?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          suspended_at?: string | null
          suspension_reason?: string | null
          target_audience?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          city?: string | null
          country?: string
          created_at?: string
          custom_rate_override?: number | null
          email?: string
          experience_description?: string | null
          full_name?: string
          how_heard_about_us?: string | null
          id?: string
          id_document_type?: string | null
          id_document_url?: string | null
          invite_code?: string | null
          invite_link_slug?: string | null
          invite_uses_count?: number
          kyc_rejection_reason?: string | null
          kyc_reviewed_at?: string | null
          kyc_reviewed_by?: string | null
          kyc_status?: string
          kyc_submitted_at?: string | null
          last_invite_used_at?: string | null
          level?: number
          min_payout_threshold?: number
          motivation?: string | null
          network_size?: string | null
          notes?: string | null
          organization_name?: string | null
          organization_type?: string | null
          payout_account_name?: string | null
          payout_account_number?: string | null
          payout_bank_code?: string | null
          payout_country?: string | null
          payout_method?: string | null
          payout_provider?: string | null
          paystack_recipient_code?: string | null
          phone?: string | null
          profession?: string | null
          rate_percent?: number
          scope?: Database["public"]["Enums"]["partner_scope"]
          selfie_url?: string | null
          social_media_url?: string | null
          status?: Database["public"]["Enums"]["partner_status"]
          suspended_at?: string | null
          suspension_reason?: string | null
          target_audience?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      payment_events: {
        Row: {
          event_id: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          received_at: string
          reference: string | null
          status: string
        }
        Insert: {
          event_id: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          received_at?: string
          reference?: string | null
          status?: string
        }
        Update: {
          event_id?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          received_at?: string
          reference?: string | null
          status?: string
        }
        Relationships: []
      }
      payout_profiles: {
        Row: {
          created_at: string
          id: string
          payout_account_name: string | null
          payout_account_number: string | null
          payout_bank_code: string | null
          payout_country: string | null
          payout_currency: string | null
          payout_method: string | null
          payout_provider: string | null
          paystack_recipient_code: string | null
          recipient_locked: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payout_account_name?: string | null
          payout_account_number?: string | null
          payout_bank_code?: string | null
          payout_country?: string | null
          payout_currency?: string | null
          payout_method?: string | null
          payout_provider?: string | null
          paystack_recipient_code?: string | null
          recipient_locked?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payout_account_name?: string | null
          payout_account_number?: string | null
          payout_bank_code?: string | null
          payout_country?: string | null
          payout_currency?: string | null
          payout_method?: string | null
          payout_provider?: string | null
          paystack_recipient_code?: string | null
          recipient_locked?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payout_requests: {
        Row: {
          amount: number
          currency: string | null
          id: string
          metadata: Json | null
          organization_id: string | null
          payout_type: string
          processed_at: string | null
          requested_at: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          currency?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          payout_type: string
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          currency?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string | null
          payout_type?: string
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_alerts: {
        Row: {
          alert_type: string
          created_at: string
          details: Json | null
          id: string
          resolved: boolean
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          title: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          details?: Json | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          resolved?: boolean
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          title?: string
        }
        Relationships: []
      }
      platform_metrics_daily: {
        Row: {
          active_affiliates: number | null
          active_orgs: number | null
          created_at: string
          gmv: number | null
          id: string
          metric_date: string
          new_orgs: number | null
          new_users: number | null
          platform_fees: number | null
          total_revenue: number | null
          total_transactions: number | null
        }
        Insert: {
          active_affiliates?: number | null
          active_orgs?: number | null
          created_at?: string
          gmv?: number | null
          id?: string
          metric_date: string
          new_orgs?: number | null
          new_users?: number | null
          platform_fees?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
        }
        Update: {
          active_affiliates?: number | null
          active_orgs?: number | null
          created_at?: string
          gmv?: number | null
          id?: string
          metric_date?: string
          new_orgs?: number | null
          new_users?: number | null
          platform_fees?: number | null
          total_revenue?: number | null
          total_transactions?: number | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: string
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: string
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: string
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          organization_id: string
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id: string
          points: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "point_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      product_purchases: {
        Row: {
          affiliate_commission: number | null
          affiliate_link_id: string | null
          amount: number
          buyer_ip: string | null
          completed_at: string | null
          created_at: string | null
          currency: string | null
          device_hash: string | null
          discount_amount: number | null
          dispute_id: string | null
          dispute_status: string | null
          gateway: string | null
          id: string
          invoice_number: string | null
          organization_amount: number | null
          organization_id: string
          paystack_reference: string
          platform_fee: number | null
          product_id: string
          promo_code_id: string | null
          settlement_released_at: string | null
          settlement_status: string | null
          status: Database["public"]["Enums"]["purchase_status"] | null
          user_id: string
        }
        Insert: {
          affiliate_commission?: number | null
          affiliate_link_id?: string | null
          amount: number
          buyer_ip?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          device_hash?: string | null
          discount_amount?: number | null
          dispute_id?: string | null
          dispute_status?: string | null
          gateway?: string | null
          id?: string
          invoice_number?: string | null
          organization_amount?: number | null
          organization_id: string
          paystack_reference: string
          platform_fee?: number | null
          product_id: string
          promo_code_id?: string | null
          settlement_released_at?: string | null
          settlement_status?: string | null
          status?: Database["public"]["Enums"]["purchase_status"] | null
          user_id: string
        }
        Update: {
          affiliate_commission?: number | null
          affiliate_link_id?: string | null
          amount?: number
          buyer_ip?: string | null
          completed_at?: string | null
          created_at?: string | null
          currency?: string | null
          device_hash?: string | null
          discount_amount?: number | null
          dispute_id?: string | null
          dispute_status?: string | null
          gateway?: string | null
          id?: string
          invoice_number?: string | null
          organization_amount?: number | null
          organization_id?: string
          paystack_reference?: string
          platform_fee?: number | null
          product_id?: string
          promo_code_id?: string | null
          settlement_released_at?: string | null
          settlement_status?: string | null
          status?: Database["public"]["Enums"]["purchase_status"] | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_purchases_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_purchases_promo_code_id_fkey"
            columns: ["promo_code_id"]
            isOneToOne: false
            referencedRelation: "promo_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recommendations: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          product_id: string
          recommendation_type: string
          recommended_product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          product_id: string
          recommendation_type?: string
          recommended_product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          product_id?: string
          recommendation_type?: string
          recommended_product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recommendations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          is_published: boolean
          is_verified_purchase: boolean
          organization_id: string
          product_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          is_verified_purchase?: boolean
          organization_id: string
          product_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          is_published?: boolean
          is_verified_purchase?: boolean
          organization_id?: string
          product_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_reviews_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          country: string | null
          created_at: string | null
          display_name: string | null
          id: string
          onboarding_intent: string | null
          payout_account_name: string | null
          payout_account_number: string | null
          payout_bank_code: string | null
          payout_country: string | null
          payout_currency: string | null
          payout_method: string | null
          payout_provider: string | null
          paystack_recipient_code: string | null
          phone: string | null
          recipient_locked: boolean | null
          referral_code: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          onboarding_intent?: string | null
          payout_account_name?: string | null
          payout_account_number?: string | null
          payout_bank_code?: string | null
          payout_country?: string | null
          payout_currency?: string | null
          payout_method?: string | null
          payout_provider?: string | null
          paystack_recipient_code?: string | null
          phone?: string | null
          recipient_locked?: boolean | null
          referral_code?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          onboarding_intent?: string | null
          payout_account_name?: string | null
          payout_account_number?: string | null
          payout_bank_code?: string | null
          payout_country?: string | null
          payout_currency?: string | null
          payout_method?: string | null
          payout_provider?: string | null
          paystack_recipient_code?: string | null
          phone?: string | null
          recipient_locked?: boolean | null
          referral_code?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      program_certificates: {
        Row: {
          certificate_number: string
          id: string
          issued_at: string
          organization_id: string
          program_id: string
          user_id: string
        }
        Insert: {
          certificate_number: string
          id?: string
          issued_at?: string
          organization_id: string
          program_id: string
          user_id: string
        }
        Update: {
          certificate_number?: string
          id?: string
          issued_at?: string
          organization_id?: string
          program_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_certificates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "program_certificates_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_enrollments: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          program_id: string
          status: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          program_id: string
          status?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          program_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_enrollments_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_lessons: {
        Row: {
          content: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          is_free_preview: boolean | null
          module_id: string
          order_index: number
          publication_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_at: string | null
          submitted_for_review_at: string | null
          title: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean | null
          module_id: string
          order_index?: number
          publication_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          submitted_for_review_at?: string | null
          title: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean | null
          module_id?: string
          order_index?: number
          publication_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          submitted_for_review_at?: string | null
          title?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "program_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "program_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      program_modules: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number
          program_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          program_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number
          program_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_modules_program_id_fkey"
            columns: ["program_id"]
            isOneToOne: false
            referencedRelation: "programs"
            referencedColumns: ["id"]
          },
        ]
      }
      program_quizzes: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          passing_score: number
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          passing_score?: number
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          passing_score?: number
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "program_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "program_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      programs: {
        Row: {
          certificate_enabled: boolean | null
          certificate_template: string | null
          cover_image_url: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          enrollment_count: number | null
          id: string
          is_featured: boolean | null
          is_free: boolean | null
          is_published: boolean | null
          organization_id: string
          price: number | null
          publication_status: string
          reviewed_at: string | null
          reviewed_by: string | null
          scheduled_at: string | null
          submitted_for_review_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          certificate_enabled?: boolean | null
          certificate_template?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          enrollment_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          organization_id: string
          price?: number | null
          publication_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          submitted_for_review_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          certificate_enabled?: boolean | null
          certificate_template?: string | null
          cover_image_url?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          enrollment_count?: number | null
          id?: string
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          organization_id?: string
          price?: number | null
          publication_status?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          scheduled_at?: string | null
          submitted_for_review_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          discount_amount: number | null
          discount_percent: number
          discount_type: string
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          organization_id: string
          product_id: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          discount_amount?: number | null
          discount_percent?: number
          discount_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          organization_id: string
          product_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          discount_amount?: number | null
          discount_percent?: number
          discount_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          organization_id?: string
          product_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "promo_codes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promo_codes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          organization_id: string | null
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          organization_id?: string | null
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          organization_id?: string | null
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string
          id: string
          passed: boolean
          quiz_id: string
          score: number
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string
          id?: string
          passed?: boolean
          quiz_id: string
          score?: number
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string
          id?: string
          passed?: boolean
          quiz_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "program_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_questions: {
        Row: {
          correct_index: number
          created_at: string
          display_order: number | null
          id: string
          options: Json
          question: string
          quiz_id: string
        }
        Insert: {
          correct_index?: number
          created_at?: string
          display_order?: number | null
          id?: string
          options?: Json
          question: string
          quiz_id: string
        }
        Update: {
          correct_index?: number
          created_at?: string
          display_order?: number | null
          id?: string
          options?: Json
          question?: string
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "program_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      refund_requests: {
        Row: {
          admin_notes: string | null
          amount: number
          created_at: string
          currency: string | null
          donation_id: string | null
          gateway_refund_id: string | null
          id: string
          organization_id: string
          purchase_id: string | null
          reason: string
          refunded_amount: number | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          created_at?: string
          currency?: string | null
          donation_id?: string | null
          gateway_refund_id?: string | null
          id?: string
          organization_id: string
          purchase_id?: string | null
          reason: string
          refunded_amount?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          created_at?: string
          currency?: string | null
          donation_id?: string | null
          gateway_refund_id?: string | null
          id?: string
          organization_id?: string
          purchase_id?: string | null
          reason?: string
          refunded_amount?: number | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_requests_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "product_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      scripture_references: {
        Row: {
          book: string
          chapter: number
          created_at: string
          id: string
          source: string
          text: string | null
          translation_code: string | null
          verse_end: number
          verse_start: number
        }
        Insert: {
          book: string
          chapter: number
          created_at?: string
          id?: string
          source?: string
          text?: string | null
          translation_code?: string | null
          verse_end: number
          verse_start: number
        }
        Update: {
          book?: string
          chapter?: number
          created_at?: string
          id?: string
          source?: string
          text?: string | null
          translation_code?: string | null
          verse_end?: number
          verse_start?: number
        }
        Relationships: []
      }
      short_links: {
        Row: {
          clicks: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          image: string | null
          target_path: string
          title: string | null
        }
        Insert: {
          clicks?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id: string
          image?: string | null
          target_path: string
          title?: string | null
        }
        Update: {
          clicks?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          image?: string | null
          target_path?: string
          title?: string | null
        }
        Relationships: []
      }
      subscription_plans: {
        Row: {
          created_at: string
          currency: string
          description: string | null
          display_order: number | null
          features: Json | null
          id: string
          interval: string
          is_active: boolean
          is_published: boolean
          name: string
          organization_id: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean
          is_published?: boolean
          name: string
          organization_id: string
          price?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          description?: string | null
          display_order?: number | null
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean
          is_published?: boolean
          name?: string
          organization_id?: string
          price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_plans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          category: string
          created_at: string
          id: string
          message: string
          organization_id: string | null
          priority: string
          resolved_at: string | null
          responded_at: string | null
          responded_by: string | null
          status: string
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          category?: string
          created_at?: string
          id?: string
          message: string
          organization_id?: string | null
          priority?: string
          resolved_at?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          category?: string
          created_at?: string
          id?: string
          message?: string
          organization_id?: string | null
          priority?: string
          resolved_at?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supported_payout_countries: {
        Row: {
          bank_payout: boolean | null
          country_code: string
          country_name: string
          currency: string
          momo_payout: boolean | null
          momo_providers: string[] | null
          notes: string | null
          paystack_supported: boolean | null
          transfer_api: boolean | null
        }
        Insert: {
          bank_payout?: boolean | null
          country_code: string
          country_name: string
          currency: string
          momo_payout?: boolean | null
          momo_providers?: string[] | null
          notes?: string | null
          paystack_supported?: boolean | null
          transfer_api?: boolean | null
        }
        Update: {
          bank_payout?: boolean | null
          country_code?: string
          country_name?: string
          currency?: string
          momo_payout?: boolean | null
          momo_providers?: string[] | null
          notes?: string | null
          paystack_supported?: boolean | null
          transfer_api?: boolean | null
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string
          id: string
          organization_id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string
          id?: string
          organization_id: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string
          id?: string
          organization_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_badges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bookmarks: {
        Row: {
          content_id: string
          content_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          content_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          content_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          action_url: string | null
          body: string
          created_at: string | null
          id: string
          image_url: string | null
          is_read: boolean | null
          notification_type: string | null
          organization_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          body: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          notification_type?: string | null
          organization_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          body?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_read?: boolean | null
          notification_type?: string | null
          organization_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      user_platform_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["platform_role"] | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["platform_role"] | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["platform_role"] | null
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          id: string
          level: number
          organization_id: string
          points: number
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          level?: number
          organization_id: string
          points?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          level?: number
          organization_id?: string
          points?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_points_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount: number | null
          reward_currency: string | null
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          reward_amount?: number | null
          reward_currency?: string | null
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          reward_amount?: number | null
          reward_currency?: string | null
          status?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current_streak: number
          id: string
          last_activity_date: string | null
          longest_streak: number
          total_activity_days: number
          updated_at: string
          user_id: string
        }
        Insert: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_activity_days?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          current_streak?: number
          id?: string
          last_activity_date?: string | null
          longest_streak?: number
          total_activity_days?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancelled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          organization_id: string
          paystack_email_token: string | null
          paystack_subscription_code: string | null
          plan_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id: string
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          plan_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          organization_id?: string
          paystack_email_token?: string | null
          paystack_subscription_code?: string | null
          plan_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      viral_snippets: {
        Row: {
          created_at: string
          display_order: number | null
          id: string
          organization_id: string
          platform: string
          product_id: string
          share_count: number | null
          snippet_type: string
          text: string
        }
        Insert: {
          created_at?: string
          display_order?: number | null
          id?: string
          organization_id: string
          platform?: string
          product_id: string
          share_count?: number | null
          snippet_type?: string
          text: string
        }
        Update: {
          created_at?: string
          display_order?: number | null
          id?: string
          organization_id?: string
          platform?: string
          product_id?: string
          share_count?: number | null
          snippet_type?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "viral_snippets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "viral_snippets_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist_entries: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string | null
          waitlist_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name?: string | null
          waitlist_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string | null
          waitlist_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_entries_waitlist_id_fkey"
            columns: ["waitlist_id"]
            isOneToOne: false
            referencedRelation: "waitlists"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          launch_date: string | null
          organization_id: string
          product_id: string | null
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          launch_date?: string | null
          organization_id: string
          product_id?: string | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          launch_date?: string | null
          organization_id?: string
          product_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "waitlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
      watch_history: {
        Row: {
          completed: boolean | null
          id: string
          media_id: string
          organization_id: string
          progress_seconds: number | null
          user_id: string
          watched_at: string | null
        }
        Insert: {
          completed?: boolean | null
          id?: string
          media_id: string
          organization_id: string
          progress_seconds?: number | null
          user_id: string
          watched_at?: string | null
        }
        Update: {
          completed?: boolean | null
          id?: string
          media_id?: string
          organization_id?: string
          progress_seconds?: number | null
          user_id?: string
          watched_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "watch_history_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media_content"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "digital_products"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_ai_quality: {
        Args: { _notes?: string; _org_id: string; _quality_score_id: string }
        Returns: Json
      }
      attribute_org_to_partner: {
        Args: { _org_id: string; _partner_code: string }
        Returns: Json
      }
      can_admin_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      can_use_studio: { Args: { _org_id: string }; Returns: boolean }
      check_rate_limit: {
        Args: { _key: string; _max?: number; _window_seconds?: number }
        Returns: Json
      }
      cleanup_rate_limits: { Args: never; Returns: undefined }
      compute_partner_level: { Args: { _partner_id: string }; Returns: number }
      create_ai_project: {
        Args: {
          _data_json?: Json
          _description?: string
          _org_id: string
          _params_json?: Json
          _project_type: string
          _template_id?: string
          _title: string
        }
        Returns: string
      }
      create_organization_with_owner: {
        Args: {
          _category?: Database["public"]["Enums"]["org_category"]
          _currency?: string
          _description?: string
          _name: string
          _slug: string
        }
        Returns: string
      }
      decrement_like_count: { Args: { media_id: string }; Returns: undefined }
      delete_organization: { Args: { _org_id: string }; Returns: Json }
      delete_partner: { Args: { _partner_id: string }; Returns: Json }
      delete_user_account: { Args: { _user_id: string }; Returns: undefined }
      get_org_category_breakdown: { Args: never; Returns: Json }
      get_org_country_breakdown: { Args: { _limit?: number }; Returns: Json }
      get_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_member_role"]
      }
      get_partner_rate: { Args: { _partner_id: string }; Returns: number }
      get_platform_totals: { Args: never; Returns: Json }
      get_top_orgs_by_revenue: { Args: { _limit?: number }; Returns: Json }
      get_transaction_stats: {
        Args: { _from?: string; _to?: string }
        Returns: Json
      }
      increment_campaign_amount: {
        Args: { _amount: number; _campaign_id: string }
        Returns: undefined
      }
      increment_like_count: { Args: { media_id: string }; Returns: undefined }
      increment_promo_uses: { Args: { _promo_id: string }; Returns: boolean }
      increment_sales_count: {
        Args: { _product_id: string }
        Returns: undefined
      }
      increment_short_link_clicks: {
        Args: { _code: string }
        Returns: undefined
      }
      increment_view_count: { Args: { media_id: string }; Returns: undefined }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_partner_owner: { Args: { _partner_id: string }; Returns: boolean }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      link_project_to_product: {
        Args: { _org_id: string; _product_id: string; _project_id: string }
        Returns: Json
      }
      link_scripture_to_content: {
        Args: {
          _content_id: string
          _content_type: string
          _note?: string
          _org_id: string
          _scripture_reference_id: string
        }
        Returns: string
      }
      manage_partner: {
        Args: { _action: string; _partner_id: string; _reason?: string }
        Returns: Json
      }
      org_affiliation_allowed: { Args: { _org_id: string }; Returns: boolean }
      org_monetization_allowed: { Args: { _org_id: string }; Returns: boolean }
      reject_ai_quality: {
        Args: { _notes?: string; _org_id: string; _quality_score_id: string }
        Returns: Json
      }
      release_matured_affiliate_sales: { Args: never; Returns: number }
      release_matured_partner_commissions: { Args: never; Returns: number }
      review_org_kyc: {
        Args: { _action: string; _org_id: string; _reason?: string }
        Returns: Json
      }
      review_partner_kyc: {
        Args: { _action: string; _partner_id: string; _reason?: string }
        Returns: Json
      }
      self_enroll_affiliate: { Args: { _org_id: string }; Returns: undefined }
      set_partner_rate_override: {
        Args: { _partner_id: string; _rate: number }
        Returns: Json
      }
      submit_org_kyc: {
        Args: {
          _bank_account_name?: string
          _bank_account_number?: string
          _bank_name?: string
          _id_document_type?: string
          _id_document_url?: string
          _kyc_level: number
          _org_document_type?: string
          _org_document_url?: string
          _org_id: string
          _selfie_url?: string
        }
        Returns: Json
      }
      submit_partner_kyc: {
        Args: {
          _id_document_type: string
          _id_document_url: string
          _partner_id: string
          _selfie_url?: string
        }
        Returns: Json
      }
      transfer_partner_referral: {
        Args: { _new_partner_id: string; _reason: string; _referral_id: string }
        Returns: Json
      }
      upsert_scripture_reference: {
        Args: {
          _book: string
          _chapter: number
          _source?: string
          _text?: string
          _translation_code?: string
          _verse_end: number
          _verse_start: number
        }
        Returns: string
      }
    }
    Enums: {
      affiliate_sale_status: "pending" | "payable" | "paid" | "cancelled"
      ai_asset_type:
        | "image"
        | "audio"
        | "pdf"
        | "text"
        | "cover"
        | "preview"
        | "video"
        | "link"
      ai_job_status: "queued" | "running" | "completed" | "failed" | "cancelled"
      ai_job_type:
        | "generate_outline"
        | "generate_chapter"
        | "generate_cover"
        | "generate_page_images"
        | "generate_audio"
        | "generate_pdf"
        | "generate_description"
        | "generate_full"
        | "quality_check"
      ai_project_status:
        | "draft"
        | "generating"
        | "review"
        | "ready_to_publish"
        | "published"
        | "archived"
      ai_project_type:
        | "ebook"
        | "kids_book"
        | "coloring_book"
        | "course_pack"
        | "sermon_pack"
        | "bible_pack"
        | "marketing_pack"
      kyc_status: "none" | "pending" | "level1" | "level2" | "rejected"
      media_type: "video" | "audio" | "reel" | "live_replay"
      org_category:
        | "church"
        | "ministry"
        | "leader"
        | "ngo"
        | "community"
        | "other"
        | "business"
      org_member_role: "owner" | "admin" | "editor" | "member" | "affiliate"
      org_plan: "free" | "pro" | "growth" | "enterprise"
      partner_commission_status: "held" | "payable" | "paid" | "reversed"
      partner_payout_status:
        | "requested"
        | "approved"
        | "processing"
        | "paid"
        | "failed"
        | "rejected"
      partner_referral_status: "pending" | "active" | "rejected"
      partner_scope: "country" | "regional" | "international"
      partner_status: "pending" | "approved" | "rejected" | "suspended"
      payment_status: "pending" | "completed" | "failed" | "refunded"
      platform_role: "superadmin" | "user"
      purchase_status: "pending" | "completed" | "failed"
      report_status: "pending" | "reviewed" | "resolved" | "dismissed"
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
    Enums: {
      affiliate_sale_status: ["pending", "payable", "paid", "cancelled"],
      ai_asset_type: [
        "image",
        "audio",
        "pdf",
        "text",
        "cover",
        "preview",
        "video",
        "link",
      ],
      ai_job_status: ["queued", "running", "completed", "failed", "cancelled"],
      ai_job_type: [
        "generate_outline",
        "generate_chapter",
        "generate_cover",
        "generate_page_images",
        "generate_audio",
        "generate_pdf",
        "generate_description",
        "generate_full",
        "quality_check",
      ],
      ai_project_status: [
        "draft",
        "generating",
        "review",
        "ready_to_publish",
        "published",
        "archived",
      ],
      ai_project_type: [
        "ebook",
        "kids_book",
        "coloring_book",
        "course_pack",
        "sermon_pack",
        "bible_pack",
        "marketing_pack",
      ],
      kyc_status: ["none", "pending", "level1", "level2", "rejected"],
      media_type: ["video", "audio", "reel", "live_replay"],
      org_category: [
        "church",
        "ministry",
        "leader",
        "ngo",
        "community",
        "other",
        "business",
      ],
      org_member_role: ["owner", "admin", "editor", "member", "affiliate"],
      org_plan: ["free", "pro", "growth", "enterprise"],
      partner_commission_status: ["held", "payable", "paid", "reversed"],
      partner_payout_status: [
        "requested",
        "approved",
        "processing",
        "paid",
        "failed",
        "rejected",
      ],
      partner_referral_status: ["pending", "active", "rejected"],
      partner_scope: ["country", "regional", "international"],
      partner_status: ["pending", "approved", "rejected", "suspended"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      platform_role: ["superadmin", "user"],
      purchase_status: ["pending", "completed", "failed"],
      report_status: ["pending", "reviewed", "resolved", "dismissed"],
    },
  },
} as const
