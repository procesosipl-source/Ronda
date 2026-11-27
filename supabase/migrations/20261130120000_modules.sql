-- Semana 5 — Módulos activables por institución.
-- Decisión: docs/decisiones/0003-modulos-activables-por-institucion.md
-- Catálogo: docs/modulos.md
--
-- Los módulos los activa y desactiva solo IPL (decisión del 27/11/2026): cambian lo que la
-- institución paga, así que son parte del contrato. La aplicación solo los lee.

-- ---------------------------------------------------------------------------
-- module — catálogo común a todas las instituciones, mantenido por IPL
-- ---------------------------------------------------------------------------
create table public.module (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z_]+$'),
  name text not null,
  description text not null,
  sort_order integer not null
);

comment on table public.module is 'Catálogo de módulos. "core" (Base) está siempre activo y no se registra por institución.';

-- Qué necesita cada módulo. Los requisitos del mismo grupo son alternativas:
-- basta con uno activo de cada grupo. Ejemplo: Factura electrónica necesita
-- Obras sociales O Cobros particulares (un solo grupo con dos módulos).
create table public.module_requirement (
  module_id uuid not null references public.module (id),
  requirement_group smallint not null,
  required_module_id uuid not null references public.module (id),
  primary key (module_id, requirement_group, required_module_id),
  check (module_id <> required_module_id)
);

comment on table public.module_requirement is 'Requisitos entre módulos. Dentro de un grupo alcanza con uno; hacen falta todos los grupos.';

insert into public.module (code, name, description, sort_order) values
  ('core',                'Base',                        'Pacientes, profesionales, agenda, historia clínica, documentos, usuarios y auditoría.', 1),
  ('coverage',            'Obras sociales',              'Obras sociales, prestaciones, tarifario, autorizaciones y prefacturación.', 2),
  ('private_billing',     'Cobros particulares',         'Cobros a particulares, copagos y saldo del paciente.', 3),
  ('groups',              'Grupos y talleres',           'Actividades grupales, encuentros con asistencia y evolución grupal.', 4),
  ('inpatient',           'Internación',                 'Habitaciones y camas, ingresos, egresos, días autorizados y prórrogas.', 5),
  ('medication',          'Enfermería y medicación',     'Esquemas de medicación, ronda de administración y controles de enfermería.', 6),
  ('management',          'Gestión para Dirección',      'Evoluciones faltantes, reporte semanal y tableros.', 7),
  ('professional_payout', 'Liquidación a profesionales', 'Honorarios por prestación atendida y resumen mensual.', 8),
  ('whatsapp',            'Recordatorios por WhatsApp',  'Recordatorio del turno y confirmación desde el mensaje.', 9),
  ('e_invoice',           'Factura electrónica ARCA',    'Factura electrónica desde la prefacturación o un cobro particular.', 10),
  ('telehealth',          'Telesalud',                   'Turnos virtuales con videollamada.', 11),
  ('clinical_ai',         'IA clínica',                  'Borradores de evolución y resúmenes que el profesional revisa y firma.', 12),
  ('e_prescription',      'Receta electrónica',          'Prescripción a través de una plataforma habilitada.', 13),
  ('payer_online',        'Obras sociales en línea',     'Validación de afiliados y autorizaciones en el sistema de cada obra social.', 14),
  ('patient_portal',      'Portal del paciente',         'El paciente ve sus turnos, documentos y pagos.', 15);

insert into public.module_requirement (module_id, requirement_group, required_module_id)
select m.id, r.grp, req.id
from (values
  ('e_invoice',    1, 'coverage'),
  ('e_invoice',    1, 'private_billing'),
  ('payer_online', 1, 'coverage')
) as r(module_code, grp, required_code)
join public.module m on m.code = r.module_code
join public.module req on req.code = r.required_code;

-- ---------------------------------------------------------------------------
-- institution_module — qué módulos tiene cada institución, con vigencia
-- Apagar un módulo cierra la vigencia (deactivated_at): no se borra, queda el historial.
-- ---------------------------------------------------------------------------
create table public.institution_module (
  id uuid primary key default gen_random_uuid(),
  institution_id uuid not null references public.institution (id),
  module_id uuid not null references public.module (id),
  activated_at timestamptz not null default now(),
  activated_by uuid references auth.users (id),
  deactivated_at timestamptz,
  deactivated_by uuid references auth.users (id),
  unique (institution_id, id),
  check (deactivated_at is null or deactivated_at >= activated_at)
);

comment on table public.institution_module is 'Módulos de cada institución. Los cambia solo IPL con private.activate_module / private.deactivate_module.';

create unique index institution_module_active_unique
  on public.institution_module (institution_id, module_id)
  where deactivated_at is null;

