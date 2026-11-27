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

-- ---------------------------------------------------------------------------
-- Módulos (ADR 0003): Los Álamos interna pacientes; Aconcagua es ambulatorio.
-- Se activan con la misma función que usa IPL, así queda en la auditoría.
-- ---------------------------------------------------------------------------
select private.activate_module('a0000000-0000-0000-0000-00000000000a', code)
from unnest(array['coverage', 'groups', 'inpatient', 'medication']) as code;

select private.activate_module('b0000000-0000-0000-0000-00000000000b', code)
from unnest(array['coverage', 'groups']) as code;

-- ---------------------------------------------------------------------------
-- Pacientes ficticios. Los nombres y documentos son inventados (regla 8).
-- Se cargan en Preadmisión, con su primer registro en el historial de estados.
-- ---------------------------------------------------------------------------
with nuevos (institution_id, first_name, last_name, chosen_name, document_type, document_number, birth_date, registered_sex, phone) as (
  values
    ('a0000000-0000-0000-0000-00000000000a'::uuid, 'Martina',  'Pérez',    null,    'dni',      '40.111.201', date '1998-03-14', 'F', '261 555-0101'),
    ('a0000000-0000-0000-0000-00000000000a'::uuid, 'Joaquín',  'Gómez',    null,    'dni',      '38.222.302', date '1994-07-02', 'M', '261 555-0102'),
    ('a0000000-0000-0000-0000-00000000000a'::uuid, 'Valentín', 'Núñez',    'Vale',  'dni',      '45.333.403', date '2005-11-23', 'X', null),
    ('a0000000-0000-0000-0000-00000000000a'::uuid, 'Rosa',     'Álvarez',  null,    'dni',      '12.444.504', date '1956-01-30', 'F', '261 555-0104'),
    ('a0000000-0000-0000-0000-00000000000a'::uuid, 'Lucía',    'Peña',     null,    'passport', 'AB123456',   date '1989-05-17', 'F', null),
    ('a0000000-0000-0000-0000-00000000000a'::uuid, 'Tomás',    'Ibáñez',   null,    'dni',      '50.555.605', date '2010-09-09', 'M', '261 555-0106'),
    ('b0000000-0000-0000-0000-00000000000b'::uuid, 'Camila',   'Pérez',    null,    'dni',      '41.666.706', date '1999-02-11', 'F', '261 555-0201'),
    -- Mismo DNI que Martina Pérez, pero en otra institución: los padrones están aislados (flujo 01).
    ('b0000000-0000-0000-0000-00000000000b'::uuid, 'Martina',  'Pérez',    null,    'dni',      '40111201',   date '1998-03-14', 'F', null)
),
creados as (
  insert into public.patient (institution_id, first_name, last_name, chosen_name, document_type, document_number, birth_date, registered_sex, phone, status_id)
  select n.institution_id, n.first_name, n.last_name, n.chosen_name, n.document_type, n.document_number, n.birth_date, n.registered_sex, n.phone, s.id
  from nuevos n
  join public.patient_status s on s.institution_id = n.institution_id and s.is_initial
  returning id, institution_id, status_id
)
insert into public.patient_status_history (institution_id, patient_id, from_status_id, to_status_id, reason)
select institution_id, id, null, status_id, 'Alta del paciente' from creados;

-- ---------------------------------------------------------------------------
-- Obras sociales de cada institución ("Particular" la crea la base sola) y coberturas.
-- Los números de afiliado son inventados.
-- ---------------------------------------------------------------------------
insert into public.payer (institution_id, name, kind, requires_member_number) values
  ('a0000000-0000-0000-0000-00000000000a', 'OSEP',          'social_security', true),
  ('a0000000-0000-0000-0000-00000000000a', 'PAMI',          'social_security', true),
  ('a0000000-0000-0000-0000-00000000000a', 'OSDE',          'prepaid',         true),
  ('a0000000-0000-0000-0000-00000000000a', 'Swiss Medical', 'prepaid',         true),
  ('b0000000-0000-0000-0000-00000000000b', 'OSEP',          'social_security', true),
  ('b0000000-0000-0000-0000-00000000000b', 'OSDE',          'prepaid',         true);

insert into public.patient_coverage (institution_id, patient_id, payer_id, member_number, valid_from)
select p.institution_id, p.id, py.id, c.member_number, date '2026-11-01'
from (values
  ('40.111.201', 'OSEP',          '0401112/00'),
  ('38.222.302', 'OSDE',          '61 223344 5 01'),
  ('45.333.403', 'OSEP',          '0453334/02'),
  ('12.444.504', 'PAMI',          '15-12444504-0'),
  ('AB123456',   'Particular',    null),
  ('50.555.605', 'Swiss Medical', '80012345'),
  ('41.666.706', 'OSDE',          '61 998877 1 01'),
  ('40111201',   'OSEP',          '0401112/00')
) as c(document_number, payer_name, member_number)
join public.patient p on p.document_number = c.document_number
join public.payer py on py.institution_id = p.institution_id and py.name = c.payer_name;
