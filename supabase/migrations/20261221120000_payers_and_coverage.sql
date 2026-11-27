-- Semana 8 — Obras sociales y cobertura del paciente.
-- Flujos: 01 (alta con obra social y número de afiliado), 17 y 18 (se apoyan en esto).
-- Decisiones del 30/11/2026:
--   · El catálogo de obras sociales es propio de cada institución (con código nacional opcional).
--   · Un paciente tiene una sola cobertura vigente, con historial.

-- ---------------------------------------------------------------------------
-- payer — obras sociales, prepagas y "Particular" de cada institución
-- ---------------------------------------------------------------------------
create table public.payer (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institution (id),
  name text not null check (length(trim(name)) > 0),
  kind text not null check (kind in ('social_security', 'prepaid', 'private')),
  requires_member_number boolean not null default true,
  -- Código nacional (RNOS de la Superintendencia), para integraciones e importaciones futuras.
  national_code text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users (id),
  updated_at timestamptz,
  updated_by uuid references auth.users (id),
  deleted_at timestamptz,
  deleted_by uuid references auth.users (id),
  unique (institution_id, id),
  -- Particular no tiene número de afiliado (flujo 01).
  check (kind <> 'private' or not requires_member_number)
);

comment on table public.payer is 'Obras sociales, prepagas y Particular con las que trabaja cada institución. Se dan de baja, no se borran.';

create unique index payer_name_unique_per_institution
  on public.payer (institution_id, lower(name))
  where deleted_at is null;

create trigger set_audit_columns
  before insert or update on public.payer
  for each row execute function private.set_audit_columns();

create trigger prevent_institution_change
  before update on public.payer
  for each row execute function private.prevent_institution_change();

create trigger reject_delete
  before delete on public.payer
  for each row execute function private.reject_delete();

-- Cada institución arranca con "Particular".
create function private.create_default_payers()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.payer (institution_id, name, kind, requires_member_number)
  values (new.id, 'Particular', 'private', false);
  return new;
end;
$$;

create trigger create_default_payers
  after insert on public.institution
  for each row execute function private.create_default_payers();

insert into public.payer (institution_id, name, kind, requires_member_number)
select id, 'Particular', 'private', false from public.institution
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- patient_coverage — cobertura del paciente, con vigencia
-- valid_from es el primer día; valid_to es el día en que empezó la siguiente (sin incluir).
-- Si se corrige el mismo día, la anterior queda con valid_from = valid_to (no rigió ningún día).
-- ---------------------------------------------------------------------------
create table public.patient_coverage (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null,
  patient_id uuid not null,
  payer_id uuid not null,
  member_number text,
  valid_from date not null,
  valid_to date,
  created_at timestamptz not null default clock_timestamp(),
  created_by uuid references auth.users (id),
  unique (institution_id, id),
  check (valid_to is null or valid_to >= valid_from),
  foreign key (institution_id, patient_id) references public.patient (institution_id, id),
  foreign key (institution_id, payer_id) references public.payer (institution_id, id)
);

comment on table public.patient_coverage is 'Coberturas del paciente en el tiempo. Una sola vigente (valid_to vacío). Cambiar de obra social cierra la anterior.';

create unique index patient_coverage_one_current
  on public.patient_coverage (institution_id, patient_id)
  where valid_to is null;

create index patient_coverage_patient_idx on public.patient_coverage (institution_id, patient_id, valid_from);

-- Una vez cerrada, una cobertura no cambia; de la vigente solo se puede cerrar la vigencia.
create function private.guard_patient_coverage()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Una cobertura no se borra' using errcode = 'insufficient_privilege';
  end if;
  if old.valid_to is not null
     or (new.institution_id, new.patient_id, new.payer_id, new.member_number, new.valid_from, new.created_at, new.created_by)
        is distinct from (old.institution_id, old.patient_id, old.payer_id, old.member_number, old.valid_from, old.created_at, old.created_by) then
    raise exception 'Una cobertura no se modifica: se carga una nueva' using errcode = 'insufficient_privilege';
  end if;
  return new;
end;
$$;

create trigger guard_patient_coverage
  before update or delete on public.patient_coverage
  for each row execute function private.guard_patient_coverage();

-- ---------------------------------------------------------------------------
-- Cargar o cambiar la cobertura (flujo 01: queda en la auditoría)
-- ---------------------------------------------------------------------------
insert into public.audit_action (code, name) values
  ('patient_coverage_changed', 'Cambió la cobertura de un paciente');

