-- Semana 4 — Auditoría y elegir institución al entrar.
-- Diseño y alternativas: docs/decisiones/0006-auditoria.md
-- Flujo de referencia: docs/flujos/22-acceso-y-auditoria.md
--
-- Reglas de CLAUDE.md que aplican: 1, 2, 3, 7 (auditoría de solo inserción), 10 (operaciones en el servidor).

-- ---------------------------------------------------------------------------
-- audit_action — catálogo cerrado de acciones que se registran
-- Lo mantiene IPL por migraciones: cada módulo suma las suyas.
-- ---------------------------------------------------------------------------
create table public.audit_action (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z_]+$'),
  name text not null
);

comment on table public.audit_action is 'Catálogo de acciones que quedan en la auditoría, con su texto para la pantalla.';

insert into public.audit_action (code, name) values
  ('enter_institution', 'Ingresó a la institución'),
  ('leave_institution', 'Salió'),
  ('access_denied',     'Acceso denegado');

-- ---------------------------------------------------------------------------
-- audit_log — registro de solo inserción
-- ---------------------------------------------------------------------------
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institution (id),
  occurred_at timestamptz not null default now(),
  user_id uuid references public.user_profile (id),
  -- Copia del nombre y los roles en el momento del evento: si después cambian,
  -- la auditoría sigue diciendo lo que era cierto entonces.
  user_name text,
  role_codes text[] not null default '{}',
  action_id uuid not null references public.audit_action (id),
  entity text,       -- tabla afectada, por ejemplo 'clinical_note'
  record_id uuid,    -- registro afectado
  details jsonb not null default '{}',
  unique (institution_id, id)
);

comment on table public.audit_log is 'Auditoría. Solo inserción: nadie la modifica ni la borra. Se escribe solo desde funciones del servidor.';

create index audit_log_institution_time_idx on public.audit_log (institution_id, occurred_at desc);

-- Nadie modifica ni borra la auditoría, tampoco un administrador de la base.
create function private.reject_audit_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'La auditoría no se modifica ni se borra'
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger reject_update_delete
  before update or delete on public.audit_log
  for each row execute function private.reject_audit_change();

create trigger reject_truncate
  before truncate on public.audit_log
  for each statement execute function private.reject_audit_change();

-- ---------------------------------------------------------------------------
-- Escritura de la auditoría
-- Solo la usan otras funciones del servidor; la aplicación no puede llamarla.
-- El usuario, el nombre, los roles y la fecha los completa la base.
-- ---------------------------------------------------------------------------
create function private.write_audit(
  p_institution_id uuid,
  p_action_code text,
  p_entity text default null,
  p_record_id uuid default null,
  p_details jsonb default '{}'
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_action_id uuid;
begin
  select id into v_action_id from public.audit_action where code = p_action_code;
  if v_action_id is null then
    raise exception 'Acción de auditoría desconocida: %', p_action_code;
  end if;

  insert into public.audit_log (institution_id, user_id, user_name, role_codes, action_id, entity, record_id, details)
  values (
    p_institution_id,
    auth.uid(),
    (select coalesce(p.full_name, u.email)
       from auth.users u left join public.user_profile p on p.id = u.id
      where u.id = auth.uid()),
    coalesce(
      (select array_agg(r.code order by r.sort_order)
         from public.membership m join public.role r on r.id = m.role_id
        where m.institution_id = p_institution_id and m.user_id = auth.uid() and m.deleted_at is null),
      '{}'
    ),
    v_action_id,
    p_entity,
    p_record_id,
    coalesce(p_details, '{}')
  );
end;
$$;

revoke all on function private.write_audit(uuid, text, text, uuid, jsonb) from public;

-- ---------------------------------------------------------------------------
-- Entrar a una institución
-- Devuelve true si la persona tiene una membresía activa ahí, y lo registra.
-- Si no la tiene devuelve false y registra "Acceso denegado". No lanza un error
-- a propósito: un error desharía también el registro en la auditoría.
-- ---------------------------------------------------------------------------
create function public.enter_institution(p_institution_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return false;
  end if;

  if private.is_member(p_institution_id) then
    perform private.write_audit(p_institution_id, 'enter_institution', 'institution', p_institution_id);
    return true;
  end if;

  -- Solo se registra si la institución existe: no hay a quién avisarle de una que no existe.
  if exists (select 1 from public.institution where id = p_institution_id) then
    perform private.write_audit(
      p_institution_id, 'access_denied', 'institution', p_institution_id,
      jsonb_build_object('reason', 'Intentó ingresar sin una membresía activa')
    );
  end if;
  return false;
end;
$$;

-- Registra la salida. Si la persona no es miembro, no hace nada.
create function public.leave_institution(p_institution_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if private.is_member(p_institution_id) then
    perform private.write_audit(p_institution_id, 'leave_institution', 'institution', p_institution_id);
  end if;
end;
$$;

revoke all on function public.enter_institution(uuid) from public, anon;
revoke all on function public.leave_institution(uuid) from public, anon;
grant execute on function public.enter_institution(uuid) to authenticated;
grant execute on function public.leave_institution(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Permisos y RLS
-- ---------------------------------------------------------------------------
revoke all on public.audit_action, public.audit_log from anon, authenticated;
grant select on public.audit_action, public.audit_log to authenticated;

alter table public.audit_action enable row level security;
alter table public.audit_log enable row level security;

create policy audit_action_select_all on public.audit_action
  for select to authenticated
  using (true);

-- Solo Dirección lee la auditoría, y solo la de su institución.
create policy audit_log_select_director on public.audit_log
  for select to authenticated
  using (private.has_role(institution_id, array['director']));
