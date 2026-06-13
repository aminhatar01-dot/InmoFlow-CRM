create or replace function public.current_user_id()
returns uuid
language sql
stable
as $$
  select auth.uid()
$$;

create or replace function public.is_tenant_member(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'
  )
$$;

create or replace function public.has_tenant_role(p_tenant_id uuid, p_roles app_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = p_tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'
      and tm.role = any(p_roles)
  )
$$;

create or replace function public.has_tenant_permission(p_tenant_id uuid, p_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tenant_memberships tm
    left join public.role_permissions rp
      on rp.tenant_id = tm.tenant_id
     and rp.role = tm.role
     and rp.permission_key = p_permission_key
    where tm.tenant_id = p_tenant_id
      and tm.user_id = auth.uid()
      and tm.status = 'active'
      and (
        tm.role in ('owner', 'admin')
        or coalesce(rp.enabled, false)
      )
  )
$$;

create or replace function public.can_manage_tenant(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_tenant_role(p_tenant_id, array['owner', 'admin']::app_role[])
$$;

create or replace function public.can_manage_team(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_tenant_role(p_tenant_id, array['owner', 'admin', 'manager']::app_role[])
$$;

create or replace function public.tenant_has_no_memberships(p_tenant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1
    from public.tenant_memberships tm
    where tm.tenant_id = p_tenant_id
  )
$$;

create or replace function public.is_valid_portfolio_share_token(p_token_hash text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.portfolio_share_links psl
    join public.portfolios p
      on p.tenant_id = psl.tenant_id
     and p.id = psl.portfolio_id
    where psl.token_hash = p_token_hash
      and psl.revoked_at is null
      and (psl.expires_at is null or psl.expires_at > now())
      and p.is_active = true
      and p.deleted_at is null
  )
$$;

create or replace function public.storage_tenant_id(p_object_name text)
returns uuid
language plpgsql
stable
as $$
declare
  path_parts text[];
begin
  path_parts := storage.foldername(p_object_name);

  if array_length(path_parts, 1) < 2 or path_parts[1] <> 'tenant' then
    return null;
  end if;

  return path_parts[2]::uuid;
exception
  when invalid_text_representation then
    return null;
end;
$$;

grant execute on function public.current_user_id() to authenticated;
grant execute on function public.is_tenant_member(uuid) to authenticated;
grant execute on function public.has_tenant_role(uuid, app_role[]) to authenticated;
grant execute on function public.has_tenant_permission(uuid, text) to authenticated;
grant execute on function public.can_manage_tenant(uuid) to authenticated;
grant execute on function public.can_manage_team(uuid) to authenticated;
grant execute on function public.tenant_has_no_memberships(uuid) to authenticated;
grant execute on function public.is_valid_portfolio_share_token(text) to anon, authenticated;
grant execute on function public.storage_tenant_id(text) to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.tenants enable row level security;
alter table public.tenant_memberships enable row level security;
alter table public.tenant_invitations enable row level security;
alter table public.role_permissions enable row level security;
alter table public.lead_sources enable row level security;
alter table public.leads enable row level security;
alter table public.lead_contacts enable row level security;
alter table public.lead_assignments enable row level security;
alter table public.lead_activities enable row level security;
alter table public.lead_notes enable row level security;
alter table public.lead_scores enable row level security;
alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.properties enable row level security;
alter table public.property_technical_specs enable row level security;
alter table public.property_locations enable row level security;
alter table public.property_media enable row level security;
alter table public.property_pricing enable row level security;
alter table public.property_availability enable row level security;
alter table public.property_publication_statuses enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_stage_history enable row level security;
alter table public.portfolios enable row level security;
alter table public.portfolio_properties enable row level security;
alter table public.portfolio_share_links enable row level security;
alter table public.portfolio_view_events enable row level security;
alter table public.appointments enable row level security;
alter table public.tasks enable row level security;
alter table public.calendar_events enable row level security;
alter table public.reminders enable row level security;
alter table public.integration_connections enable row level security;
alter table public.integration_tokens enable row level security;
alter table public.integration_sync_states enable row level security;
alter table public.communication_channels enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.message_templates enable row level security;
alter table public.outbound_message_jobs enable row level security;
alter table public.workflow_definitions enable row level security;
alter table public.workflow_versions enable row level security;
alter table public.workflow_triggers enable row level security;
alter table public.domain_events enable row level security;
alter table public.workflow_executions enable row level security;
alter table public.workflow_node_executions enable row level security;
alter table public.ai_knowledge_documents enable row level security;
alter table public.ai_embeddings enable row level security;
alter table public.ai_conversations enable row level security;
alter table public.ai_messages enable row level security;
alter table public.ai_recommendations enable row level security;
alter table public.ai_generation_logs enable row level security;
alter table public.document_templates enable row level security;
alter table public.documents enable row level security;
alter table public.document_versions enable row level security;
alter table public.document_signing_requests enable row level security;
alter table public.ad_accounts enable row level security;
alter table public.campaigns enable row level security;
alter table public.ad_lead_imports enable row level security;
alter table public.portal_connections enable row level security;
alter table public.portal_publications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.rate_limit_events enable row level security;
alter table public.system_logs enable row level security;
alter table public.analytics_snapshots enable row level security;

create policy profiles_select_self_or_tenant_member
on public.profiles
for select
to authenticated
using (
  id = auth.uid()
  or exists (
    select 1
    from public.tenant_memberships viewer
    join public.tenant_memberships target
      on target.tenant_id = viewer.tenant_id
     and target.user_id = profiles.id
    where viewer.user_id = auth.uid()
      and viewer.status = 'active'
      and target.status = 'active'
  )
);

create policy profiles_insert_self
on public.profiles
for insert
to authenticated
with check (id = auth.uid());

create policy profiles_update_self
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy tenants_select_member
on public.tenants
for select
to authenticated
using (public.is_tenant_member(id));

create policy tenants_insert_authenticated
on public.tenants
for insert
to authenticated
with check (auth.uid() is not null);

create policy tenants_update_owner_admin
on public.tenants
for update
to authenticated
using (public.can_manage_tenant(id))
with check (public.can_manage_tenant(id));

create policy tenant_memberships_select_member_same_tenant
on public.tenant_memberships
for select
to authenticated
using (user_id = auth.uid() or public.is_tenant_member(tenant_id));

create policy tenant_memberships_insert_team_manager
on public.tenant_memberships
for insert
to authenticated
with check (public.can_manage_tenant(tenant_id));

create policy tenant_memberships_insert_initial_owner
on public.tenant_memberships
for insert
to authenticated
with check (
  user_id = auth.uid()
  and role = 'owner'
  and status = 'active'
  and public.tenant_has_no_memberships(tenant_id)
);

create policy tenant_memberships_update_team_manager
on public.tenant_memberships
for update
to authenticated
using (public.can_manage_tenant(tenant_id))
with check (public.can_manage_tenant(tenant_id));

create policy tenant_invitations_select_team_manager
on public.tenant_invitations
for select
to authenticated
using (public.can_manage_team(tenant_id));

create policy tenant_invitations_insert_team_manager
on public.tenant_invitations
for insert
to authenticated
with check (public.can_manage_team(tenant_id));

create policy tenant_invitations_update_team_manager
on public.tenant_invitations
for update
to authenticated
using (public.can_manage_team(tenant_id))
with check (public.can_manage_team(tenant_id));

create policy role_permissions_select_member
on public.role_permissions
for select
to authenticated
using (public.is_tenant_member(tenant_id));

create policy role_permissions_write_owner_admin
on public.role_permissions
for all
to authenticated
using (public.can_manage_tenant(tenant_id))
with check (public.can_manage_tenant(tenant_id));

create policy tenant_read_lead_sources on public.lead_sources for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_lead_sources on public.lead_sources for insert to authenticated with check (public.can_manage_team(tenant_id));
create policy tenant_update_lead_sources on public.lead_sources for update to authenticated using (public.can_manage_team(tenant_id)) with check (public.can_manage_team(tenant_id));
create policy tenant_delete_lead_sources on public.lead_sources for delete to authenticated using (public.can_manage_tenant(tenant_id));

create policy tenant_read_leads on public.leads for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_leads on public.leads for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_leads on public.leads for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_leads on public.leads for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_lead_contacts on public.lead_contacts for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_lead_contacts on public.lead_contacts for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_lead_contacts on public.lead_contacts for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_lead_contacts on public.lead_contacts for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_lead_assignments on public.lead_assignments for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_lead_assignments on public.lead_assignments for insert to authenticated with check (public.can_manage_team(tenant_id));

create policy tenant_read_lead_activities on public.lead_activities for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_lead_activities on public.lead_activities for insert to authenticated with check (public.is_tenant_member(tenant_id));

create policy tenant_read_lead_notes on public.lead_notes for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_lead_notes on public.lead_notes for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_lead_notes on public.lead_notes for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_lead_notes on public.lead_notes for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_lead_scores on public.lead_scores for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_lead_scores on public.lead_scores for insert to authenticated with check (public.is_tenant_member(tenant_id));

create policy tenant_read_pipelines on public.pipelines for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_pipelines on public.pipelines for insert to authenticated with check (public.can_manage_team(tenant_id));
create policy tenant_update_pipelines on public.pipelines for update to authenticated using (public.can_manage_team(tenant_id)) with check (public.can_manage_team(tenant_id));
create policy tenant_delete_pipelines on public.pipelines for delete to authenticated using (public.can_manage_tenant(tenant_id));

create policy tenant_read_pipeline_stages on public.pipeline_stages for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_pipeline_stages on public.pipeline_stages for insert to authenticated with check (public.can_manage_team(tenant_id));
create policy tenant_update_pipeline_stages on public.pipeline_stages for update to authenticated using (public.can_manage_team(tenant_id)) with check (public.can_manage_team(tenant_id));
create policy tenant_delete_pipeline_stages on public.pipeline_stages for delete to authenticated using (public.can_manage_tenant(tenant_id));

create policy tenant_read_properties on public.properties for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_properties on public.properties for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_properties on public.properties for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_properties on public.properties for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_property_technical_specs on public.property_technical_specs for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_property_technical_specs on public.property_technical_specs for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_property_technical_specs on public.property_technical_specs for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_property_technical_specs on public.property_technical_specs for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_property_locations on public.property_locations for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_property_locations on public.property_locations for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_property_locations on public.property_locations for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_property_locations on public.property_locations for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_property_media on public.property_media for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_property_media on public.property_media for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_property_media on public.property_media for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_property_media on public.property_media for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_property_pricing on public.property_pricing for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_property_pricing on public.property_pricing for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_property_pricing on public.property_pricing for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_property_pricing on public.property_pricing for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_property_availability on public.property_availability for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_property_availability on public.property_availability for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_property_availability on public.property_availability for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_property_availability on public.property_availability for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_property_publication_statuses on public.property_publication_statuses for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_write_property_publication_statuses on public.property_publication_statuses for all to authenticated using (public.can_manage_team(tenant_id)) with check (public.can_manage_team(tenant_id));

create policy tenant_read_opportunities on public.opportunities for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_opportunities on public.opportunities for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_opportunities on public.opportunities for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_opportunities on public.opportunities for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_opportunity_stage_history on public.opportunity_stage_history for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_opportunity_stage_history on public.opportunity_stage_history for insert to authenticated with check (public.is_tenant_member(tenant_id));

create policy tenant_read_portfolios on public.portfolios for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_portfolios on public.portfolios for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_portfolios on public.portfolios for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_portfolios on public.portfolios for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_portfolio_properties on public.portfolio_properties for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_portfolio_properties on public.portfolio_properties for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_portfolio_properties on public.portfolio_properties for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_portfolio_properties on public.portfolio_properties for delete to authenticated using (public.is_tenant_member(tenant_id));

create policy tenant_read_portfolio_share_links on public.portfolio_share_links for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_portfolio_share_links on public.portfolio_share_links for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_portfolio_share_links on public.portfolio_share_links for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_portfolio_share_links on public.portfolio_share_links for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_portfolio_view_events on public.portfolio_view_events for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_portfolio_view_events on public.portfolio_view_events for insert to authenticated with check (public.is_tenant_member(tenant_id));

create policy tenant_read_appointments on public.appointments for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_appointments on public.appointments for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_appointments on public.appointments for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_appointments on public.appointments for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_tasks on public.tasks for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_tasks on public.tasks for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_tasks on public.tasks for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_tasks on public.tasks for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_calendar_events on public.calendar_events for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_calendar_events on public.calendar_events for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_calendar_events on public.calendar_events for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_calendar_events on public.calendar_events for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_reminders on public.reminders for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_reminders on public.reminders for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_reminders on public.reminders for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_reminders on public.reminders for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_integration_connections on public.integration_connections for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_write_integration_connections on public.integration_connections for all to authenticated using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));

