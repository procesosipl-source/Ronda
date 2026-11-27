-- Tests de la ficha del paciente: estados, edición y referentes (flujos 01 y 02).
-- Se corren con: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(30);

insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'admin.a@ronda.test',     '{"full_name":"Administración A"}'),
  ('a0000000-0000-0000-0000-000000000002', 'recepcion.a@ronda.test', '{"full_name":"Recepción A"}'),
  ('a0000000-0000-0000-0000-000000000003', 'prof.a@ronda.test',      '{"full_name":"Profesional A"}'),
  ('b0000000-0000-0000-0000-000000000001', 'admin.b@ronda.test',     '{"full_name":"Administración B"}');

insert into public.institution (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Institución A'),
  ('22222222-2222-2222-2222-222222222222', 'Institución B');

insert into public.membership (institution_id, user_id, role_id)
select i, u, (select id from public.role where code = r)
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'administration'),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'reception'),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000003'::uuid, 'professional'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, 'administration')
) as t(i, u, r);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

create function pg_temp.status(p_code text) returns uuid language sql as $$
  select id from public.patient_status where institution_id = '11111111-1111-1111-1111-111111111111' and code = p_code;
$$;

create function pg_temp.patient_status_code() returns text language sql as $$
  select s.code from public.patient p join public.patient_status s on s.id = p.status_id where p.last_name = 'Pérez';
$$;

select is(
  (select count(*)::int from public.patient_status_transition where institution_id = '11111111-1111-1111-1111-111111111111'),
  8,
  'Una institución nueva arranca con las ocho transiciones del flujo 02'
);

select pg_temp.login('a0000000-0000-0000-0000-000000000002');
select public.create_patient('11111111-1111-1111-1111-111111111111', 'Martina', 'Pérez', 'dni', '40111201', '1998-03-14');
create temp table pid as select id from public.patient where last_name = 'Pérez';
grant select on pid to authenticated;

-- ---------------------------------------------------------------------------
-- Cambiar de estado
-- ---------------------------------------------------------------------------
select ok(
  not public.change_patient_status('11111111-1111-1111-1111-111111111111', (select id from pid), pg_temp.status('admission'), 'Entrevista hecha'),
  'Recepción no puede cambiar el estado'
);

select pg_temp.login('a0000000-0000-0000-0000-000000000001');

select throws_ok(
  format($$ select public.change_patient_status('11111111-1111-1111-1111-111111111111', %L, %L, 'Salto') $$,
         (select id from pid), pg_temp.status('in_treatment')),
  'P0001', 'No se puede pasar de Preadmisión a En tratamiento.',
  'No se puede saltear Admisión'
);

select throws_ok(
  format($$ select public.change_patient_status('11111111-1111-1111-1111-111111111111', %L, %L, '  ') $$,
         (select id from pid), pg_temp.status('admission')),
  'P0001', 'Escribí el motivo del cambio.',
  'El cambio de estado pide motivo'
);

select ok(
  public.change_patient_status('11111111-1111-1111-1111-111111111111', (select id from pid), pg_temp.status('admission'), 'Entrevista de admisión hecha'),
  'Administración pasa al paciente a Admisión'
);

select ok(
  public.change_patient_status('11111111-1111-1111-1111-111111111111', (select id from pid), pg_temp.status('in_treatment'), 'Primer turno dado'),
  'Y de Admisión a En tratamiento'
);

select is(pg_temp.patient_status_code(), 'in_treatment', 'El paciente queda En tratamiento');

select throws_ok(
  format($$ select public.change_patient_status('11111111-1111-1111-1111-111111111111', %L, %L, 'De nuevo') $$,
         (select id from pid), pg_temp.status('in_treatment')),
  'P0001', 'El paciente ya está en En tratamiento.',
  'No se cambia al mismo estado'
);

select ok(
  public.change_patient_status('11111111-1111-1111-1111-111111111111', (select id from pid), pg_temp.status('discharged'), 'Alta clínica'),
  'De En tratamiento a Alta'
);

select ok(
  public.change_patient_status('11111111-1111-1111-1111-111111111111', (select id from pid), pg_temp.status('in_treatment'), 'Reingreso'),
  'Desde Alta se puede reingresar a En tratamiento'
);

select results_eq(
  $$ select f.name, t.name, h.reason from public.patient_status_history h
     left join public.patient_status f on f.id = h.from_status_id
     join public.patient_status t on t.id = h.to_status_id
     order by h.changed_at, h.id $$,
  $$ values (null::text, 'Preadmisión', 'Alta del paciente'),
            ('Preadmisión', 'Admisión', 'Entrevista de admisión hecha'),
            ('Admisión', 'En tratamiento', 'Primer turno dado'),
            ('En tratamiento', 'Alta', 'Alta clínica'),
            ('Alta', 'En tratamiento', 'Reingreso') $$,
  'El historial guarda cada cambio, en orden, con su motivo'
);

select throws_ok(
  $$ update public.patient_status_history set reason = 'Otro' $$,
  '42501', null,
  'Nadie modifica el historial de estados'
);

select throws_ok(
  format($$ update public.patient set status_id = %L $$, pg_temp.status('dropped')),
  '42501', null,
  'El estado no se cambia directo en la tabla: solo con la función'
);

-- ---------------------------------------------------------------------------
-- Editar datos personales
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000002');

