-- Semana 3 — Fundaciones: instituciones, sedes, roles, perfiles de usuario y membresías.
-- Diseño y alternativas: docs/decisiones/0005-instituciones-membresias-y-roles.md
-- Flujo de referencia: docs/flujos/21-usuarios-y-permisos.md
--
-- Reglas de CLAUDE.md que aplican: 1 (aislamiento), 2 (RLS siempre), 3 (seguridad en la base),
-- 6 (borrado lógico), 9 (esquema solo por migraciones), 11 (configuración antes que código).

-- ---------------------------------------------------------------------------
-- Esquema privado para funciones auxiliares.
-- No está expuesto por la API, así que nadie puede llamar estas funciones
-- directamente desde el navegador. Las políticas RLS sí las usan.
-- ---------------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;

-- ---------------------------------------------------------------------------
-- Triggers comunes
-- ---------------------------------------------------------------------------

-- Completa las columnas comunes (created_*, updated_*, deleted_by) en el servidor.
-- Lo que mande el cliente en esas columnas se ignora.
create function private.set_audit_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.created_at := now();
    new.created_by := auth.uid();
    new.updated_at := null;
    new.updated_by := null;
    new.deleted_at := null;
    new.deleted_by := null;
  else
    new.created_at := old.created_at;
    new.created_by := old.created_by;
    new.updated_at := now();
    new.updated_by := auth.uid();
    if new.deleted_at is null then
      new.deleted_by := null;
    elsif old.deleted_at is null then
      new.deleted_by := auth.uid();
    else
      new.deleted_at := old.deleted_at;
      new.deleted_by := old.deleted_by;
    end if;
  end if;
  return new;
end;
$$;

-- Un registro nunca cambia de institución. Sin esto, alguien con permiso en dos
-- instituciones podría "mudar" datos de una a otra.
create function private.prevent_institution_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.institution_id is distinct from old.institution_id then
    raise exception 'Un registro no puede cambiar de institución'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- institution — la clínica o centro cliente (el tenant)
-- ---------------------------------------------------------------------------
create table public.institution (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  legal_name text,
  tax_id text,  -- CUIT
  timezone text not null default 'America/Argentina/Mendoza',
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_at timestamptz,
  updated_by uuid references auth.users (id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id)
);

comment on table public.institution is 'Clínica o centro cliente. Es el tenant: todo dato de negocio pertenece a una.';

create trigger set_audit_columns
  before insert or update on public.institution
  for each row execute function private.set_audit_columns();

-- ---------------------------------------------------------------------------
-- role — catálogo fijo de roles, común a todas las instituciones (ADR 0005)
-- Lo mantiene IPL por migraciones. Las políticas RLS dependen de estos códigos.
-- ---------------------------------------------------------------------------
create table public.role (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z_]+$'),
  name text not null,
  sort_order integer not null
);

comment on table public.role is 'Catálogo fijo de roles. Los códigos se usan en las políticas RLS: no se editan desde la aplicación.';

insert into public.role (code, name, sort_order) values
  ('director',       'Dirección',      1),
  ('coordinator',    'Coordinación',   2),
  ('administration', 'Administración', 3),
  ('reception',      'Recepción',      4),
  ('professional',   'Profesional',    5),
  ('nursing',        'Enfermería',     6);

-- ---------------------------------------------------------------------------
-- user_profile — datos de la persona que inicia sesión
-- Uno por usuario de Supabase Auth. No tiene institution_id: una persona puede
-- pertenecer a varias instituciones.
-- ---------------------------------------------------------------------------
create table public.user_profile (
  id uuid primary key references auth.users (id),
  full_name text not null check (length(trim(full_name)) > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

comment on table public.user_profile is 'Nombre y datos de cada usuario. Se crea solo cuando se crea el usuario en Auth.';

create function private.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

create trigger touch_updated_at
  before update on public.user_profile
  for each row execute function private.touch_updated_at();

-- Al crear un usuario en Auth se crea su perfil. El nombre sale de los metadatos
-- de la invitación; si no viene, se usa el correo hasta que la persona lo complete.
create function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_profile (id, full_name)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''), new.email, 'Sin nombre')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_auth_user();

-- Los usuarios creados antes de esta migración (por ejemplo, el de prueba de la semana 2)
-- también necesitan su perfil.
insert into public.user_profile (id, full_name)
select u.id, coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), u.email, 'Sin nombre')
from auth.users u
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- site — sede, lugar físico de una institución
-- ---------------------------------------------------------------------------
create table public.site (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institution (id),
  name text not null check (length(trim(name)) > 0),
  address text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_at timestamptz,
  updated_by uuid references auth.users (id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id),
  -- Para las claves foráneas compuestas (institution_id, id) de las tablas que vengan.
  unique (institution_id, id)
);

comment on table public.site is 'Sede: lugar físico donde una institución atiende.';

create unique index site_name_unique_per_institution
  on public.site (institution_id, lower(name))
  where deleted_at is null;

create trigger set_audit_columns
  before insert or update on public.site
  for each row execute function private.set_audit_columns();

create trigger prevent_institution_change
  before update on public.site
  for each row execute function private.prevent_institution_change();

