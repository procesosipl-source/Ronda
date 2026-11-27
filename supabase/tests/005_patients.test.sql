-- Tests de pacientes (flujos 01 y 02, regla 2).
-- Se corren con: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(26);

insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'recepcion.a@ronda.test',   '{"full_name":"Recepción A"}'),
  ('a0000000-0000-0000-0000-000000000002', 'profesional.a@ronda.test', '{"full_name":"Profesional A"}'),
  ('a0000000-0000-0000-0000-000000000003', 'coordinacion.a@ronda.test', '{"full_name":"Coordinación A"}'),
  ('b0000000-0000-0000-0000-000000000001', 'recepcion.b@ronda.test',   '{"full_name":"Recepción B"}');

-- El trigger crea los estados por defecto de cada institución.
insert into public.institution (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Institución A'),
  ('22222222-2222-2222-2222-222222222222', 'Institución B');

insert into public.membership (institution_id, user_id, role_id)
select i, u, (select id from public.role where code = r)
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'reception'),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'professional'),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000003'::uuid, 'coordinator'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, 'reception')
) as t(i, u, r);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

select is(
  (select array_agg(name order by sort_order) from public.patient_status where institution_id = '11111111-1111-1111-1111-111111111111'),
  array['Preadmisión', 'Admisión', 'En tratamiento', 'Alta', 'Baja'],
  'Una institución nueva arranca con los cinco estados por defecto'
);

-- ---------------------------------------------------------------------------
-- Recepción de A da de alta pacientes
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000001');

select isnt(
  public.create_patient('11111111-1111-1111-1111-111111111111', 'Martina', 'Pérez', 'dni', '40.111.201', '1998-03-14', 'F', null, '261 555-0101', null),
  null,
  'Recepción puede dar de alta un paciente'
);

select is(
  (select s.name from public.patient p join public.patient_status s on s.id = p.status_id where p.last_name = 'Pérez'),
  'Preadmisión',
  'El paciente nuevo queda en Preadmisión'
);

select is(
  (select h.reason || ' / ' || (h.from_status_id is null)::text || ' / ' || (h.changed_by = 'a0000000-0000-0000-0000-000000000001')::text
   from public.patient_status_history h join public.patient p on p.id = h.patient_id where p.last_name = 'Pérez'),
  'Alta del paciente / true / true',
  'El historial de estados guarda el primer estado, quién lo cargó y el motivo'
);

select is(
  (select created_by from public.patient where last_name = 'Pérez'),
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'La base completa quién dio de alta al paciente'
);

select throws_ok(
  $$ select public.create_patient('11111111-1111-1111-1111-111111111111', 'Otra', 'Persona', 'dni', '40111201', '2000-01-01') $$,
  'P0001', 'Ya hay un paciente con ese documento en la institución.',
  'No se puede cargar dos veces el mismo DNI, aunque se escriba sin puntos'
);

select isnt(
  public.create_patient('11111111-1111-1111-1111-111111111111', 'Otra', 'Persona', 'passport', '40111201', '2000-01-01'),
  null,
  'El mismo número con otro tipo de documento es otro paciente'
);

select throws_ok(
  $$ select public.create_patient('11111111-1111-1111-1111-111111111111', 'X', 'Y', 'dni', '123', '2000-01-01') $$,
  'P0001', 'El DNI tiene que tener 7 u 8 números.',
  'Un DNI con pocos números se rechaza'
);

select throws_ok(
  $$ select public.create_patient('11111111-1111-1111-1111-111111111111', 'X', 'Y', 'dni', '30123456', current_date + 5) $$,
  'P0001', 'La fecha de nacimiento no puede ser futura.',
  'Una fecha de nacimiento futura se rechaza'
);

select throws_ok(
  $$ select public.create_patient('11111111-1111-1111-1111-111111111111', '  ', 'Y', 'dni', '30123456', '2000-01-01') $$,
  'P0001', 'Escribí el nombre.',
  'El nombre es obligatorio'
);

