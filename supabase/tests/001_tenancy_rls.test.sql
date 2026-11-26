-- Tests de aislamiento entre instituciones (regla 2 de CLAUDE.md).
-- Se corren con: npx supabase test db
--
-- Cada test arma sus propios datos ficticios dentro de una transacción que se
-- deshace al final, así no dependen del seed ni dejan nada en la base.

begin;

create extension if not exists pgtap with schema extensions;
-- En ronda-dev la conexión de los tests no incluye "extensions" en la búsqueda.
set local search_path = public, extensions;

select plan(30);

-- ---------------------------------------------------------------------------
-- Datos de prueba (ficticios)
-- ---------------------------------------------------------------------------
-- Usuarios: se crean en auth.users; el trigger crea su perfil.
insert into auth.users (id, email, raw_user_meta_data) values
  ('a0000000-0000-0000-0000-000000000001', 'direccion.a@ronda.test',  '{"full_name":"Dirección A"}'),
  ('a0000000-0000-0000-0000-000000000002', 'recepcion.a@ronda.test',  '{"full_name":"Recepción A"}'),
  ('a0000000-0000-0000-0000-000000000003', 'dada.de.baja@ronda.test', '{"full_name":"Baja A"}'),
  ('b0000000-0000-0000-0000-000000000001', 'direccion.b@ronda.test',  '{"full_name":"Dirección B"}'),
  ('c0000000-0000-0000-0000-000000000001', 'en.las.dos@ronda.test',   '{"full_name":"En las dos"}'),
  ('d0000000-0000-0000-0000-000000000001', 'sin.membresia@ronda.test', null);

insert into public.institution (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Institución A'),
  ('22222222-2222-2222-2222-222222222222', 'Institución B');

insert into public.site (id, institution_id, name) values
  ('a1111111-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Sede A1'),
  ('b2222222-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222', 'Sede B1');

insert into public.membership (institution_id, user_id, role_id, deleted_at)
select i, u::uuid, (select id from public.role where code = r), d
from (values
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000001', 'director',     null::timestamptz),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000002', 'reception',    null),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'a0000000-0000-0000-0000-000000000003', 'professional', null),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'b0000000-0000-0000-0000-000000000001', 'director',     null),
  ('11111111-1111-1111-1111-111111111111'::uuid, 'c0000000-0000-0000-0000-000000000001', 'professional', null),
  ('22222222-2222-2222-2222-222222222222'::uuid, 'c0000000-0000-0000-0000-000000000001', 'reception',    null)
) as t(i, u, r, d);

-- La baja de la membresía se hace como update, igual que en la vida real.
update public.membership set deleted_at = now()
where user_id = 'a0000000-0000-0000-0000-000000000003';

-- Cambia el usuario con el que corren las consultas siguientes.
create function pg_temp.login(p_user uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

create function pg_temp.logout() returns void language sql as $$
  reset role;
  select set_config('request.jwt.claims', '', true);
$$;

-- ---------------------------------------------------------------------------
-- Estructura: toda tabla pública tiene RLS y al menos una política
-- ---------------------------------------------------------------------------
select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity $$,
  'Todas las tablas públicas tienen RLS activado'
);

select is_empty(
  $$ select c.relname from pg_class c join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public' and c.relkind = 'r'
       and not exists (select 1 from pg_policies p where p.schemaname = 'public' and p.tablename = c.relname) $$,
  'Todas las tablas públicas tienen al menos una política'
);

select is(
  (select count(*)::int from public.user_profile
   where id in ('a0000000-0000-0000-0000-000000000001', 'd0000000-0000-0000-0000-000000000001')),
  2,
  'Crear un usuario en Auth crea su perfil'
);

select is(
  (select full_name from public.user_profile where id = 'd0000000-0000-0000-0000-000000000001'),
  'sin.membresia@ronda.test',
  'Si la invitación no trae nombre, el perfil usa el correo'
);

-- ---------------------------------------------------------------------------
-- Dirección de A: ve solo lo de A
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000001');

select results_eq(
  'select name from public.institution',
  array['Institución A'],
  'Dirección de A ve solo su institución'
);

select results_eq(
  'select name from public.site',
  array['Sede A1'],
  'Dirección de A ve solo las sedes de A'
);

select is_empty(
  $$ select 1 from public.membership where institution_id = '22222222-2222-2222-2222-222222222222' $$,
  'Dirección de A no ve las membresías de B'
);

select is_empty(
  $$ select 1 from public.user_profile where id = 'b0000000-0000-0000-0000-000000000001' $$,
  'Dirección de A no ve el perfil de alguien que solo está en B'
);

select isnt_empty(
  $$ select 1 from public.user_profile where id = 'c0000000-0000-0000-0000-000000000001' $$,
  'Dirección de A ve el perfil de un compañero de A'
);

select throws_ok(
  $$ insert into public.site (institution_id, name) values ('22222222-2222-2222-2222-222222222222', 'Sede intrusa') $$,
  '42501', null,
  'Dirección de A no puede crear una sede en B'
);

