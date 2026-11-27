-- Tests de obras sociales y cobertura del paciente (flujo 01, regla 2).
-- Se corren con: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(24);

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

create function pg_temp.payer(p_name text) returns uuid language sql as $$
  select id from public.payer where institution_id = '11111111-1111-1111-1111-111111111111' and name = p_name;
$$;

create function pg_temp.today() returns date language sql as $$
  select (now() at time zone 'America/Argentina/Mendoza')::date;
$$;

select is(
  (select name || ' / ' || kind || ' / ' || requires_member_number::text from public.payer where institution_id = '11111111-1111-1111-1111-111111111111'),
  'Particular / private / false',
  'Una institución nueva arranca con "Particular", que no pide número de afiliado'
);

-- ---------------------------------------------------------------------------
-- Catálogo
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ insert into public.payer (institution_id, name, kind, requires_member_number)
     values ('11111111-1111-1111-1111-111111111111', 'OSEP', 'social_security', true),
            ('11111111-1111-1111-1111-111111111111', 'OSDE', 'prepaid', true) $$,
  'Administración carga obras sociales'
);

select throws_ok(
  $$ insert into public.payer (institution_id, name, kind) values ('11111111-1111-1111-1111-111111111111', 'osep', 'social_security') $$,
  '23505', null,
  'No se repite el nombre de una obra social en la institución (sin importar mayúsculas)'
);

select throws_ok(
  $$ insert into public.payer (institution_id, name, kind, requires_member_number) values ('11111111-1111-1111-1111-111111111111', 'Otro particular', 'private', true) $$,
  '23514', null,
  'Un "Particular" no puede pedir número de afiliado'
);

select throws_ok(
  $$ delete from public.payer $$,
  '42501', null,
  'Nadie borra obras sociales: se dan de baja'
);

select pg_temp.login('a0000000-0000-0000-0000-000000000002');

select throws_ok(
  $$ insert into public.payer (institution_id, name, kind) values ('11111111-1111-1111-1111-111111111111', 'PAMI', 'social_security') $$,
  '42501', null,
  'Recepción no mantiene el catálogo de obras sociales'
);

select is(
  (select count(*)::int from public.payer),
  3,
  'Recepción ve el catálogo de su institución'
);

-- ---------------------------------------------------------------------------
-- Alta con cobertura
-- ---------------------------------------------------------------------------
select throws_ok(
  $$ select public.create_patient('11111111-1111-1111-1111-111111111111', 'Sin', 'Cobertura', 'dni', '30111111', '1990-01-01') $$,
  'P0001', 'Elegí la obra social.',
  'El alta pide la obra social'
);

select throws_ok(
  format($$ select public.create_patient('11111111-1111-1111-1111-111111111111', 'Sin', 'Afiliado', 'dni', '30111111', '1990-01-01',
            p_payer_id => %L) $$, pg_temp.payer('OSEP')),
  'P0001', 'Escribí el número de afiliado: OSEP lo pide.',
  'Si la obra social lo pide, el número de afiliado es obligatorio'
);

select is(
  (select count(*)::int from public.patient),
  0,
  'Si la cobertura falla, el paciente tampoco se crea'
);

select isnt(
  public.create_patient('11111111-1111-1111-1111-111111111111', 'Martina', 'Pérez', 'dni', '40111201', '1998-03-14',
                        p_payer_id => pg_temp.payer('OSEP'), p_member_number => '123456/01'),
  null,
  'Alta con obra social y número de afiliado'
);

create temp table pid as select id from public.patient where last_name = 'Pérez';
grant select on pid to authenticated;

select is(
  (select p.name || ' ' || c.member_number || ' desde hoy: ' || (c.valid_from = pg_temp.today())::text
   from public.patient_coverage c join public.payer p on p.id = c.payer_id),
  'OSEP 123456/01 desde hoy: true',
  'La cobertura queda vigente desde el día del alta'
);

select isnt(
  public.create_patient('11111111-1111-1111-1111-111111111111', 'Pago', 'Particular', 'dni', '30222222', '1990-01-01',
                        p_payer_id => pg_temp.payer('Particular'), p_member_number => 'ignorado'),
  null,
  'Alta como Particular, sin número de afiliado'
);

select is(
  (select c.member_number from public.patient_coverage c join public.patient p on p.id = c.patient_id where p.last_name = 'Particular'),
  null,
  'A un Particular no se le guarda número de afiliado'
);

-- ---------------------------------------------------------------------------
-- Cambiar la cobertura
-- ---------------------------------------------------------------------------
select throws_ok(
  format($$ select public.set_patient_coverage('11111111-1111-1111-1111-111111111111', %L, %L, '123456/01', %L) $$,
         (select id from pid), pg_temp.payer('OSEP'), pg_temp.today()),
  'P0001', 'La cobertura ya es esa. No hay nada que cambiar.',
  'No se carga la misma cobertura dos veces'
);

select throws_ok(
  format($$ select public.set_patient_coverage('11111111-1111-1111-1111-111111111111', %L, %L, '999', %L) $$,
         (select id from pid), pg_temp.payer('OSDE'), pg_temp.today() + 1),
  'P0001', 'La cobertura no puede empezar en el futuro.',
  'Una cobertura no empieza en el futuro'
);

select ok(
  public.set_patient_coverage('11111111-1111-1111-1111-111111111111', (select id from pid), pg_temp.payer('OSDE'), '999 888', pg_temp.today()),
  'Recepción cambia la cobertura a OSDE'
);

select results_eq(
  $$ select p.name, c.valid_to is null from public.patient_coverage c join public.payer p on p.id = c.payer_id
     where c.patient_id = (select id from pid) order by c.created_at $$,
  $$ values ('OSEP', false), ('OSDE', true) $$,
  'La anterior queda cerrada en el historial y la nueva es la vigente'
);

select throws_ok(
  $$ update public.patient_coverage set member_number = 'otro' $$,
  '42501', null,
  'Nadie modifica coberturas directo en la tabla'
);

reset role;

select is(
  (select details - 'valid_from' from public.audit_log l join public.audit_action a on a.id = l.action_id
   where a.code = 'patient_coverage_changed' and l.record_id = (select id from pid) and l.details -> 'before' <> 'null'::jsonb),
  '{"before": {"payer": "OSEP", "member_number": "123456/01"}, "after": {"payer": "OSDE", "member_number": "999 888"}}'::jsonb,
  'La auditoría guarda la cobertura anterior y la nueva'
);

-- ---------------------------------------------------------------------------
-- Aislamiento y roles
-- ---------------------------------------------------------------------------
select pg_temp.login('b0000000-0000-0000-0000-000000000001');

select is(
  (select count(*)::int from public.payer),
  1,
  'Administración de B solo ve su propio catálogo'
);

select is_empty('select 1 from public.patient_coverage', 'Administración de B no ve coberturas de A');

select ok(
  not public.set_patient_coverage('11111111-1111-1111-1111-111111111111', (select id from pid), pg_temp.payer('OSEP'), '1', pg_temp.today()),
  'Administración de B no cambia coberturas de A'
);

select pg_temp.login('a0000000-0000-0000-0000-000000000003');

select ok(
  not public.set_patient_coverage('11111111-1111-1111-1111-111111111111', (select id from pid), pg_temp.payer('OSEP'), '1', pg_temp.today()),
  'Profesional todavía no cambia coberturas'
);

select * from finish();

rollback;