create policy integration_tokens_no_client_select on public.integration_tokens for select to authenticated using (false);
create policy integration_tokens_no_client_insert on public.integration_tokens for insert to authenticated with check (false);
create policy integration_tokens_no_client_update on public.integration_tokens for update to authenticated using (false) with check (false);
create policy integration_tokens_no_client_delete on public.integration_tokens for delete to authenticated using (false);

create policy tenant_read_integration_sync_states on public.integration_sync_states for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_write_integration_sync_states on public.integration_sync_states for all to authenticated using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));

create policy tenant_read_communication_channels on public.communication_channels for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_write_communication_channels on public.communication_channels for all to authenticated using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));

create policy tenant_read_conversations on public.conversations for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_conversations on public.conversations for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_conversations on public.conversations for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_conversations on public.conversations for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_messages on public.messages for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_messages on public.messages for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_messages on public.messages for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_messages on public.messages for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_message_templates on public.message_templates for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_write_message_templates on public.message_templates for all to authenticated using (public.can_manage_team(tenant_id)) with check (public.can_manage_team(tenant_id));

create policy tenant_read_outbound_message_jobs on public.outbound_message_jobs for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_write_outbound_message_jobs on public.outbound_message_jobs for all to authenticated using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));

create policy tenant_read_workflow_definitions on public.workflow_definitions for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_write_workflow_definitions on public.workflow_definitions for all to authenticated using (public.can_manage_team(tenant_id)) with check (public.can_manage_team(tenant_id));

