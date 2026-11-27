-- Semana 6 — Pacientes: alta, listado y búsqueda.
-- Flujos de referencia: docs/flujos/01-alta-de-paciente.md y 02-ciclo-de-vida-del-paciente.md
-- Decisiones de la semana (30/11/2026):
--   · Profesional y Enfermería todavía no ven pacientes: los verán por equipo tratante (semana 9)
--     e internación (semana 34). Se abre cuando exista la relación, no antes.
--   · Documento con tipo (DNI, Pasaporte, Otro) y número, único por tipo dentro de la institución.
--   · La obra social se suma en la semana 8, con su catálogo.
--   · Sexo registral y nombre elegido (Ley 26.743), opcionales.

-- Búsqueda sin acentos y por partes del nombre. Vienen con PostgreSQL; no son dependencias nuevas.
create extension if not exists unaccent with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- Texto en minúsculas y sin acentos, para buscar. "Pérez" y "perez" quedan iguales.
-- Se declara inmutable (con el diccionario explícito) para poder indexarla.
create function private.normalize_text(p_value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, coalesce(p_value, '')));
$$;

-- Número de documento sin puntos, guiones ni espacios, en mayúsculas. "30.123.456" = "30123456".
create function private.normalize_document(p_value text)
returns text
language sql
immutable
parallel safe
set search_path = ''
as $$
  select upper(regexp_replace(coalesce(p_value, ''), '[^0-9A-Za-z]', '', 'g'));
$$;

grant execute on function private.normalize_text(text) to authenticated;
grant execute on function private.normalize_document(text) to authenticated;

-- ---------------------------------------------------------------------------
-- patient_status — estados del paciente, configurables por institución (regla 11)
-- ---------------------------------------------------------------------------
create table public.patient_status (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institution (id),
  code text not null check (code ~ '^[a-z_]+$'),
  name text not null check (length(trim(name)) > 0),
  sort_order integer not null,
  -- Estado con el que se crea un paciente. Uno solo por institución.
  is_initial boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_at timestamptz,
  updated_by uuid references auth.users (id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id),
  unique (institution_id, id),
  unique (institution_id, code)
);

comment on table public.patient_status is 'Estados del paciente de cada institución. Vienen cinco por defecto; la institución los puede ajustar.';

create unique index patient_status_one_initial
  on public.patient_status (institution_id)
  where is_initial and deleted_at is null;

create trigger set_audit_columns
  before insert or update on public.patient_status
  for each row execute function private.set_audit_columns();

create trigger prevent_institution_change
  before update on public.patient_status
  for each row execute function private.prevent_institution_change();

-- Cada institución nueva arranca con los estados por defecto (flujo 02).
create function private.create_default_patient_statuses()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.patient_status (institution_id, code, name, sort_order, is_initial) values
    (new.id, 'pre_admission', 'Preadmisión',    1, true),
    (new.id, 'admission',     'Admisión',       2, false),
    (new.id, 'in_treatment',  'En tratamiento', 3, false),
    (new.id, 'discharged',    'Alta',           4, false),
    (new.id, 'dropped',       'Baja',           5, false);
  return new;
end;
$$;

create trigger create_default_patient_statuses
  after insert on public.institution
  for each row execute function private.create_default_patient_statuses();

-- Las instituciones que ya existen también los necesitan.
insert into public.patient_status (institution_id, code, name, sort_order, is_initial)
select i.id, s.code, s.name, s.sort_order, s.is_initial
from public.institution i
cross join (values
  ('pre_admission', 'Preadmisión',    1, true),
  ('admission',     'Admisión',       2, false),
  ('in_treatment',  'En tratamiento', 3, false),
  ('discharged',    'Alta',           4, false),
  ('dropped',       'Baja',           5, false)
) as s(code, name, sort_order, is_initial)
on conflict (institution_id, code) do nothing;

-- ---------------------------------------------------------------------------
-- patient
-- ---------------------------------------------------------------------------
create table public.patient (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institution (id),
  first_name text not null check (length(trim(first_name)) > 0),
  last_name text not null check (length(trim(last_name)) > 0),
  -- Nombre con el que la persona pide que la llamen (Ley 26.743). Si está, la pantalla lo usa.
  chosen_name text,
  document_type text not null check (document_type in ('dni', 'passport', 'other')),
  document_number text not null,
  document_number_normalized text generated always as (private.normalize_document(document_number)) stored,
  birth_date date not null check (birth_date >= date '1900-01-01'),
  registered_sex text check (registered_sex in ('F', 'M', 'X')),
  phone text,
  email text,
  status_id uuid not null,
  search_text text generated always as (
    private.normalize_text(last_name || ' ' || first_name || ' ' || coalesce(chosen_name, ''))
  ) stored,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_at timestamptz,
  updated_by uuid references auth.users (id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id),
  unique (institution_id, id),
  check (length(document_number_normalized) > 0),
  -- Clave compuesta: el estado tiene que ser de la misma institución (regla 1).
  foreign key (institution_id, status_id) references public.patient_status (institution_id, id)
);