update public.site set name = 'Cambiada' where id = 'b2222222-0000-0000-0000-000000000001';
reset role;
select is(
  (select name from public.site where id = 'b2222222-0000-0000-0000-000000000001'),
  'Sede B1',
  'Dirección de A no puede modificar una sede de B'
);
select pg_temp.login('a0000000-0000-0000-0000-000000000001');

select lives_ok(
  $$ insert into public.site (institution_id, name) values ('11111111-1111-1111-1111-111111111111', 'Sede A2') $$,
  'Dirección de A puede crear una sede en A'
);

select is(
  (select created_by from public.site where name = 'Sede A2'),
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'La base completa quién creó la sede'
);

select throws_ok(
  $$ update public.site set institution_id = '22222222-2222-2222-2222-222222222222' where id = 'a1111111-0000-0000-0000-000000000001' $$,
  '23514', 'Un registro no puede cambiar de institución',
  'Una sede no puede mudarse a otra institución'
);

select lives_ok(
  $$ update public.site set deleted_at = now() where name = 'Sede A2' $$,
  'Dirección de A puede dar de baja una sede de A'
);

select is(
  (select deleted_by from public.site where name = 'Sede A2'),
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'La base completa quién dio de baja la sede'
);

select throws_ok(
  $$ delete from public.site where id = 'a1111111-0000-0000-0000-000000000001' $$,
  '42501', null,
  'Nadie puede borrar una sede: la baja es lógica'
);

select throws_ok(
  $$ insert into public.membership (institution_id, user_id, role_id)
     values ('11111111-1111-1111-1111-111111111111', 'd0000000-0000-0000-0000-000000000001',
             (select id from public.role where code = 'director')) $$,
  '42501', null,
  'Todavía nadie puede crear membresías desde la aplicación'
);

select throws_ok(
  $$ update public.role set name = 'Otro' where code = 'director' $$,
  '42501', null,
  'Nadie puede modificar el catálogo de roles'
);

select throws_ok(
  $$ update public.institution set name = 'Otro nombre' $$,
  '42501', null,
  'Nadie puede modificar una institución desde la aplicación'
);

-- ---------------------------------------------------------------------------
-- Dirección de B: lo mismo al revés
-- ---------------------------------------------------------------------------
select pg_temp.login('b0000000-0000-0000-0000-000000000001');

select results_eq(
  'select name from public.site',
  array['Sede B1'],
  'Dirección de B ve solo las sedes de B'
);

select is(
  (select count(*)::int from public.membership where institution_id = '11111111-1111-1111-1111-111111111111'),
  0,
  'Dirección de B no ve las membresías de A'
);

-- ---------------------------------------------------------------------------
-- Recepción de A: ve, pero no crea sedes
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000002');

select results_eq(
  'select name from public.institution',
  array['Institución A'],
  'Recepción de A ve su institución'
);

select throws_ok(
  $$ insert into public.site (institution_id, name) values ('11111111-1111-1111-1111-111111111111', 'Sede de recepción') $$,
  '42501', null,
  'Recepción no puede crear sedes, ni en su propia institución'
);

select lives_ok(
  $$ update public.user_profile set full_name = 'Recepción A (nuevo nombre)' where id = 'a0000000-0000-0000-0000-000000000002' $$,
  'Cada persona puede cambiar su propio nombre'
);

update public.user_profile set full_name = 'Hackeado' where id = 'a0000000-0000-0000-0000-000000000001';
reset role;
select is(
  (select full_name from public.user_profile where id = 'a0000000-0000-0000-0000-000000000001'),
  'Dirección A',
  'Nadie puede cambiar el nombre de otra persona'
);

-- ---------------------------------------------------------------------------
-- Persona en las dos instituciones: ve las dos
-- ---------------------------------------------------------------------------
select pg_temp.login('c0000000-0000-0000-0000-000000000001');

select is(
  (select count(*)::int from public.institution),
  2,
  'Quien pertenece a A y a B ve las dos instituciones'
);

-- ---------------------------------------------------------------------------
-- Membresía dada de baja, sin membresía y sin sesión: no ven nada
-- ---------------------------------------------------------------------------
select pg_temp.login('a0000000-0000-0000-0000-000000000003');

select is_empty(
  'select 1 from public.institution union all select 1 from public.site union all select 1 from public.membership',
  'Con la membresía dada de baja no se ve nada'
);

select pg_temp.login('d0000000-0000-0000-0000-000000000001');

select is_empty(
  'select 1 from public.institution union all select 1 from public.site union all select 1 from public.membership',
  'Un usuario sin membresía no ve nada'
);

select pg_temp.logout();
set local role anon;

select throws_ok(
  'select 1 from public.site',
  '42501', null,
  'Sin sesión iniciada no se puede leer ninguna tabla'
);

reset role;

select * from finish();

rollback;
