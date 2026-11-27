
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "audit_action": {
                  Row: {
                    "code": string,"id": string,"name": string
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"id"?: string,"name": string
                  }
                  Update: {
                    "code"?: string,"id"?: string,"name"?: string
                  }
                  Relationships: [
                    
                  ]
                },"audit_log": {
                  Row: {
                    "action_id": string,"details": NonNullable<Json>,"entity": string | null,"id": string,"institution_id": string,"occurred_at": string,"record_id": string | null,"role_codes": (string)[],"user_id": string | null,"user_name": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "action_id": string,"details"?: NonNullable<Json>,"entity"?: string | null,"id"?: string,"institution_id": string,"occurred_at"?: string,"record_id"?: string | null,"role_codes"?: (string)[],"user_id"?: string | null,"user_name"?: string | null
                  }
                  Update: {
                    "action_id"?: string,"details"?: NonNullable<Json>,"entity"?: string | null,"id"?: string,"institution_id"?: string,"occurred_at"?: string,"record_id"?: string | null,"role_codes"?: (string)[],"user_id"?: string | null,"user_name"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "audit_log_action_id_fkey"
      columns: ["action_id"]
isOneToOne: false
      referencedRelation: "audit_action"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audit_log_institution_id_fkey"
      columns: ["institution_id"]
isOneToOne: false
      referencedRelation: "institution"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "audit_log_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "user_profile"
      referencedColumns: ["id"]
    }
                  ]
                },"institution": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"deleted_by": string | null,"id": string,"legal_name": string | null,"name": string,"tax_id": string | null,"timezone": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"deleted_by"?: string | null,"id"?: string,"legal_name"?: string | null,"name": string,"tax_id"?: string | null,"timezone"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"deleted_by"?: string | null,"id"?: string,"legal_name"?: string | null,"name"?: string,"tax_id"?: string | null,"timezone"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    
                  ]
                },"institution_module": {
                  Row: {
                    "activated_at": string,"activated_by": string | null,"deactivated_at": string | null,"deactivated_by": string | null,"id": string,"institution_id": string,"module_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "activated_at"?: string,"activated_by"?: string | null,"deactivated_at"?: string | null,"deactivated_by"?: string | null,"id"?: string,"institution_id": string,"module_id": string
                  }
                  Update: {
                    "activated_at"?: string,"activated_by"?: string | null,"deactivated_at"?: string | null,"deactivated_by"?: string | null,"id"?: string,"institution_id"?: string,"module_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "institution_module_institution_id_fkey"
      columns: ["institution_id"]
isOneToOne: false
      referencedRelation: "institution"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "institution_module_module_id_fkey"
      columns: ["module_id"]
isOneToOne: false
      referencedRelation: "module"
      referencedColumns: ["id"]
    }
                  ]
                },"membership": {
                  Row: {
                    "created_at": string,"created_by": string | null,"deleted_at": string | null,"deleted_by": string | null,"id": string,"institution_id": string,"role_id": string,"updated_at": string | null,"updated_by": string | null,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"deleted_by"?: string | null,"id"?: string,"institution_id": string,"role_id": string,"updated_at"?: string | null,"updated_by"?: string | null,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"deleted_by"?: string | null,"id"?: string,"institution_id"?: string,"role_id"?: string,"updated_at"?: string | null,"updated_by"?: string | null,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "membership_institution_id_fkey"
      columns: ["institution_id"]
isOneToOne: false
      referencedRelation: "institution"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_role_id_fkey"
      columns: ["role_id"]
isOneToOne: false
      referencedRelation: "role"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "membership_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "user_profile"
      referencedColumns: ["id"]
    }
                  ]
                },"module": {
                  Row: {
                    "code": string,"description": string,"id": string,"name": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"description": string,"id"?: string,"name": string,"sort_order": number
                  }
                  Update: {
                    "code"?: string,"description"?: string,"id"?: string,"name"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"module_requirement": {
                  Row: {
                    "module_id": string,"required_module_id": string,"requirement_group": number
                  }
                  ComputedFields: never
                  Insert: {
                    "module_id": string,"required_module_id": string,"requirement_group": number
                  }
                  Update: {
                    "module_id"?: string,"required_module_id"?: string,"requirement_group"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "module_requirement_module_id_fkey"
      columns: ["module_id"]
isOneToOne: false
      referencedRelation: "module"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "module_requirement_required_module_id_fkey"
      columns: ["required_module_id"]
isOneToOne: false
      referencedRelation: "module"
      referencedColumns: ["id"]
    }
                  ]
                },"patient": {
                  Row: {
                    "birth_date": string,"chosen_name": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"deleted_by": string | null,"document_number": string,"document_number_normalized": string | null,"document_type": string,"email": string | null,"first_name": string,"id": string,"institution_id": string,"last_name": string,"phone": string | null,"registered_sex": string | null,"search_text": string | null,"status_id": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "birth_date": string,"chosen_name"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"deleted_by"?: string | null,"document_number": string,"document_number_normalized"?: never,"document_type": string,"email"?: string | null,"first_name": string,"id"?: string,"institution_id": string,"last_name": string,"phone"?: string | null,"registered_sex"?: string | null,"search_text"?: never,"status_id": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "birth_date"?: string,"chosen_name"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"deleted_by"?: string | null,"document_number"?: string,"document_number_normalized"?: never,"document_type"?: string,"email"?: string | null,"first_name"?: string,"id"?: string,"institution_id"?: string,"last_name"?: string,"phone"?: string | null,"registered_sex"?: string | null,"search_text"?: never,"status_id"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "patient_institution_id_fkey"
      columns: ["institution_id"]
isOneToOne: false
      referencedRelation: "institution"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "patient_institution_id_status_id_fkey"
      columns: ["institution_id","status_id"]
isOneToOne: false
      referencedRelation: "patient_status"
      referencedColumns: ["institution_id","id"]
    }
                  ]
                },"patient_status": {
                  Row: {
                    "code": string,"created_at": string,"created_by": string | null,"deleted_at": string | null,"deleted_by": string | null,"id": string,"institution_id": string,"is_initial": boolean,"name": string,"sort_order": number,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"deleted_by"?: string | null,"id"?: string,"institution_id": string,"is_initial"?: boolean,"name": string,"sort_order": number,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "code"?: string,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"deleted_by"?: string | null,"id"?: string,"institution_id"?: string,"is_initial"?: boolean,"name"?: string,"sort_order"?: number,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "patient_status_institution_id_fkey"
      columns: ["institution_id"]
isOneToOne: false
      referencedRelation: "institution"
      referencedColumns: ["id"]
    }
                  ]
                },"patient_status_history": {
                  Row: {
                    "changed_at": string,"changed_by": string | null,"from_status_id": string | null,"id": string,"institution_id": string,"patient_id": string,"reason": string,"to_status_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "changed_at"?: string,"changed_by"?: string | null,"from_status_id"?: string | null,"id"?: string,"institution_id": string,"patient_id": string,"reason": string,"to_status_id": string
                  }
                  Update: {
                    "changed_at"?: string,"changed_by"?: string | null,"from_status_id"?: string | null,"id"?: string,"institution_id"?: string,"patient_id"?: string,"reason"?: string,"to_status_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "patient_status_history_institution_id_from_status_id_fkey"
      columns: ["institution_id","from_status_id"]
isOneToOne: false
      referencedRelation: "patient_status"
      referencedColumns: ["institution_id","id"]
    },{
      foreignKeyName: "patient_status_history_institution_id_patient_id_fkey"
      columns: ["institution_id","patient_id"]
isOneToOne: false
      referencedRelation: "patient"
      referencedColumns: ["institution_id","id"]
    },{
      foreignKeyName: "patient_status_history_institution_id_to_status_id_fkey"
      columns: ["institution_id","to_status_id"]
isOneToOne: false
      referencedRelation: "patient_status"
      referencedColumns: ["institution_id","id"]
    }
                  ]
                },"role": {
                  Row: {
                    "code": string,"id": string,"name": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "code": string,"id"?: string,"name": string,"sort_order": number
                  }
                  Update: {
                    "code"?: string,"id"?: string,"name"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    
                  ]
                },"site": {
                  Row: {
                    "address": string | null,"created_at": string,"created_by": string | null,"deleted_at": string | null,"deleted_by": string | null,"id": string,"institution_id": string,"name": string,"updated_at": string | null,"updated_by": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"deleted_by"?: string | null,"id"?: string,"institution_id": string,"name": string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Update: {
                    "address"?: string | null,"created_at"?: string,"created_by"?: string | null,"deleted_at"?: string | null,"deleted_by"?: string | null,"id"?: string,"institution_id"?: string,"name"?: string,"updated_at"?: string | null,"updated_by"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "site_institution_id_fkey"
      columns: ["institution_id"]
isOneToOne: false
      referencedRelation: "institution"
      referencedColumns: ["id"]
    }
                  ]
                },"user_profile": {
                  Row: {
                    "created_at": string,"full_name": string,"id": string,"updated_at": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"full_name": string,"id": string,"updated_at"?: string | null
                  }
                  Update: {
                    "created_at"?: string,"full_name"?: string,"id"?: string,"updated_at"?: string | null
                  }
                  Relationships: [
                    
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "create_patient":
{ Args: { "p_birth_date": string,"p_chosen_name"?: string,"p_document_number": string,"p_document_type": string,"p_email"?: string,"p_first_name": string,"p_institution_id": string,"p_last_name": string,"p_phone"?: string,"p_registered_sex"?: string }; Returns: string
                           },
"deactivate_member":
{ Args: { "p_institution_id": string,"p_reason": string,"p_user_id": string }; Returns: boolean
                           },
"enter_institution":
{ Args: { "p_institution_id": string }; Returns: boolean
                           },
"invite_member":
{ Args: { "p_email": string,"p_full_name": string,"p_institution_id": string,"p_role_codes": (string)[] }; Returns: string
                           },
"leave_institution":
{ Args: { "p_institution_id": string }; Returns: undefined
                           },
"list_members":
{ Args: { "p_institution_id": string }; Returns: {
              "email": string,"full_name": string,"invitation_pending": boolean,"role_codes": (string)[],"user_id": string
            }[]
                           },
"module_enabled":
{ Args: { "p_institution_id": string,"p_module_code": string }; Returns: boolean
                           },
"search_patients":
{ Args: { "p_institution_id": string,"p_limit"?: number,"p_query": string }; Returns: {
              "birth_date": string,"chosen_name": string,"document_number": string,"document_type": string,"first_name": string,"id": string,"last_name": string,"status_name": string
            }[]
                           },
"set_member_roles":
{ Args: { "p_institution_id": string,"p_reason": string,"p_role_codes": (string)[],"p_user_id": string }; Returns: boolean
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
