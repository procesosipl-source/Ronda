-- Tests de invitar, cambiar roles y dar de baja (flujo 21).
-- Se corren con: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(22);

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
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000002'::uuid, 'reception'),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid, 'director')
) as t(i, u, r);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

create function pg_temp.audit_count(p_code text) returns int language sql as $$
  select count(*)::int from public.audit_log l join public.audit_action a on a.id = l.action_id where a.code = p_code;
$$;

-- ---------------------------------------------------------------------------
-- Recepción no puede administrar usuarios
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000002');

select is(
  public.invite_member('11111111-1111-1111-1111-111111111111', 'nueva@ronda.test', 'Persona Nueva', array['reception']),
  'denied',
  'Recepción no puede invitar'
);

select ok(
  not public.set_member_roles('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', array['director'], 'Me lo doy yo'),
  'Recepción no puede darse a sí misma el rol de Dirección'
);

select ok(
  not public.deactivate_member('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'Porque sí'),
  'Recepción no puede dar de baja a nadie'
);

select is_empty(
  $$ select * from public.list_members('11111111-1111-1111-1111-111111111111') $$,
  'Recepción no ve la lista de usuarios'
);

-- ---------------------------------------------------------------------------
-- Dirección de B no puede tocar A
-- ---------------------------------------------------------------------------
select pg_temp.login('b0000000-0000-0000-0000-000000000001');

select is(
  public.invite_member('11111111-1111-1111-1111-111111111111', 'intrusa@ronda.test', 'Intrusa', array['director']),
  'denied',
  'Dirección de B no puede invitar a A'
);

select ok(
  not public.deactivate_member('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 'Intento'),
  'Dirección de B no puede dar de baja a alguien de A'
);

-- ---------------------------------------------------------------------------
-- Dirección de A administra su institución
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000001');

select is(
  public.invite_member('11111111-1111-1111-1111-111111111111', 'nueva@ronda.test', 'Persona Nueva', array['reception']),
  'needs_invite',
  'Si la persona no tiene usuario, la función pide mandar la invitación'
);

select is(
  (select count(*)::int from public.membership where institution_id = '11111111-1111-1111-1111-111111111111'),
  2,
  'Antes de mandar la invitación no se crea ninguna membresía'
);

select is(
  public.invite_member('11111111-1111-1111-1111-111111111111', ' Direccion.B@Ronda.test ', 'Dirección B', array['professional', 'coordinator']),
  'added',
  'Si la persona ya usa Ronda en otra institución, se le suman los roles sin otro mail'
);

select is(
  (select array_agg(r.code order by r.sort_order) from public.membership m join public.role r on r.id = m.role_id
   where m.institution_id = '11111111-1111-1111-1111-111111111111' and m.user_id = 'b0000000-0000-0000-0000-000000000001'
     and m.deleted_at is null),
  array['coordinator', 'professional'],
  'La persona invitada queda con los dos roles'
);

select throws_ok(
  $$ select public.invite_member('11111111-1111-1111-1111-111111111111', 'direccion.b@ronda.test', 'Dirección B', array['nursing']) $$,
  'P0001', 'Esa persona ya es parte de la institución. Para cambiar sus roles, usá "Cambiar roles".',
  'No se invita dos veces a la misma persona'
);

select throws_ok(
  $$ select public.invite_member('11111111-1111-1111-1111-111111111111', 'sin-arroba', 'X', array['nursing']) $$,
  'P0001', 'Revisá el correo: no parece válido.',
  'Un correo mal escrito se rechaza'
);

select throws_ok(
  $$ select public.set_member_roles('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', array['nursing'], '  ') $$,
  'P0001', 'Escribí el motivo del cambio.',
  'Cambiar roles pide un motivo'
);

select ok(
  public.set_member_roles('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', array['reception', 'administration'], 'Suma tareas administrativas'),
  'Dirección puede cambiar los roles'
);

select is(
  (select details from public.audit_log l join public.audit_action a on a.id = l.action_id where a.code = 'member_roles_changed'),
  '{"before": ["reception"], "after": ["administration", "reception"], "reason": "Suma tareas administrativas"}'::jsonb,
  'La auditoría guarda el rol anterior, el nuevo y el motivo'
);

select throws_ok(
  $$ select public.set_member_roles('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', array['professional'], 'Dejo la dirección') $$,
  'P0001', 'La institución tiene que tener al menos una persona con rol de Dirección.',
  'La única Dirección no puede sacarse su propio rol'
);

select throws_ok(
  $$ select public.deactivate_member('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000001', 'Me voy') $$,
  'P0001', 'La institución tiene que tener al menos una persona con rol de Dirección.',
  'La única Dirección no puede darse de baja'
);

select ok(
  public.deactivate_member('11111111-1111-1111-1111-111111111111', 'a0000000-0000-0000-0000-000000000002', 'Dejó de trabajar en la institución'),
  'Dirección puede dar de baja a una persona'
);

select is(
  (select count(*)::int from public.membership
   where user_id = 'a0000000-0000-0000-0000-000000000002' and deleted_at is not null and deleted_by is not null),
  2,  -- Recepción y Administración
  'La baja no borra: las membresías siguen ahí, dadas de baja'
);

select results_eq(
  $$ select full_name, role_codes, invitation_pending from public.list_members('11111111-1111-1111-1111-111111111111') $$,
  $$ values ('Dirección A', array['director'], true), ('Dirección B', array['coordinator', 'professional'], true) $$,
  'Dirección ve la lista de personas activas con sus roles'
);

-- ---------------------------------------------------------------------------
-- Todo quedó en la auditoría
-- ---------------------------------------------------------------------------
reset role;

select is(
  pg_temp.audit_count('access_denied'),
  5,
  'Los cinco intentos sin permiso quedaron registrados como accesos denegados'
);

select is(
  pg_temp.audit_count('member_invited') + pg_temp.audit_count('member_roles_changed') + pg_temp.audit_count('member_deactivated'),
  3,
  'La invitación, el cambio de roles y la baja quedaron registrados'
);

select * from finish();

rollback;