-- ---------------------------------------------------------------------------
-- membership — usuario ↔ institución ↔ rol
-- Una fila por cada rol: una persona con Dirección y Profesional tiene dos filas,
-- y sus permisos se suman (ADR 0005). La baja es lógica (deleted_at).
-- ---------------------------------------------------------------------------
create table public.membership (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institution (id),
  user_id uuid not null references public.user_profile (id),
  role_id uuid not null references public.role (id),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_at timestamptz,
  updated_by uuid references auth.users (id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id),
  unique (institution_id, id)
);

comment on table public.membership is 'Qué rol tiene cada usuario en cada institución. Una fila por rol. Se da de baja, no se borra.';

-- La misma persona no puede tener dos veces el mismo rol activo en la misma institución.
create unique index membership_active_unique
  on public.membership (institution_id, user_id, role_id)
  where deleted_at is null;

create index membership_user_idx on public.membership (user_id) where deleted_at is null;

create trigger set_audit_columns
  before insert or update on public.membership
  for each row execute function private.set_audit_columns();

create trigger prevent_institution_change
  before update on public.membership
  for each row execute function private.prevent_institution_change();

-- ---------------------------------------------------------------------------
-- Funciones auxiliares para las políticas RLS
-- Son "security definer": leen membership sin pasar por su propia política.
-- Sin esto, la política de membership se consultaría a sí misma sin fin.
-- ---------------------------------------------------------------------------

-- ¿El usuario actual tiene alguna membresía activa en esta institución?
create function private.is_member(p_institution_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.membership m
    join public.institution i on i.id = m.institution_id
    where m.institution_id = p_institution_id
      and m.user_id = auth.uid()
      and m.deleted_at is null
      and i.deleted_at is null
  );
$$;

-- ¿El usuario actual tiene alguno de estos roles activos en esta institución?
create function private.has_role(p_institution_id uuid, p_role_codes text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.membership m
    join public.role r on r.id = m.role_id
    join public.institution i on i.id = m.institution_id
    where m.institution_id = p_institution_id
      and m.user_id = auth.uid()
      and m.deleted_at is null
      and i.deleted_at is null
      and r.code = any (p_role_codes)
  );
$$;

-- ¿El usuario actual comparte alguna institución activa con este otro usuario?
create function private.shares_institution_with(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.membership mine
    join public.membership theirs on theirs.institution_id = mine.institution_id
    join public.institution i on i.id = mine.institution_id
    where mine.user_id = auth.uid()
      and theirs.user_id = p_user_id
      and mine.deleted_at is null
      and theirs.deleted_at is null
      and i.deleted_at is null
  );
$$;

revoke all on function private.is_member(uuid) from public;
revoke all on function private.has_role(uuid, text[]) from public;
revoke all on function private.shares_institution_with(uuid) from public;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.has_role(uuid, text[]) to authenticated;
grant execute on function private.shares_institution_with(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Permisos de tabla
-- Supabase da por defecto todos los permisos a anon y authenticated, y deja que
-- RLS filtre. Acá los cerramos de entrada: sin sesión no se ve nada, y nadie
-- borra filas (regla 6: borrado lógico).
-- ---------------------------------------------------------------------------
revoke all on public.institution, public.role, public.user_profile, public.site, public.membership
  from anon, authenticated;

grant select on public.institution, public.role, public.user_profile, public.site, public.membership
  to authenticated;
grant insert, update on public.site to authenticated;
-- La persona solo puede cambiar su nombre, no su id ni las fechas.
grant update (full_name) on public.user_profile to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.institution enable row level security;
alter table public.role enable row level security;
alter table public.user_profile enable row level security;
alter table public.site enable row level security;
alter table public.membership enable row level security;

-- institution: se ve solo si se es miembro. El alta y los cambios los hace IPL
-- (flujo 23), por eso no hay políticas de escritura.
create policy institution_select_members on public.institution
  for select to authenticated
  using (deleted_at is null and private.is_member(id));

-- role: el catálogo lo puede leer cualquier usuario con sesión.
create policy role_select_all on public.role
  for select to authenticated
  using (true);

-- user_profile: cada uno ve su perfil y el de quienes comparten institución con él.
create policy user_profile_select_self_or_colleague on public.user_profile
  for select to authenticated
  using (id = (select auth.uid()) or private.shares_institution_with(id));

create policy user_profile_update_self on public.user_profile
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- site: la ven los miembros; la crean y modifican solo Dirección.
create policy site_select_members on public.site
  for select to authenticated
  using (private.is_member(institution_id));

create policy site_insert_director on public.site
  for insert to authenticated
  with check (private.has_role(institution_id, array['director']));

create policy site_update_director on public.site
  for update to authenticated
  using (private.has_role(institution_id, array['director']))
  with check (private.has_role(institution_id, array['director']));

-- membership: la ven los miembros de la misma institución. Invitar, cambiar roles
-- y dar de baja llegan en la semana 5 con una función del servidor que además
-- registra en audit_log (regla 7). Hasta entonces, no hay políticas de escritura.
create policy membership_select_members on public.membership
  for select to authenticated
  using (private.is_member(institution_id));