create policy tenant_read_workflow_versions on public.workflow_versions for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_workflow_versions on public.workflow_versions for insert to authenticated with check (public.can_manage_team(tenant_id));

create policy tenant_read_workflow_triggers on public.workflow_triggers for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_write_workflow_triggers on public.workflow_triggers for all to authenticated using (public.can_manage_team(tenant_id)) with check (public.can_manage_team(tenant_id));

create policy tenant_read_domain_events on public.domain_events for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_insert_domain_events on public.domain_events for insert to authenticated with check (public.is_tenant_member(tenant_id));

create policy tenant_read_workflow_executions on public.workflow_executions for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_write_workflow_executions on public.workflow_executions for all to authenticated using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));

create policy tenant_read_workflow_node_executions on public.workflow_node_executions for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_write_workflow_node_executions on public.workflow_node_executions for all to authenticated using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));

create policy tenant_read_ai_knowledge_documents on public.ai_knowledge_documents for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_write_ai_knowledge_documents on public.ai_knowledge_documents for all to authenticated using (public.can_manage_team(tenant_id)) with check (public.can_manage_team(tenant_id));

create policy tenant_read_ai_embeddings on public.ai_embeddings for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_write_ai_embeddings on public.ai_embeddings for all to authenticated using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));

create policy tenant_read_ai_conversations on public.ai_conversations for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_ai_conversations on public.ai_conversations for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_ai_conversations on public.ai_conversations for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_ai_conversations on public.ai_conversations for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_ai_messages on public.ai_messages for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_ai_messages on public.ai_messages for insert to authenticated with check (public.is_tenant_member(tenant_id));

