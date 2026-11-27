-- Semana 7 — Ficha del paciente: cambiar de estado, editar datos y referentes.
-- Flujos: docs/flujos/01-alta-de-paciente.md y 02-ciclo-de-vida-del-paciente.md
-- Decisiones del 30/11/2026:
--   · Cambian de estado Dirección y Administración (no Recepción).
--   · Las transiciones permitidas son configurables por institución (regla 11).
--   · "Referente" = familiar o contacto del paciente (patient_contact).

-- ---------------------------------------------------------------------------
-- Transiciones de estado permitidas, por institución
-- ---------------------------------------------------------------------------
create table public.patient_status_transition (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institution (id),
  from_status_id uuid not null,
  to_status_id uuid not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_at timestamptz,
  updated_by uuid references auth.users (id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id),
  unique (institution_id, id),
  check (from_status_id <> to_status_id),
  foreign key (institution_id, from_status_id) references public.patient_status (institution_id, id),
  foreign key (institution_id, to_status_id) references public.patient_status (institution_id, id)
);

comment on table public.patient_status_transition is 'Desde qué estado se puede pasar a cuál, en cada institución. Lo que no está acá, la base lo rechaza.';

create unique index patient_status_transition_active_unique
  on public.patient_status_transition (institution_id, from_status_id, to_status_id)
  where deleted_at is null;

create trigger set_audit_columns
  before insert or update on public.patient_status_transition
  for each row execute function private.set_audit_columns();

create trigger prevent_institution_change
  before update on public.patient_status_transition
  for each row execute function private.prevent_institution_change();

