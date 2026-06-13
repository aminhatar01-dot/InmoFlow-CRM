create extension if not exists pgcrypto;
create extension if not exists citext;
create extension if not exists vector;

create type app_role as enum ('owner', 'admin', 'manager', 'agent');
create type membership_status as enum ('invited', 'active', 'suspended', 'removed');
create type invitation_status as enum ('pending', 'accepted', 'expired', 'revoked');
create type lead_status as enum ('new', 'contacted', 'qualified', 'unqualified', 'converted', 'lost', 'reactivation');
create type operation_type as enum ('sale', 'rent', 'temporary_rent');
create type property_status as enum ('draft', 'available', 'reserved', 'sold', 'rented', 'paused', 'archived');
create type appointment_status as enum ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
create type task_status as enum ('open', 'in_progress', 'done', 'cancelled');
create type message_direction as enum ('inbound', 'outbound');
create type message_status as enum ('queued', 'sent', 'delivered', 'read', 'failed', 'cancelled');
create type workflow_status as enum ('draft', 'active', 'paused', 'archived');
create type workflow_execution_status as enum ('pending', 'running', 'succeeded', 'failed', 'cancelled', 'skipped');
create type integration_provider as enum ('whatsapp', 'gmail', 'google_calendar', 'google_ads', 'meta_ads', 'zonaprop', 'argenprop', 'mercado_libre');
create type integration_status as enum ('connected', 'expired', 'revoked', 'error', 'disabled');
create type publication_status as enum ('draft', 'pending_validation', 'ready', 'published', 'failed', 'paused', 'unpublished');
create type document_status as enum ('draft', 'generated', 'sent', 'signed', 'voided', 'archived');
create type contact_channel as enum ('email', 'phone', 'whatsapp', 'instagram', 'other');
create type visibility_scope as enum ('private', 'team');
create type media_type as enum ('image', 'video', 'floor_plan', 'document');
create type calendar_sync_status as enum ('not_synced', 'syncing', 'synced', 'failed');
create type reminder_status as enum ('pending', 'sent', 'cancelled', 'failed');
create type reminder_channel as enum ('app', 'email', 'whatsapp');
create type conversation_status as enum ('open', 'pending', 'closed', 'archived');
create type ai_message_role as enum ('user', 'assistant', 'system', 'tool');
create type document_type as enum ('contract', 'receipt', 'reservation', 'other');
create type log_severity as enum ('debug', 'info', 'warning', 'error', 'critical');

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email citext not null unique,
  avatar_url text,
  locale text not null default 'es-AR',
  timezone text not null default 'America/Argentina/Buenos_Aires',
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text,
  tax_id text,
  slug citext not null unique,
  primary_email citext,
  primary_phone text,
  website_url text,
  logo_url text,
  country text not null default 'AR',
  region text,
  city text,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  default_currency char(3) not null default 'ARS',
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (id, slug)
);

create trigger tenants_set_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

create table public.tenant_memberships (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role app_role not null,
  status membership_status not null default 'invited',
  invited_by uuid references public.profiles(id) on delete set null,
  joined_at timestamptz,
  suspended_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, user_id)
);

create index tenant_memberships_user_status_idx on public.tenant_memberships (user_id, status);
create index tenant_memberships_tenant_status_idx on public.tenant_memberships (tenant_id, status);
create trigger tenant_memberships_set_updated_at
before update on public.tenant_memberships
for each row execute function public.set_updated_at();

create table public.tenant_invitations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email citext not null,
  role app_role not null,
  token_hash text not null unique,
  status invitation_status not null default 'pending',
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references public.profiles(id) on delete set null,
  invited_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create index tenant_invitations_tenant_email_idx on public.tenant_invitations (tenant_id, email, status);
create trigger tenant_invitations_set_updated_at
before update on public.tenant_invitations
for each row execute function public.set_updated_at();

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  role app_role not null,
  permission_key text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, role, permission_key)
);

create trigger role_permissions_set_updated_at
before update on public.role_permissions
for each row execute function public.set_updated_at();

create table public.lead_sources (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  kind text not null,
  provider integration_provider,
  external_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, name)
);

