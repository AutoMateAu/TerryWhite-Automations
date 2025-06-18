export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      customer_accounts: {
        Row: {
          id: string
          patient_id: string
          patient_name: string
          mrn: string
          total_owed: number
          last_payment_date: string | null
          last_payment_amount: number | null
          status: "current" | "overdue" | "paid"
          created_at: string
          updated_at: string
          phone: string | null // Added phone
          due_date: string | null // Added due_date
        }
        Insert: {
          id?: string
          patient_id: string
          patient_name: string
          mrn: string
          total_owed?: number
          last_payment_date?: string | null
          last_payment_amount?: number | null
          status?: "current" | "overdue" | "paid"
          created_at?: string
          updated_at?: string
          phone?: string | null
          due_date?: string | null
        }
        Update: {
          id?: string
          patient_id?: string
          patient_name?: string
          mrn?: string
          total_owed?: number
          last_payment_date?: string | null
          last_payment_amount?: number | null
          status?: "current" | "overdue" | "paid"
          created_at?: string
          updated_at?: string
          phone?: string | null
          due_date?: string | null
        }
      }
      payment_records: {
        Row: {
          id: string
          customer_id: string // Renamed from account_id to customer_id for consistency
          amount: number
          payment_date: string
          payment_method: "cash" | "card" | "insurance" | "other"
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          amount: number
          payment_date?: string
          payment_method: "cash" | "card" | "insurance" | "other"
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          amount?: number
          payment_date?: string
          payment_method?: "cash" | "card" | "insurance" | "other"
          notes?: string | null
          created_at?: string
        }
      }
      discharge_form_accounts: {
        Row: {
          id: string
          customer_id: string
          discharge_form_id: string
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          discharge_form_id: string
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          discharge_form_id?: string
          created_at?: string
        }
      }
      discharged_patient_forms: {
        Row: {
          id: string
          patient_id: string | null // Added foreign key to patients table
          name: string
          address: string | null
          medicare: string | null
          allergies: string | null
          dob: string | null
          mrn: string
          admission_date: string | null
          discharge_date: string | null
          pharmacist: string | null
          date_list_prepared: string | null
          discharge_timestamp: string
          created_at: string
          updated_at: string
          template_type: string | null // Added template_type
          hospital_name: string | null // Added hospital_name
          medications: Json | null // Added medications as JSONB
          phone: string | null // Added phone
          concession: string | null // Added before-admission fields
          health_fund: string | null
          reason_for_admission: string | null
          relevant_past_medical_history: string | null
          community_pharmacist: string | null
          general_practitioner: string | null
          medication_risks_comments: string | null
          sources_of_history: string | null
          pharmacist_signature: string | null
          date_time_signed: string | null
        }
        Insert: {
          id?: string
          patient_id?: string | null
          name: string
          address?: string | null
          medicare?: string | null
          allergies?: string | null
          dob?: string | null
          mrn: string
          admission_date?: string | null
          discharge_date?: string | null
          pharmacist?: string | null
          date_list_prepared?: string | null
          discharge_timestamp: string
          created_at?: string
          updated_at?: string
          template_type?: string | null
          hospital_name?: string | null
          medications?: Json | null
          phone?: string | null
          concession?: string | null
          health_fund?: string | null
          reason_for_admission?: string | null
          relevant_past_medical_history?: string | null
          community_pharmacist?: string | null
          general_practitioner?: string | null
          medication_risks_comments?: string | null
          sources_of_history?: string | null
          pharmacist_signature?: string | null
          date_time_signed?: string | null
        }
        Update: {
          id?: string
          patient_id?: string | null
          name?: string
          address?: string | null
          medicare?: string | null
          allergies?: string | null
          dob?: string | null
          mrn?: string
          admission_date?: string | null
          discharge_date?: string | null
          pharmacist?: string | null
          date_list_prepared?: string | null
          discharge_timestamp?: string
          created_at?: string
          updated_at?: string
          template_type?: string | null
          hospital_name?: string | null
          medications?: Json | null
          phone?: string | null
          concession?: string | null
          health_fund?: string | null
          reason_for_admission?: string | null
          relevant_past_medical_history?: string | null
          community_pharmacist?: string | null
          general_practitioner?: string | null
          medication_risks_comments?: string | null
          sources_of_history?: string | null
          pharmacist_signature?: string | null
          date_time_signed?: string | null
        }
      }
      patients: {
        Row: {
          id: string
          name: string
          dob: string
          address: string | null
          medicare: string | null
          allergies: string | null
          mrn: string
          phone: string | null
          created_at: string
          updated_at: string
          hospital_id: string | null // Added hospital_id
        }
        Insert: {
          id?: string
          name: string
          dob: string
          address?: string | null
          medicare?: string | null
          allergies?: string | null
          mrn: string
          phone?: string | null
          created_at?: string
          updated_at?: string
          hospital_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          dob?: string
          address?: string | null
          medicare?: string | null
          allergies?: string | null
          mrn?: string
          phone?: string | null
          created_at?: string
          updated_at?: string
          hospital_id?: string | null
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
