// Generated from the live Supabase schema (Supabase MCP generate_typescript_types). Do not edit by hand: regenerate after a migration.
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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          key: string
          value: string
        }
        Insert: {
          key: string
          value: string
        }
        Update: {
          key?: string
          value?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          attendance: string | null
          cash_received_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_distance_m: number | null
          completed_at: string | null
          created_at: string
          decided_at: string | null
          dispute_reason: string | null
          escrow_amount: number | null
          funded_at: string | null
          funding_mode: string | null
          id: string
          job_id: string
          message: string | null
          paid_cash_at: string | null
          pay_status: string
          platform_fee: number | null
          released_at: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          seeker_id: string
          seen_by_employer: boolean
          status: Database["public"]["Enums"]["application_status"]
        }
        Insert: {
          attendance?: string | null
          cash_received_at?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          checkin_distance_m?: number | null
          completed_at?: string | null
          created_at?: string
          decided_at?: string | null
          dispute_reason?: string | null
          escrow_amount?: number | null
          funded_at?: string | null
          funding_mode?: string | null
          id?: string
          job_id: string
          message?: string | null
          paid_cash_at?: string | null
          pay_status?: string
          platform_fee?: number | null
          released_at?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seeker_id: string
          seen_by_employer?: boolean
          status?: Database["public"]["Enums"]["application_status"]
        }
        Update: {
          attendance?: string | null
          cash_received_at?: string | null
          checked_in_at?: string | null
          checked_out_at?: string | null
          checkin_distance_m?: number | null
          completed_at?: string | null
          created_at?: string
          decided_at?: string | null
          dispute_reason?: string | null
          escrow_amount?: number | null
          funded_at?: string | null
          funding_mode?: string | null
          id?: string
          job_id?: string
          message?: string | null
          paid_cash_at?: string | null
          pay_status?: string
          platform_fee?: number | null
          released_at?: string | null
          resolution_note?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          seeker_id?: string
          seen_by_employer?: boolean
          status?: Database["public"]["Enums"]["application_status"]
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_seeker_id_fkey"
            columns: ["seeker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_no: string
          bank_name: string
          holder_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_no: string
          bank_name: string
          holder_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_no?: string
          bank_name?: string
          holder_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          phone: string
          user_id: string
          verified: boolean
        }
        Insert: {
          phone: string
          user_id: string
          verified?: boolean
        }
        Update: {
          phone?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "contacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      deletion_requests: {
        Row: {
          id: string
          note: string | null
          reason: string | null
          requested_at: string
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          note?: string | null
          reason?: string | null
          requested_at?: string
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          note?: string | null
          reason?: string | null
          requested_at?: string
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deletion_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      job_invites: {
        Row: {
          created_at: string
          employer_id: string
          id: string
          job_id: string
          worker_id: string
        }
        Insert: {
          created_at?: string
          employer_id: string
          id?: string
          job_id: string
          worker_id: string
        }
        Update: {
          created_at?: string
          employer_id?: string
          id?: string
          job_id?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_invites_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_invites_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "job_invites_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          address: string
          category: string
          city: string
          created_at: string
          description: string
          employer_id: string
          end_date: string
          filled: number
          id: string
          is_sample: boolean
          is_urgent: boolean
          lat: number | null
          lng: number | null
          pay_amount: number
          pay_unit: Database["public"]["Enums"]["pay_unit"]
          shift_note: string | null
          slots: number
          start_date: string
          status: Database["public"]["Enums"]["job_status"]
          title: string
        }
        Insert: {
          address: string
          category?: string
          city: string
          created_at?: string
          description?: string
          employer_id: string
          end_date: string
          filled?: number
          id?: string
          is_sample?: boolean
          is_urgent?: boolean
          lat?: number | null
          lng?: number | null
          pay_amount: number
          pay_unit: Database["public"]["Enums"]["pay_unit"]
          shift_note?: string | null
          slots: number
          start_date: string
          status?: Database["public"]["Enums"]["job_status"]
          title: string
        }
        Update: {
          address?: string
          category?: string
          city?: string
          created_at?: string
          description?: string
          employer_id?: string
          end_date?: string
          filled?: number
          id?: string
          is_sample?: boolean
          is_urgent?: boolean
          lat?: number | null
          lng?: number | null
          pay_amount?: number
          pay_unit?: Database["public"]["Enums"]["pay_unit"]
          shift_note?: string | null
          slots?: number
          start_date?: string
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          application_id: string
          body: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          application_id: string
          body: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          application_id?: string
          body?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          ref: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          kind: string
          link?: string | null
          read_at?: string | null
          ref?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          kind?: string
          link?: string | null
          read_at?: string | null
          ref?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      oa_auth_state: {
        Row: {
          code_verifier: string
          created_at: string
          state: string
          used_at: string | null
        }
        Insert: {
          code_verifier: string
          created_at?: string
          state: string
          used_at?: string | null
        }
        Update: {
          code_verifier?: string
          created_at?: string
          state?: string
          used_at?: string | null
        }
        Relationships: []
      }
      oa_events: {
        Row: {
          event_name: string | null
          id: number
          payload: Json | null
          received_at: string
          user_id_by_app: string | null
          verified: boolean
          zalo_user_id: string | null
        }
        Insert: {
          event_name?: string | null
          id?: never
          payload?: Json | null
          received_at?: string
          user_id_by_app?: string | null
          verified?: boolean
          zalo_user_id?: string | null
        }
        Update: {
          event_name?: string | null
          id?: never
          payload?: Json | null
          received_at?: string
          user_id_by_app?: string | null
          verified?: boolean
          zalo_user_id?: string | null
        }
        Relationships: []
      }
      payouts: {
        Row: {
          amount: number
          application_id: string
          created_at: string
          id: string
          mode: string
          paid_at: string | null
          paid_by: string | null
          reference: string | null
          seeker_id: string
          status: string
        }
        Insert: {
          amount: number
          application_id: string
          created_at?: string
          id?: string
          mode?: string
          paid_at?: string | null
          paid_by?: string | null
          reference?: string | null
          seeker_id: string
          status?: string
        }
        Update: {
          amount?: number
          application_id?: string
          created_at?: string
          id?: string
          mode?: string
          paid_at?: string | null
          paid_by?: string | null
          reference?: string | null
          seeker_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payouts_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: true
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_paid_by_fkey"
            columns: ["paid_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payouts_seeker_id_fkey"
            columns: ["seeker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          auth_provider: string
          availability: string[]
          avatar_path: string | null
          bio: string | null
          birth_year: number | null
          business_name: string | null
          city: string | null
          created_at: string
          experience: string[]
          full_name: string
          id: string
          is_admin: boolean
          is_sample: boolean
          locale: string
          logo_path: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          plan_until: string | null
          role: Database["public"]["Enums"]["user_role"]
          roles: Database["public"]["Enums"]["user_role"][]
        }
        Insert: {
          address?: string | null
          auth_provider?: string
          availability?: string[]
          avatar_path?: string | null
          bio?: string | null
          birth_year?: number | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          experience?: string[]
          full_name: string
          id: string
          is_admin?: boolean
          is_sample?: boolean
          locale?: string
          logo_path?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          plan_until?: string | null
          role: Database["public"]["Enums"]["user_role"]
          roles?: Database["public"]["Enums"]["user_role"][]
        }
        Update: {
          address?: string | null
          auth_provider?: string
          availability?: string[]
          avatar_path?: string | null
          bio?: string | null
          birth_year?: number | null
          business_name?: string | null
          city?: string | null
          created_at?: string
          experience?: string[]
          full_name?: string
          id?: string
          is_admin?: boolean
          is_sample?: boolean
          locale?: string
          logo_path?: string | null
          plan?: Database["public"]["Enums"]["plan_tier"]
          plan_until?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          roles?: Database["public"]["Enums"]["user_role"][]
        }
        Relationships: []
      }
      quiz_answers: {
        Row: {
          answers: Json
          created_at: string
          device_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          answers?: Json
          created_at?: string
          device_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          answers?: Json
          created_at?: string
          device_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          detail: string | null
          id: string
          job_id: string | null
          note: string | null
          reason: string
          reporter_id: string
          resolved_at: string | null
          resolved_by: string | null
          status: string
          target_id: string
        }
        Insert: {
          created_at?: string
          detail?: string | null
          id?: string
          job_id?: string | null
          note?: string | null
          reason: string
          reporter_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id: string
        }
        Update: {
          created_at?: string
          detail?: string | null
          id?: string
          job_id?: string | null
          note?: string | null
          reason?: string
          reporter_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_target_id_fkey"
            columns: ["target_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          application_id: string
          comment: string | null
          created_at: string
          id: string
          reviewee_id: string
          reviewer_id: string
          reviewer_role: Database["public"]["Enums"]["user_role"]
          stars: number
          tags: string[]
        }
        Insert: {
          application_id: string
          comment?: string | null
          created_at?: string
          id?: string
          reviewee_id: string
          reviewer_id: string
          reviewer_role: Database["public"]["Enums"]["user_role"]
          stars: number
          tags?: string[]
        }
        Update: {
          application_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          reviewee_id?: string
          reviewer_id?: string
          reviewer_role?: Database["public"]["Enums"]["user_role"]
          stars?: number
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "reviews_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewee_id_fkey"
            columns: ["reviewee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_jobs: {
        Row: {
          created_at: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_jobs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_profiles: {
        Row: {
          availability: string[]
          avatar_path: string | null
          bio: string | null
          birth_year: number | null
          discoverable: boolean
          experience: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          availability?: string[]
          avatar_path?: string | null
          bio?: string | null
          birth_year?: number | null
          discoverable?: boolean
          experience?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          availability?: string[]
          avatar_path?: string | null
          bio?: string | null
          birth_year?: number | null
          discoverable?: boolean
          experience?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ack_cash_received: {
        Args: { p_application: string }
        Returns: {
          attendance: string | null
          cash_received_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_distance_m: number | null
          completed_at: string | null
          created_at: string
          decided_at: string | null
          dispute_reason: string | null
          escrow_amount: number | null
          funded_at: string | null
          funding_mode: string | null
          id: string
          job_id: string
          message: string | null
          paid_cash_at: string | null
          pay_status: string
          platform_fee: number | null
          released_at: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          seeker_id: string
          seen_by_employer: boolean
          status: Database["public"]["Enums"]["application_status"]
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      add_role: {
        Args: {
          p_address: string
          p_business: string
          p_city: string
          p_role: string
        }
        Returns: {
          address: string | null
          auth_provider: string
          availability: string[]
          avatar_path: string | null
          bio: string | null
          birth_year: number | null
          business_name: string | null
          city: string | null
          created_at: string
          experience: string[]
          full_name: string
          id: string
          is_admin: boolean
          is_sample: boolean
          locale: string
          logo_path: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          plan_until: string | null
          role: Database["public"]["Enums"]["user_role"]
          roles: Database["public"]["Enums"]["user_role"][]
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_deletions: {
        Args: never
        Returns: {
          email: string
          id: string
          name: string
          reason: string
          requested_at: string
          status: string
          user_id: string
        }[]
      }
      admin_disputes: {
        Args: never
        Returns: {
          amount: number
          application_id: string
          attendance: string
          completed_at: string
          employer_name: string
          employer_phone: string
          end_date: string
          fee: number
          funding_mode: string
          job_title: string
          reason: string
          seeker_name: string
          seeker_phone: string
          start_date: string
        }[]
      }
      admin_flags: {
        Args: never
        Returns: {
          employer_name: string
          kind: string
          last_at: string
          seeker_name: string
          shifts: number
          total: number
        }[]
      }
      admin_payouts: {
        Args: never
        Returns: {
          account_no: string
          amount: number
          application_id: string
          bank_name: string
          created_at: string
          holder_name: string
          id: string
          mode: string
          paid_at: string
          reference: string
          seeker_name: string
          status: string
        }[]
      }
      admin_reports: {
        Args: never
        Returns: {
          created_at: string
          detail: string
          id: string
          job_title: string
          note: string
          reason: string
          reporter_name: string
          status: string
          target_id: string
          target_name: string
        }[]
      }
      admin_samples: { Args: never; Returns: Json }
      admin_stats: { Args: never; Returns: Json }
      app_config: { Args: never; Returns: Json }
      app_messages: {
        Args: { p_application: string }
        Returns: {
          body: string
          created_at: string
          id: string
          sender_id: string
        }[]
      }
      cancel_account_deletion: { Args: never; Returns: undefined }
      check_in: {
        Args: { p_application: string; p_lat?: number; p_lng?: number }
        Returns: {
          attendance: string | null
          cash_received_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_distance_m: number | null
          completed_at: string | null
          created_at: string
          decided_at: string | null
          dispute_reason: string | null
          escrow_amount: number | null
          funded_at: string | null
          funding_mode: string | null
          id: string
          job_id: string
          message: string | null
          paid_cash_at: string | null
          pay_status: string
          platform_fee: number | null
          released_at: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          seeker_id: string
          seen_by_employer: boolean
          status: Database["public"]["Enums"]["application_status"]
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      check_out: {
        Args: { p_application: string }
        Returns: {
          attendance: string | null
          cash_received_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_distance_m: number | null
          completed_at: string | null
          created_at: string
          decided_at: string | null
          dispute_reason: string | null
          escrow_amount: number | null
          funded_at: string | null
          funding_mode: string | null
          id: string
          job_id: string
          message: string | null
          paid_cash_at: string | null
          pay_status: string
          platform_fee: number | null
          released_at: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          seeker_id: string
          seen_by_employer: boolean
          status: Database["public"]["Enums"]["application_status"]
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_profile: {
        Args: {
          p_address: string
          p_bio: string
          p_business: string
          p_city: string
          p_full_name: string
          p_locale: string
          p_phone: string
          p_role: string
        }
        Returns: {
          address: string | null
          auth_provider: string
          availability: string[]
          avatar_path: string | null
          bio: string | null
          birth_year: number | null
          business_name: string | null
          city: string | null
          created_at: string
          experience: string[]
          full_name: string
          id: string
          is_admin: boolean
          is_sample: boolean
          locale: string
          logo_path: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          plan_until: string | null
          role: Database["public"]["Enums"]["user_role"]
          roles: Database["public"]["Enums"]["user_role"][]
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_shift: {
        Args: { p_application: string; p_attendance: string }
        Returns: {
          attendance: string | null
          cash_received_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_distance_m: number | null
          completed_at: string | null
          created_at: string
          decided_at: string | null
          dispute_reason: string | null
          escrow_amount: number | null
          funded_at: string | null
          funding_mode: string | null
          id: string
          job_id: string
          message: string | null
          paid_cash_at: string | null
          pay_status: string
          platform_fee: number | null
          released_at: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          seeker_id: string
          seen_by_employer: boolean
          status: Database["public"]["Enums"]["application_status"]
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      current_role_of: {
        Args: { uid: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      decide_application: {
        Args: {
          p_application: string
          p_decision: Database["public"]["Enums"]["application_status"]
        }
        Returns: {
          attendance: string | null
          cash_received_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_distance_m: number | null
          completed_at: string | null
          created_at: string
          decided_at: string | null
          dispute_reason: string | null
          escrow_amount: number | null
          funded_at: string | null
          funding_mode: string | null
          id: string
          job_id: string
          message: string | null
          paid_cash_at: string | null
          pay_status: string
          platform_fee: number | null
          released_at: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          seeker_id: string
          seen_by_employer: boolean
          status: Database["public"]["Enums"]["application_status"]
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fund_application: {
        Args: { p_application: string; p_hours?: number }
        Returns: {
          attendance: string | null
          cash_received_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_distance_m: number | null
          completed_at: string | null
          created_at: string
          decided_at: string | null
          dispute_reason: string | null
          escrow_amount: number | null
          funded_at: string | null
          funding_mode: string | null
          id: string
          job_id: string
          message: string | null
          paid_cash_at: string | null
          pay_status: string
          platform_fee: number | null
          released_at: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          seeker_id: string
          seen_by_employer: boolean
          status: Database["public"]["Enums"]["application_status"]
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_applied: { Args: { p_job: string; uid: string }; Returns: boolean }
      home_highlights: { Args: never; Returns: Json }
      invite_worker: {
        Args: { p_job: string; p_worker: string }
        Returns: undefined
      }
      is_accepted_pair: {
        Args: { employer: string; seeker: string }
        Returns: boolean
      }
      is_job_employer: {
        Args: { p_job: string; uid: string }
        Returns: boolean
      }
      is_my_applicant: {
        Args: { seeker: string; uid: string }
        Returns: boolean
      }
      is_pro: { Args: { uid: string }; Returns: boolean }
      mark_applications_seen: { Args: { p_job: string }; Returns: undefined }
      mark_notifications_read: {
        Args: { p_ids?: string[] }
        Returns: undefined
      }
      mark_paid_cash: { Args: { p_application: string }; Returns: undefined }
      mark_payout_paid: {
        Args: { p_payout: string; p_reference: string }
        Returns: undefined
      }
      my_deletion_request: {
        Args: never
        Returns: {
          requested_at: string
          status: string
        }[]
      }
      my_discoverable: { Args: never; Returns: boolean }
      my_notifications: {
        Args: { p_limit?: number }
        Returns: {
          body: string | null
          created_at: string
          id: string
          kind: string
          link: string | null
          read_at: string | null
          ref: string | null
          title: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "notifications"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      my_pending_reviews: { Args: never; Returns: number }
      my_quiz: { Args: never; Returns: Json }
      my_sent_invites: {
        Args: never
        Returns: {
          job_id: string
          worker_id: string
        }[]
      }
      open_dispute: {
        Args: { p_application: string; p_reason: string }
        Returns: {
          attendance: string | null
          cash_received_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_distance_m: number | null
          completed_at: string | null
          created_at: string
          decided_at: string | null
          dispute_reason: string | null
          escrow_amount: number | null
          funded_at: string | null
          funding_mode: string | null
          id: string
          job_id: string
          message: string | null
          paid_cash_at: string | null
          pay_status: string
          platform_fee: number | null
          released_at: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          seeker_id: string
          seen_by_employer: boolean
          status: Database["public"]["Enums"]["application_status"]
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      payment_mode: { Args: never; Returns: string }
      quote_application: {
        Args: { p_application: string; p_hours?: number }
        Returns: Json
      }
      report_user: {
        Args: {
          p_detail?: string
          p_job?: string
          p_reason: string
          p_target: string
        }
        Returns: undefined
      }
      reputations: {
        Args: { p_users: string[] }
        Returns: {
          avg_stars: number
          late: number
          noshow: number
          on_time: number
          partners: number
          ratings: number
          shifts_done: number
          top_tags: string[]
          user_id: string
        }[]
      }
      request_account_deletion: {
        Args: { p_reason?: string }
        Returns: undefined
      }
      resolve_deletion: {
        Args: { p_id: string; p_note?: string }
        Returns: undefined
      }
      resolve_dispute: {
        Args: { p_application: string; p_note: string; p_outcome: string }
        Returns: {
          attendance: string | null
          cash_received_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_distance_m: number | null
          completed_at: string | null
          created_at: string
          decided_at: string | null
          dispute_reason: string | null
          escrow_amount: number | null
          funded_at: string | null
          funding_mode: string | null
          id: string
          job_id: string
          message: string | null
          paid_cash_at: string | null
          pay_status: string
          platform_fee: number | null
          released_at: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          seeker_id: string
          seen_by_employer: boolean
          status: Database["public"]["Enums"]["application_status"]
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      resolve_report: {
        Args: { p_id: string; p_note?: string }
        Returns: undefined
      }
      respond_noshow: {
        Args: { p_accept: boolean; p_application: string }
        Returns: {
          attendance: string | null
          cash_received_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_distance_m: number | null
          completed_at: string | null
          created_at: string
          decided_at: string | null
          dispute_reason: string | null
          escrow_amount: number | null
          funded_at: string | null
          funding_mode: string | null
          id: string
          job_id: string
          message: string | null
          paid_cash_at: string | null
          pay_status: string
          platform_fee: number | null
          released_at: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          seeker_id: string
          seen_by_employer: boolean
          status: Database["public"]["Enums"]["application_status"]
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      review_flags: {
        Args: { p_apps: string[] }
        Returns: {
          application_id: string
          other_reviewed: boolean
        }[]
      }
      role_reputations: {
        Args: {
          p_as: Database["public"]["Enums"]["user_role"]
          p_users: string[]
        }
        Returns: {
          avg_stars: number
          late: number
          noshow: number
          on_time: number
          partners: number
          ratings: number
          shifts_done: number
          top_tags: string[]
          user_id: string
        }[]
      }
      save_bank_account: {
        Args: { p_account: string; p_bank: string; p_holder: string }
        Returns: undefined
      }
      save_quiz: {
        Args: { p_answers: Json; p_device: string }
        Returns: undefined
      }
      search_workers: {
        Args: {
          p_city?: string
          p_exp?: string
          p_limit?: number
          p_when?: string
        }
        Returns: {
          availability: string[]
          avatar_path: string
          avg_stars: number
          birth_year: number
          city: string
          experience: string[]
          name: string
          ratings: number
          shifts_done: number
          user_id: string
        }[]
      }
      send_message: {
        Args: { p_application: string; p_body: string }
        Returns: undefined
      }
      set_discoverable: { Args: { p_on: boolean }; Returns: undefined }
      submit_review: {
        Args: {
          p_application: string
          p_comment: string
          p_stars: number
          p_tags: string[]
        }
        Returns: {
          application_id: string
          comment: string | null
          created_at: string
          id: string
          reviewee_id: string
          reviewer_id: string
          reviewer_role: Database["public"]["Enums"]["user_role"]
          stars: number
          tags: string[]
        }
        SetofOptions: {
          from: "*"
          to: "reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      sweep_overdue: { Args: never; Returns: undefined }
      switch_role: {
        Args: { p_role: string }
        Returns: {
          address: string | null
          auth_provider: string
          availability: string[]
          avatar_path: string | null
          bio: string | null
          birth_year: number | null
          business_name: string | null
          city: string | null
          created_at: string
          experience: string[]
          full_name: string
          id: string
          is_admin: boolean
          is_sample: boolean
          locale: string
          logo_path: string | null
          plan: Database["public"]["Enums"]["plan_tier"]
          plan_until: string | null
          role: Database["public"]["Enums"]["user_role"]
          roles: Database["public"]["Enums"]["user_role"][]
        }
        SetofOptions: {
          from: "*"
          to: "profiles"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      unread_notifications: { Args: never; Returns: number }
      withdraw_application: {
        Args: { p_application: string }
        Returns: {
          attendance: string | null
          cash_received_at: string | null
          checked_in_at: string | null
          checked_out_at: string | null
          checkin_distance_m: number | null
          completed_at: string | null
          created_at: string
          decided_at: string | null
          dispute_reason: string | null
          escrow_amount: number | null
          funded_at: string | null
          funding_mode: string | null
          id: string
          job_id: string
          message: string | null
          paid_cash_at: string | null
          pay_status: string
          platform_fee: number | null
          released_at: string | null
          resolution_note: string | null
          resolved_at: string | null
          resolved_by: string | null
          seeker_id: string
          seen_by_employer: boolean
          status: Database["public"]["Enums"]["application_status"]
        }
        SetofOptions: {
          from: "*"
          to: "applications"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      application_status: "pending" | "accepted" | "rejected" | "withdrawn"
      job_status: "open" | "closed"
      pay_unit: "hour" | "day" | "shift" | "job"
      plan_tier: "free" | "pro"
      user_role: "seeker" | "employer"
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
    Enums: {
      application_status: ["pending", "accepted", "rejected", "withdrawn"],
      job_status: ["open", "closed"],
      pay_unit: ["hour", "day", "shift", "job"],
      plan_tier: ["free", "pro"],
      user_role: ["seeker", "employer"],
    },
  },
} as const