create policy tenant_read_ai_recommendations on public.ai_recommendations for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_ai_recommendations on public.ai_recommendations for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_ai_recommendations on public.ai_recommendations for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));

create policy tenant_read_ai_generation_logs on public.ai_generation_logs for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_insert_ai_generation_logs on public.ai_generation_logs for insert to authenticated with check (public.is_tenant_member(tenant_id));

create policy tenant_read_document_templates on public.document_templates for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_write_document_templates on public.document_templates for all to authenticated using (public.can_manage_team(tenant_id)) with check (public.can_manage_team(tenant_id));

create policy tenant_read_documents on public.documents for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_documents on public.documents for insert to authenticated with check (public.is_tenant_member(tenant_id));
create policy tenant_update_documents on public.documents for update to authenticated using (public.is_tenant_member(tenant_id)) with check (public.is_tenant_member(tenant_id));
create policy tenant_delete_documents on public.documents for delete to authenticated using (public.can_manage_team(tenant_id));

create policy tenant_read_document_versions on public.document_versions for select to authenticated using (public.is_tenant_member(tenant_id));
create policy tenant_insert_document_versions on public.document_versions for insert to authenticated with check (public.is_tenant_member(tenant_id));

create policy tenant_read_document_signing_requests on public.document_signing_requests for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_write_document_signing_requests on public.document_signing_requests for all to authenticated using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));