-- ¿El módulo está activo en esta institución? "core" siempre lo está.
create function public.module_enabled(p_institution_id uuid, p_module_code text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_module_code = 'core' or exists (
    select 1
    from public.institution_module im
    join public.module m on m.id = im.module_id
    where im.institution_id = p_institution_id
      and m.code = p_module_code
      and im.deactivated_at is null
  );
$$;

revoke all on function public.module_enabled(uuid, text) from public, anon;
grant execute on function public.module_enabled(uuid, text) to authenticated;

-- ¿Se cumplen los requisitos de este módulo en esta institución?
create function private.module_requirements_met(p_institution_id uuid, p_module_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select not exists (
    select 1
    from (select distinct requirement_group from public.module_requirement where module_id = p_module_id) g
    where not exists (
      select 1
      from public.module_requirement r
      join public.module req on req.id = r.required_module_id
      where r.module_id = p_module_id
        and r.requirement_group = g.requirement_group
        and public.module_enabled(p_institution_id, req.code)
    )
  );
$$;

-- Controla los requisitos al activar y al apagar (ADR 0003, punto 5).
create function private.check_module_requirements()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_name text;
  v_blocking text;
begin
  if tg_op = 'UPDATE' and (new.institution_id, new.module_id, new.activated_at) is distinct from (old.institution_id, old.module_id, old.activated_at) then
    raise exception 'Solo se puede cerrar la vigencia de un módulo, no cambiar sus datos'
      using errcode = 'check_violation';
  end if;

  if tg_op = 'INSERT' then
    if (select code from public.module where id = new.module_id) = 'core' then
      raise exception 'La Base está siempre activa: no se activa ni se apaga'
        using errcode = 'check_violation';
    end if;
    if not private.module_requirements_met(new.institution_id, new.module_id) then
      select name into v_name from public.module where id = new.module_id;
      raise exception 'No se puede activar %: le falta un módulo que necesita', v_name
        using errcode = 'check_violation';
    end if;
  elsif old.deactivated_at is null and new.deactivated_at is not null then
    -- Al apagar, ningún otro módulo activo puede quedarse sin sus requisitos.
    -- El trigger corre antes del cambio, así que se simula el estado posterior.
    select string_agg(m.name, ', ' order by m.sort_order) into v_blocking
    from public.institution_module im
    join public.module m on m.id = im.module_id
    where im.institution_id = new.institution_id
      and im.deactivated_at is null
      and im.id <> new.id
      and exists (
        select 1
        from (select distinct requirement_group from public.module_requirement where module_id = im.module_id) g
        where not exists (
          select 1
          from public.module_requirement r
          join public.institution_module other on other.module_id = r.required_module_id
          where r.module_id = im.module_id
            and r.requirement_group = g.requirement_group
            and other.institution_id = new.institution_id
            and other.deactivated_at is null
            and other.id <> new.id
        )
      );
    if v_blocking is not null then
      select name into v_name from public.module where id = new.module_id;
      raise exception 'No se puede apagar %: antes hay que apagar %', v_name, v_blocking
        using errcode = 'check_violation';
    end if;
  elsif old.deactivated_at is not null then
    raise exception 'Un módulo apagado no se vuelve a prender: se activa de nuevo'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger check_module_requirements
  before insert or update on public.institution_module
  for each row execute function private.check_module_requirements();

-- Borrado lógico (regla 6): ni siquiera un administrador de la base borra el historial.
create function private.reject_delete()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Este registro no se borra: se da de baja'
    using errcode = 'insufficient_privilege';
end;
$$;

create trigger reject_delete
  before delete on public.institution_module
  for each row execute function private.reject_delete();

-- ---------------------------------------------------------------------------
-- Funciones para IPL. No las puede llamar la aplicación: se usan desde el
-- editor SQL de Supabase (o una futura pantalla interna de IPL, etapa 8).
--   select private.activate_module('<id de la institución>', 'inpatient');
--   select private.deactivate_module('<id de la institución>', 'inpatient');
-- ---------------------------------------------------------------------------
insert into public.audit_action (code, name) values
  ('module_activated',   'Activó un módulo'),
  ('module_deactivated', 'Apagó un módulo');

create function private.activate_module(p_institution_id uuid, p_module_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_module_id uuid;
  v_id uuid;
begin
  select id into v_module_id from public.module where code = p_module_code;
  if v_module_id is null then
    raise exception 'No existe el módulo %', p_module_code;
  end if;
  if public.module_enabled(p_institution_id, p_module_code) then
    return;  -- ya estaba activo
  end if;
  insert into public.institution_module (institution_id, module_id, activated_by)
  values (p_institution_id, v_module_id, auth.uid())
  returning id into v_id;
  perform private.write_audit(p_institution_id, 'module_activated', 'institution_module', v_id,
    jsonb_build_object('module', p_module_code, 'by', 'IPL'));
end;
$$;

create function private.deactivate_module(p_institution_id uuid, p_module_code text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  update public.institution_module im
     set deactivated_at = now(), deactivated_by = auth.uid()
    from public.module m
   where m.id = im.module_id
     and m.code = p_module_code
     and im.institution_id = p_institution_id
     and im.deactivated_at is null
  returning im.id into v_id;
  if v_id is null then
    return;  -- no estaba activo
  end if;
  perform private.write_audit(p_institution_id, 'module_deactivated', 'institution_module', v_id,
    jsonb_build_object('module', p_module_code, 'by', 'IPL'));
end;
$$;

revoke all on function private.module_requirements_met(uuid, uuid) from public;
revoke all on function private.activate_module(uuid, text) from public;
revoke all on function private.deactivate_module(uuid, text) from public;

-- ---------------------------------------------------------------------------
-- Permisos y RLS
-- ---------------------------------------------------------------------------
revoke all on public.module, public.module_requirement, public.institution_module from anon, authenticated;
grant select on public.module, public.module_requirement, public.institution_module to authenticated;

alter table public.module enable row level security;
alter table public.module_requirement enable row level security;
alter table public.institution_module enable row level security;

create policy module_select_all on public.module
  for select to authenticated using (true);

create policy module_requirement_select_all on public.module_requirement
  for select to authenticated using (true);

-- Los miembros ven qué módulos tiene su institución (para armar el menú). Nadie los cambia desde la app.
create policy institution_module_select_members on public.institution_module
  for select to authenticated
  using (private.is_member(institution_id));
