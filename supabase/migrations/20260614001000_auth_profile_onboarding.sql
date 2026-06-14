create or replace function public.handle_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_full_name text;
  resolved_email citext;
begin
  resolved_email := new.email::citext;
  resolved_full_name := nullif(trim(coalesce(
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name',
    split_part(new.email, '@', 1)
  )), '');

  insert into public.profiles (
    id,
    full_name,
    email,
    avatar_url,
    locale,
    timezone,
    last_login_at
  )
  values (
    new.id,
    coalesce(resolved_full_name, 'Usuario'),
    resolved_email,
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    'es-AR',
    'America/Argentina/Buenos_Aires',
    now()
  )
  on conflict (id) do update
    set full_name = excluded.full_name,
        email = excluded.email,
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
        last_login_at = now(),
        updated_at = now();

  return new;
end;
$$;

drop trigger if exists auth_users_profile_onboarding on auth.users;

create trigger auth_users_profile_onboarding
after insert or update of email, raw_user_meta_data, last_sign_in_at on auth.users
for each row
execute function public.handle_auth_user_profile();