select isnt(
  public.create_patient('11111111-1111-1111-1111-111111111111', 'Valentín', 'Núñez', 'dni', '45333403', '2005-11-23', 'X', 'Vale'),
  null,
  'Se puede cargar el nombre elegido y el sexo registral X'
);

-- Búsqueda
select results_eq(
  $$ select last_name from public.search_patients('11111111-1111-1111-1111-111111111111', 'perez') $$,
  array['Pérez'],
  'Buscar "perez" encuentra a "Pérez" (sin acentos ni mayúsculas)'
);

select results_eq(
  $$ select first_name from public.search_patients('11111111-1111-1111-1111-111111111111', 'vale nunez') $$,
  array['Valentín'],
  'Se busca por nombre elegido y apellido, en cualquier orden'
);

select results_eq(
  $$ select last_name from public.search_patients('11111111-1111-1111-1111-111111111111', '40.111') $$,
  array['Pérez', 'Persona'],
  'Buscar por el principio del documento, con o sin puntos'
);

select is(
  (select count(*)::int from public.search_patients('11111111-1111-1111-1111-111111111111', '')),
  3,
  'Sin texto, la búsqueda lista a todos'
);

-- Escrituras directas: no hay permiso
select throws_ok(
  $$ update public.patient set first_name = 'Cambiado' $$,
  '42501', null,
  'Esta semana nadie edita pacientes directo desde la aplicación'
);

select throws_ok(
  $$ delete from public.patient $$,
  '42501', null,
  'Nadie borra pacientes: se dan de baja'
);

select throws_ok(
  $$ insert into public.patient (institution_id, first_name, last_name, document_type, document_number, birth_date, status_id)
     values ('11111111-1111-1111-1111-111111111111', 'X', 'Y', 'dni', '30123456', '2000-01-01',
             (select id from public.patient_status where code = 'admission' and institution_id = '11111111-1111-1111-1111-111111111111')) $$,
  '42501', null,
  'No se cargan pacientes sin pasar por la función de alta'
);

-- ---------------------------------------------------------------------------
-- Aislamiento entre instituciones
-- ---------------------------------------------------------------------------
select pg_temp.login('b0000000-0000-0000-0000-000000000001');

select is_empty(
  'select 1 from public.patient',
  'Recepción de B no ve los pacientes de A'
);

select is_empty(
  $$ select 1 from public.search_patients('11111111-1111-1111-1111-111111111111', '') $$,
  'Recepción de B no encuentra pacientes de A ni buscando en A'
);

select isnt(
  public.create_patient('22222222-2222-2222-2222-222222222222', 'Martina', 'Pérez', 'dni', '40111201', '1998-03-14'),
  null,
  'El mismo DNI se puede cargar en otra institución: los padrones están aislados'
);

select is(
  public.create_patient('11111111-1111-1111-1111-111111111111', 'Intrusa', 'B', 'dni', '30999999', '2000-01-01'),
  null,
  'Recepción de B no puede dar de alta pacientes en A'
);

-- ---------------------------------------------------------------------------
-- Profesional y Enfermería todavía no ven pacientes; Coordinación ve pero no da de alta
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000002');

select is_empty(
  'select 1 from public.patient',
  'Profesional no ve pacientes hasta que exista el equipo tratante'
);

select is(
  public.create_patient('11111111-1111-1111-1111-111111111111', 'X', 'Y', 'dni', '30888888', '2000-01-01'),
  null,
  'Profesional no da de alta pacientes'
);

select pg_temp.login('a0000000-0000-0000-0000-000000000003');

select is(
  (select count(*)::int from public.patient),
  3,
  'Coordinación ve los pacientes de su institución'
);

reset role;

select is(
  (select count(*)::int from public.audit_log l join public.audit_action a on a.id = l.action_id
   where a.code = 'access_denied' and l.details ->> 'reason' = 'Intentó dar de alta un paciente sin permiso'),
  2,
  'Los intentos de alta sin permiso quedan en la auditoría'
);

select * from finish();

rollback;
