import type { AppRole, MembershipStatus } from "@/shared/domain/types";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type ProfileRow = {
  id: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
  locale: string;
  timezone: string;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
};

export type TenantRow = {
  id: string;
  name: string;
  legal_name: string | null;
  tax_id: string | null;
  slug: string;
  primary_email: string | null;
  primary_phone: string | null;
  website_url: string | null;
  logo_url: string | null;
  country: string;
  region: string | null;
  city: string | null;
  timezone: string;
  default_currency: string;
  settings: Json;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TenantMembershipRow = {
  id: string;
  tenant_id: string;
  user_id: string;
  role: AppRole;
  status: MembershipStatus;
  invited_by: string | null;
  joined_at: string | null;
  suspended_at: string | null;
  removed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type LeadRow = {
  id: string;
  tenant_id: string;
  source_id: string | null;
  assigned_agent_id: string | null;
  status: "new" | "contacted" | "qualified" | "unqualified" | "converted" | "lost" | "reactivation";
  first_name: string | null;
  last_name: string | null;
  display_name: string;
  email: string | null;
  phone: string | null;
  normalized_phone: string | null;
  preferred_contact_channel: "email" | "phone" | "whatsapp" | "instagram" | "other" | null;
  operation_type: "sale" | "rent" | "temporary_rent" | null;
  budget_min: number | null;
  budget_max: number | null;
  currency: string | null;
  preferred_locations: Json;
  property_type_interest: string | null;
  bedrooms_min: number | null;
  bathrooms_min: number | null;
  area_min: number | null;
  notes: string | null;
  score: number;
  last_contacted_at: string | null;
  next_follow_up_at: string | null;
  converted_at: string | null;
  lost_at: string | null;
  lost_reason: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type PropertyRow = {
  id: string;
  tenant_id: string;
  code: string;
  title: string;
  description: string | null;
  property_type: string;
  operation_type: "sale" | "rent" | "temporary_rent";
  status: "draft" | "available" | "reserved" | "sold" | "rented" | "paused" | "archived";
  owner_name: string | null;
  owner_contact: string | null;
  internal_notes: string | null;
  featured: boolean;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TaskRow = {
  id: string;
  tenant_id: string;
  lead_id: string | null;
  property_id: string | null;
  opportunity_id: string | null;
  assigned_to: string | null;
  created_by: string | null;
  title: string;
  description: string | null;
  status: "open" | "in_progress" | "done" | "cancelled";
  priority: number;
  due_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type AuditLogInsert = {
  tenant_id: string;
  actor_user_id?: string | null;
  action: string;
  entity_type: string;
  entity_id?: string | null;
  before_redacted?: Json;
  after_redacted?: Json;
  ip_address?: string | null;
  user_agent?: string | null;
  correlation_id?: string | null;
};

export type RateLimitInsert = {
  tenant_id?: string | null;
  user_id?: string | null;
  ip_hash?: string | null;
  scope: string;
  limit_key: string;
  count: number;
  window_start: string;
  window_end: string;
  blocked: boolean;
};

export type SystemLogInsert = {
  tenant_id?: string | null;
  user_id?: string | null;
  correlation_id?: string | null;
  module: string;
  operation: string;
  severity: "debug" | "info" | "warning" | "error" | "critical";
  message: string;
  metadata_redacted?: Json;
  duration_ms?: number | null;
};

export type IntegrationProvider =
  | "whatsapp"
  | "gmail"
  | "google_calendar"
  | "google_ads"
  | "meta_ads"
  | "zonaprop"
  | "argenprop"
  | "mercado_libre";

export type IntegrationStatus = "connected" | "expired" | "revoked" | "error" | "disabled";

export type IntegrationConnectionRow = {
  id: string;
  tenant_id: string;
  provider: IntegrationProvider;
  display_name: string;
  external_account_id: string | null;
  status: IntegrationStatus;
  scopes: string[];
  connected_by: string | null;
  connected_at: string;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type IntegrationTokenRow = {
  id: string;
  tenant_id: string;
  connection_id: string;
  access_token_encrypted: string;
  refresh_token_encrypted: string | null;
  expires_at: string | null;
  rotation_required_at: string | null;
  created_at: string;
  updated_at: string;
};

export type IntegrationSyncStateRow = {
  id: string;
  tenant_id: string;
  connection_id: string;
  resource_type: string;
  cursor: string | null;
  last_synced_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export type CommunicationChannelRow = {
  id: string;
  tenant_id: string;
  provider: IntegrationProvider;
  display_name: string;
  external_account_id: string | null;
  status: IntegrationStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<ProfileRow>;
      tenants: Table<TenantRow>;
      tenant_memberships: Table<TenantMembershipRow>;
      leads: Table<LeadRow, Partial<LeadRow>, Partial<LeadRow>>;
      properties: Table<PropertyRow, Partial<PropertyRow>, Partial<PropertyRow>>;
      tasks: Table<TaskRow, Partial<TaskRow>, Partial<TaskRow>>;
      integration_connections: Table<IntegrationConnectionRow, Partial<IntegrationConnectionRow>, Partial<IntegrationConnectionRow>>;
      integration_tokens: Table<IntegrationTokenRow, Partial<IntegrationTokenRow>, Partial<IntegrationTokenRow>>;
      integration_sync_states: Table<IntegrationSyncStateRow, Partial<IntegrationSyncStateRow>, Partial<IntegrationSyncStateRow>>;
      communication_channels: Table<CommunicationChannelRow, Partial<CommunicationChannelRow>, Partial<CommunicationChannelRow>>;
      audit_logs: Table<Record<string, unknown>, AuditLogInsert, never>;
      rate_limit_events: Table<Record<string, unknown>, RateLimitInsert, never>;
      system_logs: Table<Record<string, unknown>, SystemLogInsert, never>;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
      membership_status: MembershipStatus;
    };
    CompositeTypes: Record<string, never>;
  };
};