create trigger lead_sources_set_updated_at
before update on public.lead_sources
for each row execute function public.set_updated_at();

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source_id uuid,
  assigned_agent_id uuid,
  status lead_status not null default 'new',
  first_name text,
  last_name text,
  display_name text not null,
  email citext,
  phone text,
  normalized_phone text,
  preferred_contact_channel contact_channel,
  operation_type operation_type,
  budget_min numeric(14,2) check (budget_min is null or budget_min >= 0),
  budget_max numeric(14,2) check (budget_max is null or budget_max >= 0),
  currency char(3),
  preferred_locations jsonb not null default '[]'::jsonb,
  property_type_interest text,
  bedrooms_min integer check (bedrooms_min is null or bedrooms_min >= 0),
  bathrooms_min integer check (bathrooms_min is null or bathrooms_min >= 0),
  area_min numeric(12,2) check (area_min is null or area_min >= 0),
  notes text,
  score integer not null default 0 check (score >= 0 and score <= 100),
  last_contacted_at timestamptz,
  next_follow_up_at timestamptz,
  converted_at timestamptz,
  lost_at timestamptz,
  lost_reason text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, source_id) references public.lead_sources(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assigned_agent_id) references public.tenant_memberships(tenant_id, user_id) on delete restrict,
  check (budget_max is null or budget_min is null or budget_max >= budget_min)
);

create index leads_tenant_status_idx on public.leads (tenant_id, status);
create index leads_tenant_agent_idx on public.leads (tenant_id, assigned_agent_id);
create index leads_tenant_phone_idx on public.leads (tenant_id, normalized_phone);
create index leads_tenant_email_idx on public.leads (tenant_id, email);
create index leads_tenant_follow_up_idx on public.leads (tenant_id, next_follow_up_at);
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

create table public.lead_contacts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null,
  type contact_channel not null,
  value text not null,
  normalized_value text not null,
  is_primary boolean not null default false,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, lead_id, type, normalized_value),
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete cascade
);

create trigger lead_contacts_set_updated_at
before update on public.lead_contacts
for each row execute function public.set_updated_at();

create table public.lead_assignments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null,
  assigned_to uuid not null,
  assigned_by uuid references public.profiles(id) on delete set null,
  reason text,
  assigned_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete cascade,
  foreign key (tenant_id, assigned_to) references public.tenant_memberships(tenant_id, user_id) on delete restrict
);

create index lead_assignments_tenant_lead_idx on public.lead_assignments (tenant_id, lead_id, assigned_at);

create table public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null,
  actor_user_id uuid references public.profiles(id) on delete set null,
  activity_type text not null,
  summary text not null,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete cascade
);

create index lead_activities_tenant_lead_idx on public.lead_activities (tenant_id, lead_id, occurred_at desc);

create table public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null,
  body text not null,
  visibility visibility_scope not null default 'team',
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete cascade
);

create trigger lead_notes_set_updated_at
before update on public.lead_notes
for each row execute function public.set_updated_at();

create table public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null,
  score integer not null check (score >= 0 and score <= 100),
  reason text not null,
  model_version text,
  calculated_by text not null check (calculated_by in ('system', 'ai', 'user')),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete cascade
);

create index lead_scores_tenant_lead_idx on public.lead_scores (tenant_id, lead_id, created_at desc);

create table public.pipelines (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  is_default boolean not null default false,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, name)
);

create unique index pipelines_one_default_per_tenant_idx on public.pipelines (tenant_id) where is_default and is_active;
create trigger pipelines_set_updated_at
before update on public.pipelines
for each row execute function public.set_updated_at();

create table public.pipeline_stages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  pipeline_id uuid not null,
  name text not null,
  position integer not null check (position >= 0),
  probability integer not null default 0 check (probability >= 0 and probability <= 100),
  is_won_stage boolean not null default false,
  is_lost_stage boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, pipeline_id, position),
  foreign key (tenant_id, pipeline_id) references public.pipelines(tenant_id, id) on delete cascade,
  check (not (is_won_stage and is_lost_stage))
);

create trigger pipeline_stages_set_updated_at
before update on public.pipeline_stages
for each row execute function public.set_updated_at();

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  code text not null,
  title text not null,
  description text,
  property_type text not null,
  operation_type operation_type not null,
  status property_status not null default 'draft',
  owner_name text,
  owner_contact text,
  internal_notes text,
  featured boolean not null default false,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, id),
  unique (tenant_id, code)
);

create index properties_tenant_status_idx on public.properties (tenant_id, status);
create index properties_tenant_operation_idx on public.properties (tenant_id, operation_type);
create index properties_tenant_type_idx on public.properties (tenant_id, property_type);
create trigger properties_set_updated_at
before update on public.properties
for each row execute function public.set_updated_at();

