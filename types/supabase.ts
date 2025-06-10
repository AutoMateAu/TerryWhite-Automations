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
        }
      }
      payment_records: {
        Row: {
          id: string
          customer_id: string
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
        }
        Insert: {
          id?: string
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
        }
        Update: {
          id?: string
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
        }
      }
    }
  }
}
