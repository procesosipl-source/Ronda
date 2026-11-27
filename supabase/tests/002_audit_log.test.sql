-- Tests de la auditoría (regla 7 de CLAUDE.md, flujo 22).
-- Se corren con: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(17);

-- ---------------------------------------------------------------------------
-- Datos de prueba (ficticios)
-- ---------------------------------------------------------------------------
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'direccion.a@ronda.test', '{"full_name":"Dirección A"}'),
  ('a0000000-0000-0000-0000-000000000002', 'recepcion.a@ronda.test', '{"full_name":"Recepción A"}'),
  ('b0000000-0000-0000-0000-000000000001', 'direccion.b@ronda.test', '{"full_name":"Dirección B"}');

insert into public.institution (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Institución A'),
  ('22222222-2222-2222-2222-222222222222', 'Institución B');

insert into public.membership (institution_id, user_id, role_id)
select i, u, (select id from public.role where code = r)
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'director'),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid, 'professional'),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'reception'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, 'director')
) as t(i, u, r);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ---------------------------------------------------------------------------
-- Entrar a una institución
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000002');

select ok(
  public.enter_institution('11111111-1111-1111-1111-111111111111'),
  'Recepción de A puede entrar a A'
);

select ok(
  not public.enter_institution('22222222-2222-2222-2222-222222222222'),
  'Recepción de A no puede entrar a B'
);

select is_empty(
  'select 1 from public.audit_log',
  'Recepción no puede leer la auditoría'
);

select throws_ok(
  $$ insert into public.audit_log (institution_id, action_id)
     values ('11111111-1111-1111-1111-111111111111', (select id from public.audit_action where code = 'enter_institution')) $$,
  '42501', null,
  'Nadie puede escribir la auditoría directo desde la aplicación'
);

select throws_ok(
  $$ select private.write_audit('11111111-1111-1111-1111-111111111111', 'enter_institution') $$,
  '42501', null,
  'La aplicación no puede llamar a la función interna que escribe la auditoría'
);

select pg_temp.login('a0000000-0000-0000-0000-000000000001');
select public.enter_institution('11111111-1111-1111-1111-111111111111');
select public.leave_institution('11111111-1111-1111-1111-111111111111');

-- ---------------------------------------------------------------------------
-- Dirección de A lee la auditoría de A
-- ---------------------------------------------------------------------------
select results_eq(
  $$ select a.code from public.audit_log l join public.audit_action a on a.id = l.action_id
     where l.user_id = 'a0000000-0000-0000-0000-000000000002' order by l.occurred_at, a.code $$,
  array['enter_institution'],
  'Dirección de A ve el ingreso de Recepción a A'
);

select is(
  (select user_name || ' / ' || array_to_string(role_codes, ',') from public.audit_log l
   join public.audit_action a on a.id = l.action_id
   where a.code = 'enter_institution' and l.user_id = 'a0000000-0000-0000-0000-000000000001'),
  'Dirección A / director,professional',
  'La auditoría guarda el nombre y todos los roles que tenía la persona'
);

select isnt_empty(
  $$ select 1 from public.audit_log l join public.audit_action a on a.id = l.action_id
     where a.code = 'leave_institution' $$,
  'La salida queda registrada'
);

select is_empty(
  $$ select 1 from public.audit_log l join public.audit_action a on a.id = l.action_id
     where a.code = 'access_denied' $$,
  'Dirección de A no ve el intento denegado en B: es de la auditoría de B'
);

select is(
  (select count(*)::int from public.audit_log where institution_id = '22222222-2222-2222-2222-222222222222'),
  0,
  'Dirección de A no ve nada de la auditoría de B'
);

-- Las modificaciones las rechaza el permiso de tabla antes que el trigger.
select throws_ok(
  $$ update public.audit_log set user_name = 'Otro' $$,
  '42501', null,
  'Dirección no puede modificar la auditoría'
);

select throws_ok(
  $$ delete from public.audit_log $$,
  '42501', null,
  'Dirección no puede borrar la auditoría'
);

-- ---------------------------------------------------------------------------
-- Dirección de B ve el intento denegado
-- ---------------------------------------------------------------------------
select pg_temp.login('b0000000-0000-0000-0000-000000000001');

select is(
  (select l.user_name from public.audit_log l join public.audit_action a on a.id = l.action_id
   where a.code = 'access_denied'),
  'Recepción A',
  'Dirección de B ve quién intentó entrar a B sin permiso'
);

-- ---------------------------------------------------------------------------
-- Ni siquiera un administrador de la base puede modificarla o borrarla
-- ---------------------------------------------------------------------------
reset role;

select throws_ok(
  $$ update public.audit_log set user_name = 'Otro' $$,
  '42501', 'La auditoría no se modifica ni se borra',
  'Un administrador de la base no puede modificar la auditoría'
);

select throws_ok(
  $$ delete from public.audit_log $$,
  '42501', 'La auditoría no se modifica ni se borra',
  'Un administrador de la base no puede borrar la auditoría'
);

select throws_ok(
  $$ truncate public.audit_log $$,
  '42501', 'La auditoría no se modifica ni se borra',
  'Un administrador de la base no puede vaciar la auditoría'
);

-- Sin sesión: no se entra a ninguna institución.
select set_config('request.jwt.claims', '', true);
set local role anon;

select throws_ok(
  $$ select public.enter_institution('11111111-1111-1111-1111-111111111111') $$,
  '42501', null,
  'Sin sesión no se puede llamar a la función de ingreso'
);

reset role;

select * from finish();

rollback;