create table public.property_technical_specs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid not null,
  total_area numeric(12,2) check (total_area is null or total_area >= 0),
  covered_area numeric(12,2) check (covered_area is null or covered_area >= 0),
  semi_covered_area numeric(12,2) check (semi_covered_area is null or semi_covered_area >= 0),
  land_area numeric(12,2) check (land_area is null or land_area >= 0),
  rooms integer check (rooms is null or rooms >= 0),
  bedrooms integer check (bedrooms is null or bedrooms >= 0),
  bathrooms integer check (bathrooms is null or bathrooms >= 0),
  toilets integer check (toilets is null or toilets >= 0),
  garages integer check (garages is null or garages >= 0),
  floors integer check (floors is null or floors >= 0),
  floor_number integer,
  age_years integer check (age_years is null or age_years >= 0),
  orientation text,
  condition text,
  amenities jsonb not null default '[]'::jsonb,
  services jsonb not null default '[]'::jsonb,
  expenses_amount numeric(14,2) check (expenses_amount is null or expenses_amount >= 0),
  expenses_currency char(3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, property_id),
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete cascade
);

create trigger property_technical_specs_set_updated_at
before update on public.property_technical_specs
for each row execute function public.set_updated_at();

create table public.property_locations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid not null,
  country text not null default 'AR',
  region text,
  city text not null,
  neighborhood text,
  street text,
  street_number text,
  unit text,
  postal_code text,
  latitude numeric(9,6) check (latitude is null or (latitude >= -90 and latitude <= 90)),
  longitude numeric(9,6) check (longitude is null or (longitude >= -180 and longitude <= 180)),
  geohash text,
  show_exact_location boolean not null default false,
  public_address text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, property_id),
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete cascade
);

create index property_locations_area_idx on public.property_locations (tenant_id, city, neighborhood);
create index property_locations_geohash_idx on public.property_locations (tenant_id, geohash);
create trigger property_locations_set_updated_at
before update on public.property_locations
for each row execute function public.set_updated_at();

create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid not null,
  storage_path text not null,
  media_type media_type not null,
  title text,
  alt_text text,
  position integer not null default 0 check (position >= 0),
  is_cover boolean not null default false,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete cascade,
  check (storage_path like ('tenant/' || tenant_id::text || '/%'))
);

create unique index property_media_one_cover_idx on public.property_media (tenant_id, property_id) where is_cover;
create index property_media_property_position_idx on public.property_media (tenant_id, property_id, position);
create trigger property_media_set_updated_at
before update on public.property_media
for each row execute function public.set_updated_at();

create table public.property_pricing (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid not null,
  operation_type operation_type not null,
  price numeric(14,2) not null check (price >= 0),
  currency char(3) not null,
  period text not null check (period in ('monthly', 'weekly', 'daily', 'total')),
  commission_terms text,
  deposit_terms text,
  is_active boolean not null default true,
  valid_from date not null default current_date,
  valid_to date,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete cascade,
  check (valid_to is null or valid_to >= valid_from)
);

create index property_pricing_active_idx on public.property_pricing (tenant_id, property_id, is_active);

create table public.property_availability (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid not null,
  available_from date,
  available_to date,
  status property_status not null,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete cascade,
  check (available_to is null or available_from is null or available_to >= available_from)
);

create trigger property_availability_set_updated_at
before update on public.property_availability
for each row execute function public.set_updated_at();

create table public.property_publication_statuses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid not null,
  portal integration_provider not null,
  status publication_status not null default 'draft',
  external_publication_id text,
  last_published_at timestamptz,
  last_synced_at timestamptz,
  last_error text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, property_id, portal),
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete cascade,
  check (portal in ('zonaprop', 'argenprop', 'mercado_libre'))
);

create trigger property_publication_statuses_set_updated_at
before update on public.property_publication_statuses
for each row execute function public.set_updated_at();

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null,
  pipeline_id uuid not null,
  stage_id uuid not null,
  assigned_agent_id uuid,
  property_id uuid,
  title text not null,
  operation_type operation_type not null,
  amount numeric(14,2) check (amount is null or amount >= 0),
  currency char(3),
  probability integer not null default 0 check (probability >= 0 and probability <= 100),
  expected_close_date date,
  closed_at timestamptz,
  lost_reason text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete cascade,
  foreign key (tenant_id, pipeline_id) references public.pipelines(tenant_id, id) on delete restrict,
  foreign key (tenant_id, stage_id) references public.pipeline_stages(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assigned_agent_id) references public.tenant_memberships(tenant_id, user_id) on delete restrict,
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete restrict
);

