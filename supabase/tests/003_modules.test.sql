-- Tests de módulos activables (ADR 0003).
-- Se corren con: npx supabase test db

begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select plan(15);

insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'direccion.a@ronda.test', '{"full_name":"Dirección A"}'),
  ('b0000000-0000-0000-0000-000000000001', 'direccion.b@ronda.test', '{"full_name":"Dirección B"}');

insert into public.institution (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Institución A'),
  ('22222222-2222-2222-2222-222222222222', 'Institución B');

insert into public.membership (institution_id, user_id, role_id)
select i, u, (select id from public.role where code = 'director')
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000001'::uuid),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'b0000000-0000-0000-0000-000000000001'::uuid)
) as t(i, u);

create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ---------------------------------------------------------------------------
-- IPL activa y apaga (como administrador de la base)
-- ---------------------------------------------------------------------------
select ok(public.module_enabled('11111111-1111-1111-1111-111111111111', 'core'), 'La Base está siempre activa');
select ok(not public.module_enabled('11111111-1111-1111-1111-111111111111', 'inpatient'), 'Internación arranca apagada');

select lives_ok(
  $$ select private.activate_module('11111111-1111-1111-1111-111111111111', 'inpatient') $$,
  'IPL puede activar Internación'
);
select ok(public.module_enabled('11111111-1111-1111-1111-111111111111', 'inpatient'), 'Internación quedó activa en A');
select ok(not public.module_enabled('22222222-2222-2222-2222-222222222222', 'inpatient'), 'Activar en A no la activa en B');

select throws_ok(
  $$ select private.activate_module('11111111-1111-1111-1111-111111111111', 'e_invoice') $$,
  '23514', 'No se puede activar Factura electrónica ARCA: le falta un módulo que necesita',
  'No se activa un módulo sin los que requiere'
);

select lives_ok(
  $$ select private.activate_module('11111111-1111-1111-1111-111111111111', 'private_billing');
     select private.activate_module('11111111-1111-1111-1111-111111111111', 'e_invoice') $$,
  'Con una de las alternativas (Cobros particulares) alcanza para Factura electrónica'
);

select throws_ok(
  $$ select private.deactivate_module('11111111-1111-1111-1111-111111111111', 'private_billing') $$,
  '23514', 'No se puede apagar Cobros particulares: antes hay que apagar Factura electrónica ARCA',
  'No se apaga un módulo del que depende otro activo'
);

select lives_ok(
  $$ select private.activate_module('11111111-1111-1111-1111-111111111111', 'coverage');
     select private.deactivate_module('11111111-1111-1111-1111-111111111111', 'private_billing') $$,
  'Si queda otra alternativa activa (Obras sociales), sí se puede apagar'
);

select lives_ok(
  $$ select private.deactivate_module('11111111-1111-1111-1111-111111111111', 'inpatient') $$,
  'IPL puede apagar Internación'
);

select is(
  (select count(*)::int from public.institution_module im join public.module m on m.id = im.module_id
   where m.code = 'inpatient' and im.deactivated_at is not null),
  1,
  'Apagar no borra: queda el historial con la vigencia cerrada'
);

select is(
  (select count(*)::int from public.audit_log l join public.audit_action a on a.id = l.action_id
   where l.institution_id = '11111111-1111-1111-1111-111111111111' and a.code in ('module_activated', 'module_deactivated')),
  6,  -- 4 activaciones (Internación, Cobros, Factura, Obras sociales) y 2 apagados
  'Cada activación y cada apagado quedan en la auditoría'
);

-- ---------------------------------------------------------------------------
-- La aplicación solo lee
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000001');

select throws_ok(
  $$ select private.activate_module('11111111-1111-1111-1111-111111111111', 'inpatient') $$,
  '42501', null,
  'Dirección no puede activar módulos: los cambia solo IPL'
);

select throws_ok(
  $$ insert into public.institution_module (institution_id, module_id)
     values ('11111111-1111-1111-1111-111111111111', (select id from public.module where code = 'inpatient')) $$,
  '42501', null,
  'Nadie puede escribir los módulos de una institución desde la aplicación'
);

select pg_temp.login('b0000000-0000-0000-0000-000000000001');

select is_empty(
  $$ select 1 from public.institution_module where institution_id = '11111111-1111-1111-1111-111111111111' $$,
  'Dirección de B no ve los módulos de A'
);

select * from finish();

rollback;