-- Transiciones por defecto del flujo 02, para una institución que ya tiene los estados por defecto.
create function private.create_default_patient_status_transitions(p_institution_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.patient_status_transition (institution_id, from_status_id, to_status_id)
  select p_institution_id, f.id, t.id
  from (values
    ('pre_admission', 'admission'),
    ('pre_admission', 'dropped'),
    ('admission',     'in_treatment'),
    ('admission',     'dropped'),
    ('in_treatment',  'discharged'),
    ('in_treatment',  'dropped'),
    ('discharged',    'in_treatment'),  -- reingreso
    ('dropped',       'in_treatment')   -- reingreso
  ) as d(from_code, to_code)
  join public.patient_status f on f.institution_id = p_institution_id and f.code = d.from_code
  join public.patient_status t on t.institution_id = p_institution_id and t.code = d.to_code
  on conflict do nothing;
$$;

revoke all on function private.create_default_patient_status_transitions(uuid) from public;

-- Una institución nueva arranca con los estados y las transiciones por defecto.
create or replace function private.create_default_patient_statuses()
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
  perform private.create_default_patient_status_transitions(new.id);
  return new;
end;
$$;

select private.create_default_patient_status_transitions(id) from public.institution;

-- ---------------------------------------------------------------------------
-- Domicilio (flujo 01: se completa en la admisión)
-- ---------------------------------------------------------------------------
alter table public.patient add column address text;

-- La hora del reloj real, no la del comienzo de la transacción: dos cambios seguidos quedan en orden.
alter table public.patient_status_history alter column changed_at set default clock_timestamp();

-- Quién cambió el estado, para mostrar su nombre en el historial.
alter table public.patient_status_history
  add constraint patient_status_history_changed_by_profile_fkey
  foreign key (changed_by) references public.user_profile (id);

-- ---------------------------------------------------------------------------
-- Validación común del alta y la edición
-- ---------------------------------------------------------------------------
create function private.validate_patient_fields(
  p_first_name text,
  p_last_name text,
  p_document_type text,
  p_document_number text,
  p_birth_date date,
  p_registered_sex text,
  p_email text
)
returns void
language plpgsql
stable
set search_path = ''
as $$
declare
  v_document text := private.normalize_document(p_document_number);
  v_email text := nullif(lower(trim(coalesce(p_email, ''))), '');
begin
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
end;
$$;

revoke all on function private.validate_patient_fields(text, text, text, text, date, text, text) from public;

-- El alta usa la validación común (mismo comportamiento que en la semana 6).
create or replace function public.create_patient(
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
begin
  if auth.uid() is null or not private.has_role(p_institution_id, array['director', 'administration', 'reception']) then
    if auth.uid() is not null and exists (select 1 from public.institution where id = p_institution_id) then
      perform private.write_audit(p_institution_id, 'access_denied', 'patient', null,
        jsonb_build_object('reason', 'Intentó dar de alta un paciente sin permiso'));
    end if;
    return null;
  end if;

  perform private.validate_patient_fields(p_first_name, p_last_name, p_document_type, p_document_number,
                                          p_birth_date, p_registered_sex, p_email);

  if exists (
    select 1 from public.patient
    where institution_id = p_institution_id and document_type = p_document_type
      and document_number_normalized = private.normalize_document(p_document_number)
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
    nullif(trim(coalesce(p_phone, '')), ''), nullif(lower(trim(coalesce(p_email, ''))), ''), v_status_id
  )
  returning id into v_patient_id;

  insert into public.patient_status_history (institution_id, patient_id, from_status_id, to_status_id, changed_by, reason)
  values (p_institution_id, v_patient_id, null, v_status_id, auth.uid(), 'Alta del paciente');

  perform private.write_audit(p_institution_id, 'patient_created', 'patient', v_patient_id, '{}');
  return v_patient_id;
exception
  when unique_violation then
    raise exception 'Ya hay un paciente con ese documento en la institución.';
end;
$$;

-- ---------------------------------------------------------------------------
-- Cambiar de estado (flujo 02). Operación crítica en el servidor (regla 10).
-- Devuelve false si quien llama no tiene permiso (y lo registra, ADR 0006).
-- ---------------------------------------------------------------------------
insert into public.audit_action (code, name) values
  ('patient_status_changed', 'Cambió el estado de un paciente'),
  ('patient_updated',        'Editó los datos de un paciente');

create function public.change_patient_status(
  p_institution_id uuid,
  p_patient_id uuid,
  p_to_status_id uuid,
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_from_status_id uuid;
  v_from_name text;
  v_to_name text;
begin
  if auth.uid() is null or not private.has_role(p_institution_id, array['director', 'administration']) then
    if auth.uid() is not null and exists (select 1 from public.institution where id = p_institution_id) then
      perform private.write_audit(p_institution_id, 'access_denied', 'patient', null,
        jsonb_build_object('reason', 'Intentó cambiar el estado de un paciente sin permiso'));
    end if;
    return false;
  end if;

  -- "for update" evita que dos personas cambien el mismo paciente a la vez.
  select status_id into v_from_status_id
  from public.patient
  where institution_id = p_institution_id and id = p_patient_id and deleted_at is null
  for update;
  if v_from_status_id is null then
    raise exception 'No encontramos ese paciente.';
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Escribí el motivo del cambio.';
  end if;

  select name into v_from_name from public.patient_status where id = v_from_status_id;
  select name into v_to_name from public.patient_status
  where institution_id = p_institution_id and id = p_to_status_id and deleted_at is null;
  if v_to_name is null then
    raise exception 'Ese estado no existe en la institución.';
  end if;
  if p_to_status_id = v_from_status_id then
    raise exception 'El paciente ya está en %.', v_from_name;
  end if;

  if not exists (
    select 1 from public.patient_status_transition
    where institution_id = p_institution_id and from_status_id = v_from_status_id
      and to_status_id = p_to_status_id and deleted_at is null
  ) then
    raise exception 'No se puede pasar de % a %.', v_from_name, v_to_name;
  end if;

  update public.patient set status_id = p_to_status_id
  where institution_id = p_institution_id and id = p_patient_id;

  insert into public.patient_status_history (institution_id, patient_id, from_status_id, to_status_id, changed_by, reason)
  values (p_institution_id, p_patient_id, v_from_status_id, p_to_status_id, auth.uid(), trim(p_reason));

  perform private.write_audit(p_institution_id, 'patient_status_changed', 'patient', p_patient_id,
    jsonb_build_object('from', v_from_name, 'to', v_to_name, 'reason', trim(p_reason)));
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Editar datos personales (flujo 01). La auditoría guarda cada campo que cambió,
-- con su valor anterior y el nuevo. Devuelve false si quien llama no tiene permiso.
-- ---------------------------------------------------------------------------
create function public.update_patient(
  p_institution_id uuid,
  p_patient_id uuid,
  p_first_name text,
  p_last_name text,
  p_chosen_name text,
  p_document_type text,
  p_document_number text,
  p_birth_date date,
  p_registered_sex text,
  p_phone text,
  p_email text,
  p_address text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old public.patient%rowtype;
  v_new jsonb;
  v_changes jsonb := '{}';
  v_field text;
begin
  if auth.uid() is null or not private.has_role(p_institution_id, array['director', 'administration', 'reception']) then
    if auth.uid() is not null and exists (select 1 from public.institution where id = p_institution_id) then
      perform private.write_audit(p_institution_id, 'access_denied', 'patient', null,
        jsonb_build_object('reason', 'Intentó editar los datos de un paciente sin permiso'));
    end if;
    return false;
  end if;

  select * into v_old from public.patient
  where institution_id = p_institution_id and id = p_patient_id and deleted_at is null
  for update;
  if v_old.id is null then
    raise exception 'No encontramos ese paciente.';
  end if;

  perform private.validate_patient_fields(p_first_name, p_last_name, p_document_type, p_document_number,
                                          p_birth_date, p_registered_sex, p_email);

  if exists (
    select 1 from public.patient
    where institution_id = p_institution_id and id <> p_patient_id and document_type = p_document_type
      and document_number_normalized = private.normalize_document(p_document_number)
  ) then
    raise exception 'Ya hay otro paciente con ese documento en la institución.';
  end if;

  v_new := jsonb_build_object(
    'first_name',      trim(p_first_name),
    'last_name',       trim(p_last_name),
    'chosen_name',     nullif(trim(coalesce(p_chosen_name, '')), ''),
    'document_type',   p_document_type,
    'document_number', trim(p_document_number),
    'birth_date',      p_birth_date,
    'registered_sex',  p_registered_sex,
    'phone',           nullif(trim(coalesce(p_phone, '')), ''),
    'email',           nullif(lower(trim(coalesce(p_email, ''))), ''),
    'address',         nullif(trim(coalesce(p_address, '')), '')
  );

  for v_field in select jsonb_object_keys(v_new) loop
    if (to_jsonb(v_old) -> v_field) is distinct from (v_new -> v_field) then
      v_changes := v_changes || jsonb_build_object(v_field,
        jsonb_build_object('before', to_jsonb(v_old) -> v_field, 'after', v_new -> v_field));
    end if;
  end loop;

  if v_changes = '{}' then
    return true;  -- no cambió nada: no se registra
  end if;

  update public.patient set
    first_name      = v_new ->> 'first_name',
    last_name       = v_new ->> 'last_name',
    chosen_name     = v_new ->> 'chosen_name',
    document_type   = v_new ->> 'document_type',
    document_number = v_new ->> 'document_number',
    birth_date      = (v_new ->> 'birth_date')::date,
    registered_sex  = v_new ->> 'registered_sex',
    phone           = v_new ->> 'phone',
    email           = v_new ->> 'email',
    address         = v_new ->> 'address'
  where institution_id = p_institution_id and id = p_patient_id;

  perform private.write_audit(p_institution_id, 'patient_updated', 'patient', p_patient_id,
    jsonb_build_object('changes', v_changes));
  return true;
exception
  when unique_violation then
    raise exception 'Ya hay otro paciente con ese documento en la institución.';
end;
$$;

revoke all on function public.change_patient_status(uuid, uuid, uuid, text) from public, anon;
revoke all on function public.update_patient(uuid, uuid, text, text, text, text, text, date, text, text, text, text) from public, anon;
grant execute on function public.change_patient_status(uuid, uuid, uuid, text) to authenticated;
grant execute on function public.update_patient(uuid, uuid, text, text, text, text, text, date, text, text, text, text) to authenticated;

-- ---------------------------------------------------------------------------
-- patient_contact — referentes: familiares o contactos responsables del paciente
-- Primera tabla que la aplicación escribe directo (no es una operación crítica);
-- igual, RLS decide quién puede leer y escribir.
-- ---------------------------------------------------------------------------
create table public.patient_contact (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  patient_id uuid not null,
  full_name text not null check (length(trim(full_name)) > 0),
  relationship text not null check (relationship in ('mother', 'father', 'partner', 'sibling', 'child', 'guardian', 'other')),
  phone text not null check (length(trim(phone)) > 0),
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_at timestamptz,
  updated_by uuid references auth.users (id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id),
  unique (institution_id, id),
  foreign key (institution_id, patient_id) references public.patient (institution_id, id)
);

comment on table public.patient_contact is 'Referentes del paciente: familiares o contactos responsables. Uno puede ser el principal. Se dan de baja, no se borran.';

create unique index patient_contact_one_primary
  on public.patient_contact (institution_id, patient_id)
  where is_primary and deleted_at is null;

create index patient_contact_patient_idx on public.patient_contact (institution_id, patient_id) where deleted_at is null;

-- Un referente no cambia de paciente. Al marcar uno como principal, se desmarca el anterior.
-- Al darlo de baja, deja de ser principal.
create function private.handle_patient_contact()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.patient_id is distinct from old.patient_id then
    raise exception 'Un referente no puede pasar a otro paciente'
      using errcode = 'check_violation';
  end if;
  if new.deleted_at is not null then
    new.is_primary := false;
  end if;
  if new.is_primary and (tg_op = 'INSERT' or not old.is_primary) then
    update public.patient_contact
       set is_primary = false
     where institution_id = new.institution_id and patient_id = new.patient_id
       and id <> new.id and is_primary and deleted_at is null;
  end if;
  return new;
end;
$$;

create trigger handle_patient_contact
  before insert or update on public.patient_contact
  for each row execute function private.handle_patient_contact();

create trigger set_audit_columns
  before insert or update on public.patient_contact
  for each row execute function private.set_audit_columns();

create trigger prevent_institution_change
  before update on public.patient_contact
  for each row execute function private.prevent_institution_change();

create trigger reject_delete
  before delete on public.patient_contact
  for each row execute function private.reject_delete();

-- ---------------------------------------------------------------------------
-- Permisos y RLS
-- ---------------------------------------------------------------------------
revoke all on public.patient_status_transition, public.patient_contact from anon, authenticated;
grant select on public.patient_status_transition, public.patient_contact to authenticated;
grant insert (institution_id, patient_id, full_name, relationship, phone, is_primary) on public.patient_contact to authenticated;
grant update (full_name, relationship, phone, is_primary, deleted_at) on public.patient_contact to authenticated;

alter table public.patient_status_transition enable row level security;
alter table public.patient_contact enable row level security;

create policy patient_status_transition_select_members on public.patient_status_transition
  for select to authenticated
  using (private.is_member(institution_id));

create policy patient_contact_select_by_role on public.patient_contact
  for select to authenticated
  using (private.can_read_patients(institution_id));

create policy patient_contact_insert_by_role on public.patient_contact
  for insert to authenticated
  with check (private.has_role(institution_id, array['director', 'administration', 'reception']));

create policy patient_contact_update_by_role on public.patient_contact
  for update to authenticated
  using (private.has_role(institution_id, array['director', 'administration', 'reception']))
  with check (private.has_role(institution_id, array['director', 'administration', 'reception']));