create index opportunities_stage_idx on public.opportunities (tenant_id, pipeline_id, stage_id);
create index opportunities_agent_idx on public.opportunities (tenant_id, assigned_agent_id);
create index opportunities_expected_close_idx on public.opportunities (tenant_id, expected_close_date);
create trigger opportunities_set_updated_at
before update on public.opportunities
for each row execute function public.set_updated_at();

create table public.opportunity_stage_history (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  opportunity_id uuid not null,
  from_stage_id uuid,
  to_stage_id uuid not null,
  changed_by uuid references public.profiles(id) on delete set null,
  reason text,
  changed_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, opportunity_id) references public.opportunities(tenant_id, id) on delete cascade,
  foreign key (tenant_id, from_stage_id) references public.pipeline_stages(tenant_id, id) on delete restrict,
  foreign key (tenant_id, to_stage_id) references public.pipeline_stages(tenant_id, id) on delete restrict
);

create index opportunity_stage_history_opp_idx on public.opportunity_stage_history (tenant_id, opportunity_id, changed_at);

create table public.portfolios (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  lead_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete restrict
);

create trigger portfolios_set_updated_at
before update on public.portfolios
for each row execute function public.set_updated_at();

create table public.portfolio_properties (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  portfolio_id uuid not null,
  property_id uuid not null,
  position integer not null default 0 check (position >= 0),
  notes text,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, portfolio_id, property_id),
  foreign key (tenant_id, portfolio_id) references public.portfolios(tenant_id, id) on delete cascade,
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete cascade
);

create index portfolio_properties_position_idx on public.portfolio_properties (tenant_id, portfolio_id, position);

create table public.portfolio_share_links (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  portfolio_id uuid not null,
  token_hash text not null unique,
  expires_at timestamptz,
  revoked_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, portfolio_id) references public.portfolios(tenant_id, id) on delete cascade
);

create index portfolio_share_links_portfolio_idx on public.portfolio_share_links (tenant_id, portfolio_id);

create table public.portfolio_view_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  portfolio_id uuid not null,
  share_link_id uuid not null,
  ip_hash text,
  user_agent text,
  viewed_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, portfolio_id) references public.portfolios(tenant_id, id) on delete cascade,
  foreign key (tenant_id, share_link_id) references public.portfolio_share_links(tenant_id, id) on delete cascade
);

create index portfolio_view_events_portfolio_idx on public.portfolio_view_events (tenant_id, portfolio_id, viewed_at);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid,
  property_id uuid,
  assigned_agent_id uuid not null,
  status appointment_status not null default 'scheduled',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location_notes text,
  meeting_url text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cancelled_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete restrict,
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assigned_agent_id) references public.tenant_memberships(tenant_id, user_id) on delete restrict,
  check (ends_at > starts_at)
);

create index appointments_agent_time_idx on public.appointments (tenant_id, assigned_agent_id, starts_at);
create index appointments_property_time_idx on public.appointments (tenant_id, property_id, starts_at);
create trigger appointments_set_updated_at
before update on public.appointments
for each row execute function public.set_updated_at();

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid,
  property_id uuid,
  opportunity_id uuid,
  assigned_to uuid,
  created_by uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  status task_status not null default 'open',
  priority integer not null default 3 check (priority >= 1 and priority <= 5),
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete restrict,
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete restrict,
  foreign key (tenant_id, opportunity_id) references public.opportunities(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assigned_to) references public.tenant_memberships(tenant_id, user_id) on delete restrict
);

create index tasks_assignee_status_due_idx on public.tasks (tenant_id, assigned_to, status, due_at);
create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function public.set_updated_at();

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  appointment_id uuid,
  task_id uuid,
  owner_user_id uuid not null,
  title text not null,
  description text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  external_provider integration_provider,
  external_event_id text,
  sync_status calendar_sync_status not null default 'not_synced',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, appointment_id) references public.appointments(tenant_id, id) on delete cascade,
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete cascade,
  foreign key (tenant_id, owner_user_id) references public.tenant_memberships(tenant_id, user_id) on delete cascade,
  check (ends_at > starts_at),
  check (external_provider is null or external_provider = 'google_calendar')
);

