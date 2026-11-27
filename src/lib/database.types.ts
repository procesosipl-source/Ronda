
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
