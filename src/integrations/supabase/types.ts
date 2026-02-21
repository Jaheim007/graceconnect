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
      affiliate_links: {
        Row: {
          campaign_id: string | null
          clicks: number | null
          code: string
          conversions: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
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
          id?: string
          is_active?: boolean | null
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
          id?: string
          is_active?: boolean | null
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
          published_at: string | null
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
          published_at?: string | null
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
          published_at?: string | null
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
      digital_products: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string | null
          display_order: number | null
          external_link: string | null
          featured_score: number | null
          file_url: string | null
          fts_vector: unknown
          id: string
          is_featured: boolean | null
          is_free: boolean | null
          is_published: boolean | null
          organization_id: string
          price: number | null
          product_type: string | null
          sales_count: number | null
          slug: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          external_link?: string | null
          featured_score?: number | null
          file_url?: string | null
          fts_vector?: unknown
          id?: string
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          organization_id: string
          price?: number | null
          product_type?: string | null
          sales_count?: number | null
          slug?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string | null
          display_order?: number | null
          external_link?: string | null
          featured_score?: number | null
          file_url?: string | null
          fts_vector?: unknown
          id?: string
          is_featured?: boolean | null
          is_free?: boolean | null
          is_published?: boolean | null
          organization_id?: string
          price?: number | null
          product_type?: string | null
          sales_count?: number | null
          slug?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "digital_products_organization_id_fkey"
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
          donor_email: string | null
          donor_name: string | null
          id: string
          is_recurring: boolean | null
          organization_amount: number | null
          organization_id: string
          paystack_reference: string
          platform_fee: number | null
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
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          is_recurring?: boolean | null
          organization_amount?: number | null
          organization_id: string
          paystack_reference: string
          platform_fee?: number | null
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
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          is_recurring?: boolean | null
          organization_amount?: number | null
          organization_id?: string
          paystack_reference?: string
          platform_fee?: number | null
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
            isOneToOne: false
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
          series: string | null
          speaker: string | null
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
          series?: string | null
          speaker?: string | null
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
          series?: string | null
          speaker?: string | null
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
          monetization_enabled: boolean | null
          name: string
          owner_id: string
          paystack_subaccount_code: string | null
          plan_type: Database["public"]["Enums"]["org_plan"] | null
          platform_fee_percent: number | null
          slug: string
          suspended_until: string | null
          suspension_reason: string | null
          updated_at: string | null
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          affiliation_commission_percent?: number | null
          affiliation_enabled?: boolean | null
          banner_url?: string | null
          category?: Database["public"]["Enums"]["org_category"] | null
          country?: string | null
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
          monetization_enabled?: boolean | null
          name: string
          owner_id: string
          paystack_subaccount_code?: string | null
          plan_type?: Database["public"]["Enums"]["org_plan"] | null
          platform_fee_percent?: number | null
          slug: string
          suspended_until?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          affiliation_commission_percent?: number | null
          affiliation_enabled?: boolean | null
          banner_url?: string | null
          category?: Database["public"]["Enums"]["org_category"] | null
          country?: string | null
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
          monetization_enabled?: boolean | null
          name?: string
          owner_id?: string
          paystack_subaccount_code?: string | null
          plan_type?: Database["public"]["Enums"]["org_plan"] | null
          platform_fee_percent?: number | null
          slug?: string
          suspended_until?: string | null
          suspension_reason?: string | null
          updated_at?: string | null
          website?: string | null
          whatsapp?: string | null
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
          id: string
          organization_amount: number | null
          organization_id: string
          paystack_reference: string
          platform_fee: number | null
          product_id: string
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
          id?: string
          organization_amount?: number | null
          organization_id: string
          paystack_reference: string
          platform_fee?: number | null
          product_id: string
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
          id?: string
          organization_amount?: number | null
          organization_id?: string
          paystack_reference?: string
          platform_fee?: number | null
          product_id?: string
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
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          country?: string | null
          created_at?: string | null
          display_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
      programs: {
        Row: {
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
          title: string
          updated_at: string
        }
        Insert: {
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
          title: string
          updated_at?: string
        }
        Update: {
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_admin_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      can_manage_org: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      create_organization_with_owner: {
        Args: {
          _category?: Database["public"]["Enums"]["org_category"]
          _description?: string
          _name: string
          _slug: string
        }
        Returns: string
      }
      delete_user_account: { Args: { _user_id: string }; Returns: undefined }
      get_org_role: {
        Args: { _org_id: string; _user_id: string }
        Returns: Database["public"]["Enums"]["org_member_role"]
      }
      is_org_member: {
        Args: { _org_id: string; _user_id: string }
        Returns: boolean
      }
      is_superadmin: { Args: { _user_id: string }; Returns: boolean }
      org_affiliation_allowed: { Args: { _org_id: string }; Returns: boolean }
      org_monetization_allowed: { Args: { _org_id: string }; Returns: boolean }
    }
    Enums: {
      affiliate_sale_status: "pending" | "payable" | "paid" | "cancelled"
      kyc_status: "none" | "pending" | "level1" | "level2" | "rejected"
      media_type: "video" | "audio" | "reel" | "live_replay"
      org_category:
        | "church"
        | "ministry"
        | "leader"
        | "ngo"
        | "community"
        | "other"
      org_member_role: "owner" | "admin" | "editor" | "member" | "affiliate"
      org_plan: "free" | "pro" | "growth" | "enterprise"
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
      kyc_status: ["none", "pending", "level1", "level2", "rejected"],
      media_type: ["video", "audio", "reel", "live_replay"],
      org_category: [
        "church",
        "ministry",
        "leader",
        "ngo",
        "community",
        "other",
      ],
      org_member_role: ["owner", "admin", "editor", "member", "affiliate"],
      org_plan: ["free", "pro", "growth", "enterprise"],
      payment_status: ["pending", "completed", "failed", "refunded"],
      platform_role: ["superadmin", "user"],
      purchase_status: ["pending", "completed", "failed"],
      report_status: ["pending", "reviewed", "resolved", "dismissed"],
    },
  },
} as const