create index calendar_events_owner_time_idx on public.calendar_events (tenant_id, owner_user_id, starts_at);
create trigger calendar_events_set_updated_at
before update on public.calendar_events
for each row execute function public.set_updated_at();

create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null,
  lead_id uuid,
  task_id uuid,
  appointment_id uuid,
  remind_at timestamptz not null,
  channel reminder_channel not null default 'app',
  status reminder_status not null default 'pending',
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, user_id) references public.tenant_memberships(tenant_id, user_id) on delete cascade,
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete cascade,
  foreign key (tenant_id, task_id) references public.tasks(tenant_id, id) on delete cascade,
  foreign key (tenant_id, appointment_id) references public.appointments(tenant_id, id) on delete cascade
);

create index reminders_due_idx on public.reminders (tenant_id, status, remind_at);
create trigger reminders_set_updated_at
before update on public.reminders
for each row execute function public.set_updated_at();

create table public.integration_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider integration_provider not null,
  display_name text not null,
  external_account_id text,
  status integration_status not null default 'connected',
  scopes text[] not null default '{}',
  connected_by uuid references public.profiles(id) on delete set null,
  connected_at timestamptz not null default now(),
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, provider, external_account_id)
);

create index integration_connections_provider_idx on public.integration_connections (tenant_id, provider, status);
create trigger integration_connections_set_updated_at
before update on public.integration_connections
for each row execute function public.set_updated_at();

create table public.integration_tokens (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  connection_id uuid not null,
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  expires_at timestamptz,
  rotation_required_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, connection_id),
  foreign key (tenant_id, connection_id) references public.integration_connections(tenant_id, id) on delete cascade
);

create trigger integration_tokens_set_updated_at
before update on public.integration_tokens
for each row execute function public.set_updated_at();

create table public.integration_sync_states (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  connection_id uuid not null,
  resource_type text not null,
  cursor text,
  last_synced_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, connection_id, resource_type),
  foreign key (tenant_id, connection_id) references public.integration_connections(tenant_id, id) on delete cascade
);

create trigger integration_sync_states_set_updated_at
before update on public.integration_sync_states
for each row execute function public.set_updated_at();

create table public.communication_channels (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider integration_provider not null,
  display_name text not null,
  external_account_id text,
  status integration_status not null default 'connected',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  check (provider in ('whatsapp', 'gmail'))
);

create trigger communication_channels_set_updated_at
before update on public.communication_channels
for each row execute function public.set_updated_at();

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid,
  channel_id uuid not null,
  assigned_agent_id uuid,
  subject text,
  status conversation_status not null default 'open',
  last_message_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete restrict,
  foreign key (tenant_id, channel_id) references public.communication_channels(tenant_id, id) on delete restrict,
  foreign key (tenant_id, assigned_agent_id) references public.tenant_memberships(tenant_id, user_id) on delete restrict
);

create index conversations_lead_idx on public.conversations (tenant_id, lead_id);
create index conversations_channel_last_idx on public.conversations (tenant_id, channel_id, last_message_at desc);
create trigger conversations_set_updated_at
before update on public.conversations
for each row execute function public.set_updated_at();

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null,
  lead_id uuid,
  channel_id uuid not null,
  direction message_direction not null,
  status message_status not null default 'queued',
  sender_user_id uuid,
  external_message_id text,
  from_address text,
  to_address text,
  body_text text,
  body_html text,
  attachments jsonb not null default '[]'::jsonb,
  provider_payload_redacted jsonb not null default '{}'::jsonb,
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, conversation_id) references public.conversations(tenant_id, id) on delete cascade,
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete restrict,
  foreign key (tenant_id, channel_id) references public.communication_channels(tenant_id, id) on delete restrict,
  foreign key (tenant_id, sender_user_id) references public.tenant_memberships(tenant_id, user_id) on delete restrict
);

create index messages_conversation_idx on public.messages (tenant_id, conversation_id, created_at);
create index messages_channel_status_idx on public.messages (tenant_id, channel_id, status);
create trigger messages_set_updated_at
before update on public.messages
for each row execute function public.set_updated_at();

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  channel_provider integration_provider not null,
  language text not null default 'es_AR',
  subject text,
  body text not null,
  external_template_id text,
  approval_status text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, id),
  unique (tenant_id, channel_provider, name, language),
  check (channel_provider in ('whatsapp', 'gmail'))
);