-- Valida y guarda una cobertura nueva, cerrando la vigente. La usan el alta y el cambio.
-- No verifica permisos: eso lo hacen las funciones públicas que la llaman.
create function private.apply_patient_coverage(
  p_institution_id uuid,
  p_patient_id uuid,
  p_payer_id uuid,
  p_member_number text,
  p_valid_from date
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  v_payer public.payer%rowtype;
  v_current public.patient_coverage%rowtype;
  v_current_payer_name text;
  v_member text := nullif(trim(coalesce(p_member_number, '')), '');
  v_today date := (now() at time zone 'America/Argentina/Mendoza')::date;
begin
  if p_payer_id is null then
    raise exception 'Elegí la obra social.';
  end if;
  select * into v_payer from public.payer
  where institution_id = p_institution_id and id = p_payer_id and deleted_at is null;
  if v_payer.id is null then
    raise exception 'Esa obra social no está en la lista de la institución.';
  end if;
  if v_payer.requires_member_number and v_member is null then
    raise exception 'Escribí el número de afiliado: % lo pide.', v_payer.name;
  end if;
  if not v_payer.requires_member_number then
    v_member := null;
  end if;
  if p_valid_from is null then
    raise exception 'Escribí desde cuándo rige la cobertura.';
  end if;
  if p_valid_from > v_today then
    raise exception 'La cobertura no puede empezar en el futuro.';
  end if;

  select * into v_current from public.patient_coverage
  where institution_id = p_institution_id and patient_id = p_patient_id and valid_to is null
  for update;

  if v_current.id is not null then
    if v_current.payer_id = p_payer_id and v_current.member_number is not distinct from v_member then
      raise exception 'La cobertura ya es esa. No hay nada que cambiar.';
    end if;
    if p_valid_from < v_current.valid_from then
      raise exception 'La cobertura nueva no puede empezar antes que la actual (%).', to_char(v_current.valid_from, 'DD/MM/YYYY');
    end if;
    update public.patient_coverage set valid_to = p_valid_from where id = v_current.id;
    select name into v_current_payer_name from public.payer where id = v_current.payer_id;
  end if;

  insert into public.patient_coverage (institution_id, patient_id, payer_id, member_number, valid_from, created_by)
  values (p_institution_id, p_patient_id, p_payer_id, v_member, p_valid_from, auth.uid());

  perform private.write_audit(p_institution_id, 'patient_coverage_changed', 'patient', p_patient_id,
    jsonb_build_object(
      'before', case when v_current.id is null then null
                     else jsonb_build_object('payer', v_current_payer_name, 'member_number', v_current.member_number) end,
      'after', jsonb_build_object('payer', v_payer.name, 'member_number', v_member),
      'valid_from', p_valid_from));
end;
$$;

revoke all on function private.apply_patient_coverage(uuid, uuid, uuid, text, date) from public;

create function public.set_patient_coverage(
  p_institution_id uuid,
  p_patient_id uuid,
  p_payer_id uuid,
  p_member_number text,
  p_valid_from date
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null or not private.has_role(p_institution_id, array['director', 'administration', 'reception']) then
    if auth.uid() is not null and exists (select 1 from public.institution where id = p_institution_id) then
      perform private.write_audit(p_institution_id, 'access_denied', 'patient', null,
        jsonb_build_object('reason', 'Intentó cambiar la cobertura de un paciente sin permiso'));
    end if;
    return false;
  end if;

  if not exists (select 1 from public.patient where institution_id = p_institution_id and id = p_patient_id and deleted_at is null) then
    raise exception 'No encontramos ese paciente.';
  end if;

  perform private.apply_patient_coverage(p_institution_id, p_patient_id, p_payer_id, p_member_number, p_valid_from);
  return true;
end;
$$;

revoke all on function public.set_patient_coverage(uuid, uuid, uuid, text, date) from public, anon;
grant execute on function public.set_patient_coverage(uuid, uuid, uuid, text, date) to authenticated;

-- ---------------------------------------------------------------------------
-- El alta ahora pide la cobertura (decidido en la semana 6). Se agregan dos parámetros
-- al final; si falta la obra social, la base lo rechaza.
-- ---------------------------------------------------------------------------
drop function public.create_patient(uuid, text, text, text, text, date, text, text, text, text);

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
  p_email text default null,
  p_payer_id uuid default null,
  p_member_number text default null
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

  -- La cobertura rige desde el día del alta.
  perform private.apply_patient_coverage(p_institution_id, v_patient_id, p_payer_id, p_member_number,
                                         (now() at time zone 'America/Argentina/Mendoza')::date);
  return v_patient_id;
exception
  when unique_violation then
    raise exception 'Ya hay un paciente con ese documento en la institución.';
end;
$$;

revoke all on function public.create_patient(uuid, text, text, text, text, date, text, text, text, text, uuid, text) from public, anon;
grant execute on function public.create_patient(uuid, text, text, text, text, date, text, text, text, text, uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Permisos y RLS
-- ---------------------------------------------------------------------------
revoke all on public.payer, public.patient_coverage from anon, authenticated;
grant select on public.payer, public.patient_coverage to authenticated;
grant insert (institution_id, name, kind, requires_member_number, national_code) on public.payer to authenticated;
grant update (name, kind, requires_member_number, national_code, deleted_at) on public.payer to authenticated;

alter table public.payer enable row level security;
alter table public.patient_coverage enable row level security;

-- Todos los miembros ven el catálogo (lo necesitan para cargar y leer coberturas).
create policy payer_select_members on public.payer
  for select to authenticated
  using (private.is_member(institution_id));

-- Lo mantienen Dirección y Administración.
create policy payer_insert_by_role on public.payer
  for insert to authenticated
  with check (private.has_role(institution_id, array['director', 'administration']));

create policy payer_update_by_role on public.payer
  for update to authenticated
  using (private.has_role(institution_id, array['director', 'administration']))
  with check (private.has_role(institution_id, array['director', 'administration']));

create policy patient_coverage_select_by_role on public.patient_coverage
  for select to authenticated
  using (private.can_read_patients(institution_id));