comment on table public.patient is 'Persona atendida. Única por tipo y número de documento dentro de cada institución. No se borra: se da de baja.';

-- Documento único por institución (flujo 01). Sin excepciones: tampoco con un paciente dado de baja,
-- que se reingresa al mismo legajo.
create unique index patient_document_unique
  on public.patient (institution_id, document_type, document_number_normalized);

create index patient_search_trgm on public.patient using gin (search_text extensions.gin_trgm_ops);
create index patient_document_trgm on public.patient using gin (document_number_normalized extensions.gin_trgm_ops);

create trigger set_audit_columns
  before insert or update on public.patient
  for each row execute function private.set_audit_columns();

create trigger prevent_institution_change
  before update on public.patient
  for each row execute function private.prevent_institution_change();

create trigger reject_delete
  before delete on public.patient
  for each row execute function private.reject_delete();

-- ---------------------------------------------------------------------------
-- patient_status_history — historial de estados, de solo inserción
-- ---------------------------------------------------------------------------
create table public.patient_status_history (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  patient_id uuid not null,
  from_status_id uuid,
  to_status_id uuid not null,
  changed_at timestamptz not null default now(),
  changed_by uuid references auth.users (id),
  reason text not null check (length(trim(reason)) > 0),
  unique (institution_id, id),
  foreign key (institution_id, patient_id) references public.patient (institution_id, id),
  foreign key (institution_id, from_status_id) references public.patient_status (institution_id, id),
  foreign key (institution_id, to_status_id) references public.patient_status (institution_id, id)
);

comment on table public.patient_status_history is 'Cada cambio de estado de un paciente: de, a, cuándo, quién y por qué. No se modifica ni se borra.';

create index patient_status_history_patient_idx on public.patient_status_history (institution_id, patient_id, changed_at);

create function private.reject_change()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Este historial no se modifica ni se borra'
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger reject_update_delete
  before update or delete on public.patient_status_history
  for each row execute function private.reject_change();