create trigger message_templates_set_updated_at
before update on public.message_templates
for each row execute function public.set_updated_at();

create table public.outbound_message_jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  message_id uuid not null,
  provider integration_provider not null,
  idempotency_key text not null,
  status message_status not null default 'queued',
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, idempotency_key),
  foreign key (tenant_id, message_id) references public.messages(tenant_id, id) on delete cascade,
  check (provider in ('whatsapp', 'gmail'))
);

create index outbound_message_jobs_due_idx on public.outbound_message_jobs (tenant_id, status, next_attempt_at);
create trigger outbound_message_jobs_set_updated_at
before update on public.outbound_message_jobs
for each row execute function public.set_updated_at();

create table public.workflow_definitions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  status workflow_status not null default 'draft',
  current_version_id uuid,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, id),
  unique (tenant_id, name)
);

create trigger workflow_definitions_set_updated_at
before update on public.workflow_definitions
for each row execute function public.set_updated_at();

create table public.workflow_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  workflow_id uuid not null,
  version_number integer not null check (version_number > 0),
  definition jsonb not null,
  published_at timestamptz,
  published_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, workflow_id, version_number),
  foreign key (tenant_id, workflow_id) references public.workflow_definitions(tenant_id, id) on delete cascade
);

alter table public.workflow_definitions
add constraint workflow_definitions_current_version_fk
foreign key (tenant_id, current_version_id) references public.workflow_versions(tenant_id, id) on delete restrict;

create table public.workflow_triggers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  workflow_id uuid not null,
  workflow_version_id uuid not null,
  event_type text not null,
  filters jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, workflow_id) references public.workflow_definitions(tenant_id, id) on delete cascade,
  foreign key (tenant_id, workflow_version_id) references public.workflow_versions(tenant_id, id) on delete cascade
);

create index workflow_triggers_event_idx on public.workflow_triggers (tenant_id, event_type, is_active);
create trigger workflow_triggers_set_updated_at
before update on public.workflow_triggers
for each row execute function public.set_updated_at();

create table public.domain_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  event_type text not null,
  aggregate_type text not null,
  aggregate_id uuid not null,
  payload jsonb not null,
  occurred_at timestamptz not null default now(),
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create index domain_events_event_idx on public.domain_events (tenant_id, event_type, occurred_at);
create index domain_events_processed_idx on public.domain_events (tenant_id, processed_at);

create table public.workflow_executions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  workflow_id uuid not null,
  workflow_version_id uuid not null,
  trigger_event_id uuid,
  status workflow_execution_status not null default 'pending',
  idempotency_key text not null,
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, idempotency_key),
  foreign key (tenant_id, workflow_id) references public.workflow_definitions(tenant_id, id) on delete cascade,
  foreign key (tenant_id, workflow_version_id) references public.workflow_versions(tenant_id, id) on delete cascade,
  foreign key (tenant_id, trigger_event_id) references public.domain_events(tenant_id, id) on delete restrict
);

create index workflow_executions_status_idx on public.workflow_executions (tenant_id, status, created_at);
create trigger workflow_executions_set_updated_at
before update on public.workflow_executions
for each row execute function public.set_updated_at();

create table public.workflow_node_executions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  workflow_execution_id uuid not null,
  node_id text not null,
  node_type text not null,
  status workflow_execution_status not null default 'pending',
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  attempt_count integer not null default 0 check (attempt_count >= 0),
  started_at timestamptz,
  finished_at timestamptz,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, workflow_execution_id) references public.workflow_executions(tenant_id, id) on delete cascade
);

create index workflow_node_executions_execution_idx on public.workflow_node_executions (tenant_id, workflow_execution_id);
create trigger workflow_node_executions_set_updated_at
before update on public.workflow_node_executions
for each row execute function public.set_updated_at();

create table public.ai_knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  source_type text not null,
  source_id uuid,
  title text not null,
  content_hash text not null,
  storage_path text,
  status text not null default 'ready',
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, content_hash),
  check (storage_path is null or storage_path like ('tenant/' || tenant_id::text || '/%'))
);

create trigger ai_knowledge_documents_set_updated_at
before update on public.ai_knowledge_documents
for each row execute function public.set_updated_at();

