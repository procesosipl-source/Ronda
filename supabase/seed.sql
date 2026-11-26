-- Datos de prueba para la base LOCAL (npx supabase db reset).
-- Regla 8 de CLAUDE.md: todo lo que va acá es ficticio. Nunca datos de pacientes reales.
--
-- Dos instituciones inventadas para probar el aislamiento:
--   · Clínica Los Álamos (ficticia) — dos sedes
--   · Centro Aconcagua (ficticio)   — una sede
--
-- Todos los usuarios entran con la contraseña: prueba-ronda-2026
-- Los correos terminan en @ronda.test, un dominio que no existe.

-- ---------------------------------------------------------------------------
-- Usuarios (Supabase Auth). El trigger crea el perfil con el nombre de los metadatos.
-- ---------------------------------------------------------------------------
with people (id, email, full_name) as (
  values
    ('10000000-0000-0000-0000-000000000001'::uuid, 'direccion@alamos.ronda.test',      'Marta Quiroga'),
    ('10000000-0000-0000-0000-000000000002'::uuid, 'coordinacion@alamos.ronda.test',   'Julián Ferreyra'),
    ('10000000-0000-0000-0000-000000000003'::uuid, 'administracion@alamos.ronda.test', 'Sofía Lucero'),
    ('10000000-0000-0000-0000-000000000004'::uuid, 'recepcion@alamos.ronda.test',      'Diego Videla'),
    ('10000000-0000-0000-0000-000000000005'::uuid, 'psicologia@alamos.ronda.test',     'Laura Funes'),
    ('10000000-0000-0000-0000-000000000006'::uuid, 'enfermeria@alamos.ronda.test',     'Ramiro Ozán'),
    ('20000000-0000-0000-0000-000000000001'::uuid, 'direccion@aconcagua.ronda.test',   'Elena Godoy'),
    ('20000000-0000-0000-0000-000000000002'::uuid, 'recepcion@aconcagua.ronda.test',   'Pablo Sosa'),
    -- Psiquiatra que trabaja en las dos instituciones.
    ('30000000-0000-0000-0000-000000000001'::uuid, 'psiquiatria@ronda.test',           'Carla Montaña')
)
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change
)
select
  '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated', email,
  extensions.crypt('prueba-ronda-2026', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', full_name), now(), now(),
  '', '', '', ''
from people;

insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), id, id::text, 'email',
       jsonb_build_object('sub', id::text, 'email', email, 'email_verified', true),
       now(), now(), now()
from auth.users
where email like '%ronda.test';

-- ---------------------------------------------------------------------------
-- Instituciones y sedes
-- ---------------------------------------------------------------------------
insert into public.institution (id, name, legal_name) values
  ('a0000000-0000-0000-0000-00000000000a', 'Clínica Los Álamos (ficticia)', 'Los Álamos Salud Mental S.A. (ficticia)'),
  ('b0000000-0000-0000-0000-00000000000b', 'Centro Aconcagua (ficticio)',   'Centro Aconcagua S.R.L. (ficticio)');

insert into public.site (institution_id, name, address) values
  ('a0000000-0000-0000-0000-00000000000a', 'Sede Centro',      'Calle Inventada 123, Ciudad de Mendoza'),
  ('a0000000-0000-0000-0000-00000000000a', 'Sede Chacras',     'Calle Ficticia 456, Chacras de Coria'),
  ('b0000000-0000-0000-0000-00000000000b', 'Sede Godoy Cruz',  'Calle Imaginaria 789, Godoy Cruz');

-- ---------------------------------------------------------------------------
-- Membresías: una fila por rol (ADR 0005)
-- ---------------------------------------------------------------------------
insert into public.membership (institution_id, user_id, role_id)
select m.institution_id, m.user_id, r.id
from (values
  -- Los Álamos
  ('a0000000-0000-0000-0000-00000000000a'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'director'),
  ('a0000000-0000-0000-0000-00000000000a'::uuid, '10000000-0000-0000-0000-000000000001'::uuid, 'professional'),
  ('a0000000-0000-0000-0000-00000000000a'::uuid, '10000000-0000-0000-0000-000000000002'::uuid, 'coordinator'),
  ('a0000000-0000-0000-0000-00000000000a'::uuid, '10000000-0000-0000-0000-000000000003'::uuid, 'administration'),
  ('a0000000-0000-0000-0000-00000000000a'::uuid, '10000000-0000-0000-0000-000000000004'::uuid, 'reception'),
  ('a0000000-0000-0000-0000-00000000000a'::uuid, '10000000-0000-0000-0000-000000000005'::uuid, 'professional'),
  ('a0000000-0000-0000-0000-00000000000a'::uuid, '10000000-0000-0000-0000-000000000006'::uuid, 'nursing'),
  ('a0000000-0000-0000-0000-00000000000a'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, 'professional'),
  -- Aconcagua
  ('b0000000-0000-0000-0000-00000000000b'::uuid, '20000000-0000-0000-0000-000000000001'::uuid, 'director'),
  ('b0000000-0000-0000-0000-00000000000b'::uuid, '20000000-0000-0000-0000-000000000002'::uuid, 'reception'),
  ('b0000000-0000-0000-0000-00000000000b'::uuid, '30000000-0000-0000-0000-000000000001'::uuid, 'professional')
) as m(institution_id, user_id, role_code)
join public.role r on r.code = m.role_code;