-- ---------------------------------------------------------------------------
-- Quién ve pacientes (flujo 21, "Rol y relación"). Profesional y Enfermería, todavía no.
-- ---------------------------------------------------------------------------
create function private.can_read_patients(p_institution_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.has_role(p_institution_id, array['director', 'coordinator', 'administration', 'reception']);
$$;

revoke all on function private.can_read_patients(uuid) from public;
grant execute on function private.can_read_patients(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Alta de paciente (flujo 01). Devuelve el id, o null si quien llama no tiene permiso
-- (y lo registra como acceso denegado, sin lanzar error: ADR 0006).
-- ---------------------------------------------------------------------------
insert into public.audit_action (code, name) values
  ('patient_created', 'Dio de alta a un paciente');

create function public.create_patient(
  p_institution_id uuid,
  p_first_name text,
  p_last_name text,
  p_document_type text,
  p_document_number text,
  p_birth_date date,
  p_registered_sex text default null,
  p_chosen_name text default null,
  p_phone text default null,
  p_email text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_status_id uuid;
  v_patient_id uuid;
  v_document text := private.normalize_document(p_document_number);
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
begin
  if auth.uid() is null or not private.has_role(p_institution_id, array['director', 'administration', 'reception']) then
    if auth.uid() is not null and exists (select 1 from public.institution where id = p_institution_id) then
      perform private.write_audit(p_institution_id, 'access_denied', 'patient', null,
        jsonb_build_object('reason', 'Intentó dar de alta un paciente sin permiso'));
    end if;
    return null;
  end if;

  if length(trim(coalesce(p_first_name, ''))) = 0 then raise exception 'Escribí el nombre.'; end if;
  if length(trim(coalesce(p_last_name, ''))) = 0 then raise exception 'Escribí el apellido.'; end if;
  if p_document_type is null or p_document_type not in ('dni', 'passport', 'other') then
    raise exception 'Elegí el tipo de documento.';
  end if;
  if length(v_document) = 0 then raise exception 'Escribí el número de documento.'; end if;
  if p_document_type = 'dni' and v_document !~ '^[0-9]{7,8}$' then
    raise exception 'El DNI tiene que tener 7 u 8 números.';
  end if;
  if p_birth_date is null then raise exception 'Escribí la fecha de nacimiento.'; end if;
  if p_birth_date > (now() at time zone 'America/Argentina/Mendoza')::date then
    raise exception 'La fecha de nacimiento no puede ser futura.';
  end if;
  if p_birth_date < date '1900-01-01' then raise exception 'Revisá la fecha de nacimiento.'; end if;
  if p_registered_sex is not null and p_registered_sex not in ('F', 'M', 'X') then
    raise exception 'Revisá el sexo registral.';
  end if;
  if v_email is not null and v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Revisá el correo: no parece válido.';
  end if;

  if exists (
    select 1 from public.patient
    where institution_id = p_institution_id and document_type = p_document_type and document_number_normalized = v_document
  ) then
    raise exception 'Ya hay un paciente con ese documento en la institución.';
  end if;

  select id into v_status_id from public.patient_status
  where institution_id = p_institution_id and is_initial and deleted_at is null;
  if v_status_id is null then
    raise exception 'La institución no tiene un estado inicial para pacientes. Avisale a IPL.';
  end if;

  insert into public.patient (
    institution_id, first_name, last_name, chosen_name, document_type, document_number,
    birth_date, registered_sex, phone, email, status_id
  ) values (
    p_institution_id, trim(p_first_name), trim(p_last_name), nullif(trim(coalesce(p_chosen_name, '')), ''),
    p_document_type, trim(p_document_number), p_birth_date, p_registered_sex,
    nullif(trim(coalesce(p_phone, '')), ''), v_email, v_status_id
  )
  returning id into v_patient_id;

  insert into public.patient_status_history (institution_id, patient_id, from_status_id, to_status_id, changed_by, reason)
  values (p_institution_id, v_patient_id, null, v_status_id, auth.uid(), 'Alta del paciente');

  perform private.write_audit(p_institution_id, 'patient_created', 'patient', v_patient_id, '{}');
  return v_patient_id;
exception
  -- Dos personas cargando el mismo documento a la vez: la segunda recibe el mismo aviso.
  when unique_violation then
    raise exception 'Ya hay un paciente con ese documento en la institución.';
end;
$$;

revoke all on function public.create_patient(uuid, text, text, text, text, date, text, text, text, text) from public, anon;
grant execute on function public.create_patient(uuid, text, text, text, text, date, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Búsqueda. Corre con los permisos de quien busca (security invoker): RLS decide qué ve.
-- Si lo buscado parece un documento, busca por número; si no, por nombre y apellido,
-- palabra por palabra, sin acentos.
-- ---------------------------------------------------------------------------
create function public.search_patients(p_institution_id uuid, p_query text, p_limit integer default 50)
returns table (
  id uuid,
  first_name text,
  last_name text,
  chosen_name text,
  document_type text,
  document_number text,
  birth_date date,
  status_name text
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select
      private.normalize_text(trim(coalesce(p_query, ''))) as text_query,
      private.normalize_document(p_query) as doc_query,
      coalesce(p_query, '') ~ '^[\s0-9.\-]+$' and private.normalize_document(p_query) <> '' as looks_like_document
  )
  select p.id, p.first_name, p.last_name, p.chosen_name, p.document_type, p.document_number, p.birth_date, s.name
  from public.patient p
  join public.patient_status s on s.institution_id = p.institution_id and s.id = p.status_id
  cross join q
  where p.institution_id = p_institution_id
    and p.deleted_at is null
    and (
      q.text_query = ''
      or (q.looks_like_document and p.document_number_normalized like q.doc_query || '%')
      or (not q.looks_like_document and p.search_text like all (
            select '%' || word || '%' from regexp_split_to_table(q.text_query, '\s+') as word where word <> ''
          ))
    )
  order by p.search_text  -- apellido y nombre sin acentos: "Pérez" va antes que "Persona"
  limit least(greatest(coalesce(p_limit, 50), 1), 200);
$$;

revoke all on function public.search_patients(uuid, text, integer) from public, anon;
grant execute on function public.search_patients(uuid, text, integer) to authenticated;

-- ---------------------------------------------------------------------------
-- Permisos y RLS
-- ---------------------------------------------------------------------------
revoke all on public.patient_status, public.patient, public.patient_status_history from anon, authenticated;
grant select on public.patient_status, public.patient, public.patient_status_history to authenticated;

alter table public.patient_status enable row level security;
alter table public.patient enable row level security;
alter table public.patient_status_history enable row level security;

create policy patient_status_select_members on public.patient_status
  for select to authenticated
  using (private.is_member(institution_id));

create policy patient_select_by_role on public.patient
  for select to authenticated
  using (private.can_read_patients(institution_id));

create policy patient_status_history_select_by_role on public.patient_status_history
  for select to authenticated
  using (private.can_read_patients(institution_id));