create table public.ai_embeddings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  knowledge_document_id uuid not null,
  source_type text not null,
  source_id uuid,
  chunk_index integer not null check (chunk_index >= 0),
  chunk_text text not null,
  embedding vector(1536) not null,
  embedding_model text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, knowledge_document_id, chunk_index),
  foreign key (tenant_id, knowledge_document_id) references public.ai_knowledge_documents(tenant_id, id) on delete cascade
);

create index ai_embeddings_document_idx on public.ai_embeddings (tenant_id, knowledge_document_id);
create index ai_embeddings_vector_idx on public.ai_embeddings using ivfflat (embedding vector_cosine_ops) with (lists = 100);

create table public.ai_conversations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid,
  user_id uuid,
  title text not null,
  purpose text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete restrict,
  foreign key (tenant_id, user_id) references public.tenant_memberships(tenant_id, user_id) on delete restrict
);

create trigger ai_conversations_set_updated_at
before update on public.ai_conversations
for each row execute function public.set_updated_at();

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  conversation_id uuid not null,
  role ai_message_role not null,
  content text not null,
  token_count integer check (token_count is null or token_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, conversation_id) references public.ai_conversations(tenant_id, id) on delete cascade
);

create index ai_messages_conversation_idx on public.ai_messages (tenant_id, conversation_id, created_at);

create table public.ai_recommendations (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  lead_id uuid not null,
  property_id uuid not null,
  recommendation_type text not null,
  score integer not null check (score >= 0 and score <= 100),
  reason text not null,
  model_version text not null,
  accepted_at timestamptz,
  rejected_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete cascade,
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete cascade,
  check (not (accepted_at is not null and rejected_at is not null))
);

create index ai_recommendations_lead_idx on public.ai_recommendations (tenant_id, lead_id, created_at desc);

create table public.ai_generation_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid,
  lead_id uuid,
  purpose text not null,
  provider text not null,
  model text not null,
  prompt_hash text not null,
  input_redacted jsonb not null default '{}'::jsonb,
  output_redacted jsonb not null default '{}'::jsonb,
  token_input_count integer check (token_input_count is null or token_input_count >= 0),
  token_output_count integer check (token_output_count is null or token_output_count >= 0),
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  status text not null,
  error_message text,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, user_id) references public.tenant_memberships(tenant_id, user_id) on delete restrict,
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete restrict
);

create index ai_generation_logs_tenant_created_idx on public.ai_generation_logs (tenant_id, created_at desc);

create table public.document_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  document_type document_type not null,
  body text not null,
  variables_schema jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, id),
  unique (tenant_id, name, document_type)
);

create trigger document_templates_set_updated_at
before update on public.document_templates
for each row execute function public.set_updated_at();

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  template_id uuid,
  lead_id uuid,
  property_id uuid,
  opportunity_id uuid,
  document_type document_type not null,
  status document_status not null default 'draft',
  title text not null,
  storage_path text,
  data_snapshot jsonb not null default '{}'::jsonb,
  generated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  unique (tenant_id, id),
  foreign key (tenant_id, template_id) references public.document_templates(tenant_id, id) on delete restrict,
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete restrict,
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete restrict,
  foreign key (tenant_id, opportunity_id) references public.opportunities(tenant_id, id) on delete restrict,
  check (storage_path is null or storage_path like ('tenant/' || tenant_id::text || '/%'))
);

create index documents_status_idx on public.documents (tenant_id, status, created_at);
create trigger documents_set_updated_at
before update on public.documents
for each row execute function public.set_updated_at();

create table public.document_versions (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  document_id uuid not null,
  version_number integer not null check (version_number > 0),
  storage_path text not null,
  data_snapshot jsonb not null default '{}'::jsonb,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, document_id, version_number),
  foreign key (tenant_id, document_id) references public.documents(tenant_id, id) on delete cascade,
  check (storage_path like ('tenant/' || tenant_id::text || '/%'))
);

create table public.document_signing_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  document_id uuid not null,
  provider text not null,
  external_request_id text,
  status text not null,
  sent_at timestamptz,
  completed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  foreign key (tenant_id, document_id) references public.documents(tenant_id, id) on delete cascade
);

create trigger document_signing_requests_set_updated_at
before update on public.document_signing_requests
for each row execute function public.set_updated_at();

create table public.ad_accounts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  connection_id uuid not null,
  provider integration_provider not null,
  external_account_id text not null,
  name text not null,
  currency char(3),
  timezone text,
  status text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, provider, external_account_id),
  foreign key (tenant_id, connection_id) references public.integration_connections(tenant_id, id) on delete cascade,
  check (provider in ('google_ads', 'meta_ads'))
);