create policy tenant_read_ad_accounts on public.ad_accounts for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_write_ad_accounts on public.ad_accounts for all to authenticated using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));

create policy tenant_read_campaigns on public.campaigns for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_write_campaigns on public.campaigns for all to authenticated using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));

create policy tenant_read_ad_lead_imports on public.ad_lead_imports for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_insert_ad_lead_imports on public.ad_lead_imports for insert to authenticated with check (public.can_manage_tenant(tenant_id));

create policy tenant_read_portal_connections on public.portal_connections for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_write_portal_connections on public.portal_connections for all to authenticated using (public.can_manage_tenant(tenant_id)) with check (public.can_manage_tenant(tenant_id));

create policy tenant_read_portal_publications on public.portal_publications for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_write_portal_publications on public.portal_publications for all to authenticated using (public.can_manage_team(tenant_id)) with check (public.can_manage_team(tenant_id));

create policy tenant_read_audit_logs on public.audit_logs for select to authenticated using (public.can_manage_tenant(tenant_id));
create policy tenant_insert_audit_logs on public.audit_logs for insert to authenticated with check (public.is_tenant_member(tenant_id));

create policy rate_limit_events_no_client_select on public.rate_limit_events for select to authenticated using (false);
create policy rate_limit_events_no_client_insert on public.rate_limit_events for insert to authenticated with check (false);
create policy rate_limit_events_no_client_update on public.rate_limit_events for update to authenticated using (false) with check (false);
create policy rate_limit_events_no_client_delete on public.rate_limit_events for delete to authenticated using (false);

create policy system_logs_no_client_select on public.system_logs for select to authenticated using (false);
create policy system_logs_no_client_insert on public.system_logs for insert to authenticated with check (false);
create policy system_logs_no_client_update on public.system_logs for update to authenticated using (false) with check (false);
create policy system_logs_no_client_delete on public.system_logs for delete to authenticated using (false);

create policy tenant_read_analytics_snapshots on public.analytics_snapshots for select to authenticated using (public.can_manage_team(tenant_id));
create policy tenant_insert_analytics_snapshots on public.analytics_snapshots for insert to authenticated with check (public.can_manage_tenant(tenant_id));

create policy storage_objects_tenant_read
on storage.objects
for select
to authenticated
using (
  bucket_id in ('property-media', 'documents', 'ai-knowledge', 'message-attachments', 'tenant-assets')
  and public.storage_tenant_id(name) is not null
  and public.is_tenant_member(public.storage_tenant_id(name))
);

create policy storage_objects_tenant_insert
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('property-media', 'documents', 'ai-knowledge', 'message-attachments', 'tenant-assets')
  and public.storage_tenant_id(name) is not null
  and public.is_tenant_member(public.storage_tenant_id(name))
);

create policy storage_objects_tenant_update
on storage.objects
for update
to authenticated
using (
  bucket_id in ('property-media', 'documents', 'ai-knowledge', 'message-attachments', 'tenant-assets')
  and public.storage_tenant_id(name) is not null
  and public.is_tenant_member(public.storage_tenant_id(name))
)
with check (
  bucket_id in ('property-media', 'documents', 'ai-knowledge', 'message-attachments', 'tenant-assets')
  and public.storage_tenant_id(name) is not null
  and public.is_tenant_member(public.storage_tenant_id(name))
);

create policy storage_objects_tenant_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('property-media', 'documents', 'ai-knowledge', 'message-attachments', 'tenant-assets')
  and public.storage_tenant_id(name) is not null
  and public.can_manage_team(public.storage_tenant_id(name))
);