select ok(
  public.update_patient('11111111-1111-1111-1111-111111111111', (select id from pid),
    'Martina', 'Pérez', 'Tina', 'dni', '40.111.201', '1998-03-14', 'F', '261 555-0101', null, 'Calle Inventada 123'),
  'Recepción puede editar los datos personales'
);

reset role;  -- la auditoría solo la lee Dirección; acá se mira como administrador de la base
select is(
  (select l.details from public.audit_log l join public.audit_action a on a.id = l.action_id where a.code = 'patient_updated'),
  '{"changes": {"phone": {"after": "261 555-0101", "before": null},
                "address": {"after": "Calle Inventada 123", "before": null},
                "chosen_name": {"after": "Tina", "before": null},
                "registered_sex": {"after": "F", "before": null},
                "document_number": {"after": "40.111.201", "before": "40111201"}}}'::jsonb,
  'La auditoría guarda solo los campos que cambiaron, con el valor anterior y el nuevo'
);
select pg_temp.login('a0000000-0000-0000-0000-000000000002');

select ok(
  public.update_patient('11111111-1111-1111-1111-111111111111', (select id from pid),
    'Martina', 'Pérez', 'Tina', 'dni', '40.111.201', '1998-03-14', 'F', '261 555-0101', null, 'Calle Inventada 123'),
  'Guardar sin cambios no falla'
);

reset role;
select is(
  (select count(*)::int from public.audit_log l join public.audit_action a on a.id = l.action_id where a.code = 'patient_updated'),
  1,
  'Guardar sin cambios no agrega nada a la auditoría'
);
select pg_temp.login('a0000000-0000-0000-0000-000000000002');

select public.create_patient('11111111-1111-1111-1111-111111111111', 'Otra', 'Persona', 'dni', '30123456', '1980-01-01');

select throws_ok(
  format($$ select public.update_patient('11111111-1111-1111-1111-111111111111', %L,
    'Martina', 'Pérez', null, 'dni', '30.123.456', '1998-03-14', null, null, null, null) $$, (select id from pid)),
  'P0001', 'Ya hay otro paciente con ese documento en la institución.',
  'Corregir el documento no puede chocar con otro paciente'
);

-- ---------------------------------------------------------------------------
-- Referentes
-- ---------------------------------------------------------------------------
select lives_ok(
  format($$ insert into public.patient_contact (institution_id, patient_id, full_name, relationship, phone, is_primary)
            values ('11111111-1111-1111-1111-111111111111', %L, 'Ana Pérez', 'mother', '261 555-0199', true) $$, (select id from pid)),
  'Recepción puede cargar un referente'
);

select lives_ok(
  format($$ insert into public.patient_contact (institution_id, patient_id, full_name, relationship, phone, is_primary)
            values ('11111111-1111-1111-1111-111111111111', %L, 'Luis Pérez', 'father', '261 555-0198', true) $$, (select id from pid)),
  'Se puede marcar otro referente como principal'
);

select results_eq(
  $$ select full_name from public.patient_contact where is_primary $$,
  array['Luis Pérez'],
  'Al marcar uno nuevo como principal, el anterior deja de serlo'
);

select throws_ok(
  format($$ insert into public.patient_contact (institution_id, patient_id, full_name, relationship, phone)
            values ('11111111-1111-1111-1111-111111111111', %L, 'X', 'vecino', '1') $$, (select id from pid)),
  '23514', null,
  'El parentesco sale de una lista cerrada'
);

select lives_ok(
  $$ update public.patient_contact set deleted_at = now() where full_name = 'Luis Pérez' $$,
  'Un referente se da de baja con una marca'
);

select is(
  (select is_primary from public.patient_contact where full_name = 'Luis Pérez'),
  false,
  'Al darlo de baja deja de ser el principal'
);

select throws_ok(
  $$ delete from public.patient_contact $$,
  '42501', null,
  'Nadie borra referentes'
);

-- ---------------------------------------------------------------------------
-- Aislamiento y roles
-- ---------------------------------------------------------------------------
select pg_temp.login('b0000000-0000-0000-0000-000000000001');

select is_empty('select 1 from public.patient_contact', 'Administración de B no ve los referentes de A');

select throws_ok(
  format($$ insert into public.patient_contact (institution_id, patient_id, full_name, relationship, phone)
            values ('11111111-1111-1111-1111-111111111111', %L, 'Intruso', 'other', '1') $$, (select id from pid)),
  '42501', null,
  'Administración de B no puede cargar referentes en A'
);

select ok(
  not public.change_patient_status('11111111-1111-1111-1111-111111111111', (select id from pid), pg_temp.status('dropped'), 'Intento'),
  'Administración de B no puede cambiar el estado de un paciente de A'
);

select ok(
  not public.update_patient('11111111-1111-1111-1111-111111111111', (select id from pid),
    'Hackeado', 'Pérez', null, 'dni', '40111201', '1998-03-14', null, null, null, null),
  'Administración de B no puede editar un paciente de A'
);

select pg_temp.login('a0000000-0000-0000-0000-000000000003');

select throws_ok(
  format($$ insert into public.patient_contact (institution_id, patient_id, full_name, relationship, phone)
            values ('11111111-1111-1111-1111-111111111111', %L, 'X', 'other', '1') $$, (select id from pid)),
  '42501', null,
  'Profesional todavía no carga referentes (llega con el equipo tratante)'
);

select * from finish();

rollback;