create trigger ad_accounts_set_updated_at
before update on public.ad_accounts
for each row execute function public.set_updated_at();

create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  ad_account_id uuid not null,
  provider integration_provider not null,
  external_campaign_id text not null,
  name text not null,
  status text,
  objective text,
  budget_amount numeric(14,2) check (budget_amount is null or budget_amount >= 0),
  currency char(3),
  starts_at timestamptz,
  ends_at timestamptz,
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, provider, external_campaign_id),
  foreign key (tenant_id, ad_account_id) references public.ad_accounts(tenant_id, id) on delete cascade,
  check (provider in ('google_ads', 'meta_ads')),
  check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create trigger campaigns_set_updated_at
before update on public.campaigns
for each row execute function public.set_updated_at();

create table public.ad_lead_imports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider integration_provider not null,
  campaign_id uuid,
  external_lead_id text not null,
  lead_id uuid,
  payload_redacted jsonb not null default '{}'::jsonb,
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, provider, external_lead_id),
  foreign key (tenant_id, campaign_id) references public.campaigns(tenant_id, id) on delete restrict,
  foreign key (tenant_id, lead_id) references public.leads(tenant_id, id) on delete restrict,
  check (provider in ('google_ads', 'meta_ads'))
);

create table public.portal_connections (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  provider integration_provider not null,
  display_name text not null,
  external_account_id text,
  status integration_status not null default 'connected',
  metadata jsonb not null default '{}'::jsonb,
  connected_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  check (provider in ('zonaprop', 'argenprop', 'mercado_libre'))
);

create trigger portal_connections_set_updated_at
before update on public.portal_connections
for each row execute function public.set_updated_at();

create table public.portal_publications (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  property_id uuid not null,
  portal_connection_id uuid not null,
  provider integration_provider not null,
  status publication_status not null default 'draft',
  external_publication_id text,
  validation_errors jsonb not null default '[]'::jsonb,
  published_payload jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  unpublished_at timestamptz,
  last_synced_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, property_id, provider, portal_connection_id),
  foreign key (tenant_id, property_id) references public.properties(tenant_id, id) on delete cascade,
  foreign key (tenant_id, portal_connection_id) references public.portal_connections(tenant_id, id) on delete cascade,
  check (provider in ('zonaprop', 'argenprop', 'mercado_libre'))
);

create trigger portal_publications_set_updated_at
before update on public.portal_publications
for each row execute function public.set_updated_at();

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  actor_user_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_redacted jsonb,
  after_redacted jsonb,
  ip_address inet,
  user_agent text,
  correlation_id uuid,
  created_at timestamptz not null default now(),
  unique (tenant_id, id)
);

create index audit_logs_created_idx on public.audit_logs (tenant_id, created_at desc);
create index audit_logs_entity_idx on public.audit_logs (tenant_id, entity_type, entity_id);
create index audit_logs_actor_idx on public.audit_logs (tenant_id, actor_user_id, created_at desc);

create table public.rate_limit_events (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  ip_hash text,
  scope text not null,
  limit_key text not null,
  count integer not null default 1 check (count >= 0),
  window_start timestamptz not null,
  window_end timestamptz not null,
  blocked boolean not null default false,
  created_at timestamptz not null default now(),
  check (window_end > window_start)
);

create index rate_limit_events_key_idx on public.rate_limit_events (tenant_id, scope, limit_key, window_start, window_end);

create table public.system_logs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references public.tenants(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  correlation_id uuid,
  module text not null,
  operation text not null,
  severity log_severity not null,
  message text not null,
  metadata_redacted jsonb not null default '{}'::jsonb,
  duration_ms integer check (duration_ms is null or duration_ms >= 0),
  created_at timestamptz not null default now()
);

create index system_logs_tenant_created_idx on public.system_logs (tenant_id, created_at desc);
create index system_logs_correlation_idx on public.system_logs (correlation_id);

create table public.analytics_snapshots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  snapshot_type text not null,
  period_start timestamptz not null,
  period_end timestamptz not null,
  metrics jsonb not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, id),
  unique (tenant_id, snapshot_type, period_start, period_end),
  check (period_end > period_start)
);

create index analytics_snapshots_type_period_idx on public.analytics_snapshots (tenant_id, snapshot_type, period_start, period_end);
