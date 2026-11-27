-- Semana 5 — Invitar usuarios, cambiar roles y dar de baja (flujo 21).
--
-- Todo pasa por funciones del servidor (reglas 3, 7 y 10): verifican que quien lo hace sea
-- Dirección de esa institución, aplican los cambios juntos y los registran en la auditoría.
--
-- Cuando alguien sin permiso lo intenta, las funciones devuelven 'denied' / false en lugar
-- de lanzar un error, para que el registro de "Acceso denegado" no se deshaga (ADR 0006).

insert into public.audit_action (code, name) values
  ('member_invited',       'Invitó a una persona'),
  ('member_roles_changed', 'Cambió los roles de una persona'),
  ('member_deactivated',   'Dio de baja a una persona');

-- ---------------------------------------------------------------------------
-- Auxiliares
-- ---------------------------------------------------------------------------

-- Roles activos de una persona en una institución, en el orden del catálogo.
create function private.active_role_codes(p_institution_id uuid, p_user_id uuid)
returns text[]
language sql
stable
set search_path = ''
as $$
  select coalesce(array_agg(r.code order by r.sort_order), '{}')
  from public.membership m
  join public.role r on r.id = m.role_id
  where m.institution_id = p_institution_id
    and m.user_id = p_user_id
    and m.deleted_at is null;
$$;

create function private.validate_role_codes(p_role_codes text[])
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if p_role_codes is null or cardinality(p_role_codes) = 0 then
    raise exception 'Elegí al menos un rol.';
  end if;
  if exists (select 1 from unnest(p_role_codes) c where c not in (select code from public.role)) then
    raise exception 'Hay un rol que no existe.';
  end if;
end;
$$;

-- La institución nunca se queda sin alguien con rol de Dirección: si no, nadie puede administrarla.
create function private.ensure_director_remains(p_institution_id uuid)
returns void
language plpgsql
stable
set search_path = ''
as $$
begin
  if not exists (
    select 1 from public.membership m join public.role r on r.id = m.role_id
    where m.institution_id = p_institution_id and m.deleted_at is null and r.code = 'director'
  ) then
    raise exception 'La institución tiene que tener al menos una persona con rol de Dirección.';
  end if;
end;
$$;

-- Si quien llama no es Dirección, registra el intento y devuelve false.
create function private.require_director(p_institution_id uuid, p_attempt text)
returns boolean
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is not null and private.has_role(p_institution_id, array['director']) then
    return true;
  end if;
  if auth.uid() is not null and exists (select 1 from public.institution where id = p_institution_id) then
    perform private.write_audit(p_institution_id, 'access_denied', null, null,
      jsonb_build_object('reason', p_attempt || ' sin rol de Dirección'));
  end if;
  return false;
end;
$$;

-- Cambia las membresías activas de una persona para que tenga exactamente estos roles.
create function private.apply_role_codes(p_institution_id uuid, p_user_id uuid, p_role_codes text[])
returns void
language plpgsql
set search_path = ''
as $$
begin
  update public.membership m
     set deleted_at = now()
    from public.role r
   where r.id = m.role_id
     and m.institution_id = p_institution_id
     and m.user_id = p_user_id
     and m.deleted_at is null
     and r.code <> all (p_role_codes);

  insert into public.membership (institution_id, user_id, role_id)
  select p_institution_id, p_user_id, r.id
  from public.role r
  where r.code = any (p_role_codes)
    and r.code <> all (private.active_role_codes(p_institution_id, p_user_id));
end;
$$;

revoke all on function private.active_role_codes(uuid, uuid) from public;
revoke all on function private.validate_role_codes(text[]) from public;
revoke all on function private.ensure_director_remains(uuid) from public;
revoke all on function private.require_director(uuid, text) from public;
revoke all on function private.apply_role_codes(uuid, uuid, text[]) from public;

-- ---------------------------------------------------------------------------
-- Invitar
-- Devuelve:
--   'denied'       quien llama no es Dirección (queda registrado);
--   'needs_invite' la persona no tiene usuario: la Edge Function invite-user le manda el mail
--                  y vuelve a llamar a esta función;
--   'added'        la persona ya tenía usuario y se le sumaron los roles.
-- ---------------------------------------------------------------------------
create function public.invite_member(
  p_institution_id uuid,
  p_email text,
  p_full_name text,
  p_role_codes text[]
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_user_id uuid;
begin
  if not private.require_director(p_institution_id, 'Intentó invitar a una persona') then
    return 'denied';
  end if;

  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Revisá el correo: no parece válido.';
  end if;
  if length(trim(coalesce(p_full_name, ''))) = 0 then
    raise exception 'Escribí el nombre y apellido.';
  end if;
  perform private.validate_role_codes(p_role_codes);

  select id into v_user_id from auth.users where lower(email) = v_email;
  if v_user_id is null then
    return 'needs_invite';
  end if;

  if cardinality(private.active_role_codes(p_institution_id, v_user_id)) > 0 then
    raise exception 'Esa persona ya es parte de la institución. Para cambiar sus roles, usá "Cambiar roles".';
  end if;

  perform private.apply_role_codes(p_institution_id, v_user_id, p_role_codes);
  perform private.write_audit(p_institution_id, 'member_invited', 'user_profile', v_user_id,
    jsonb_build_object('email', v_email, 'roles', private.active_role_codes(p_institution_id, v_user_id)));
  return 'added';
end;
$$;

-- ---------------------------------------------------------------------------
-- Cambiar roles. Devuelve false si quien llama no es Dirección.
-- ---------------------------------------------------------------------------
create function public.set_member_roles(
  p_institution_id uuid,
  p_user_id uuid,
  p_role_codes text[],
  p_reason text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before text[];
begin
  if not private.require_director(p_institution_id, 'Intentó cambiar roles') then
    return false;
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Escribí el motivo del cambio.';
  end if;
  perform private.validate_role_codes(p_role_codes);

  v_before := private.active_role_codes(p_institution_id, p_user_id);
  if cardinality(v_before) = 0 then
    raise exception 'Esa persona no es parte de la institución.';
  end if;

  perform private.apply_role_codes(p_institution_id, p_user_id, p_role_codes);
  perform private.ensure_director_remains(p_institution_id);

  perform private.write_audit(p_institution_id, 'member_roles_changed', 'user_profile', p_user_id,
    jsonb_build_object('before', v_before, 'after', private.active_role_codes(p_institution_id, p_user_id),
                       'reason', trim(p_reason)));
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Dar de baja. No borra nada de lo que la persona registró (flujo 21).
-- Devuelve false si quien llama no es Dirección.
-- ---------------------------------------------------------------------------
create function public.deactivate_member(p_institution_id uuid, p_user_id uuid, p_reason text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_before text[];
begin
  if not private.require_director(p_institution_id, 'Intentó dar de baja a una persona') then
    return false;
  end if;

  if length(trim(coalesce(p_reason, ''))) = 0 then
    raise exception 'Escribí el motivo de la baja.';
  end if;

  v_before := private.active_role_codes(p_institution_id, p_user_id);
  if cardinality(v_before) = 0 then
    raise exception 'Esa persona no es parte de la institución.';
  end if;

  update public.membership
     set deleted_at = now()
   where institution_id = p_institution_id and user_id = p_user_id and deleted_at is null;
  perform private.ensure_director_remains(p_institution_id);

  perform private.write_audit(p_institution_id, 'member_deactivated', 'user_profile', p_user_id,
    jsonb_build_object('before', v_before, 'reason', trim(p_reason)));
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Lista de personas de la institución, para la pantalla de Usuarios. Solo Dirección.
-- Lee el correo y si aceptó la invitación desde Auth, que la aplicación no puede leer directo.
-- ---------------------------------------------------------------------------
create function public.list_members(p_institution_id uuid)
returns table (
  user_id uuid,
  full_name text,
  email text,
  role_codes text[],
  invitation_pending boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name, u.email::text,
         private.active_role_codes(p_institution_id, p.id),
         u.last_sign_in_at is null
  from public.user_profile p
  join auth.users u on u.id = p.id
  where private.has_role(p_institution_id, array['director'])
    and exists (
      select 1 from public.membership m
      where m.institution_id = p_institution_id and m.user_id = p.id and m.deleted_at is null
    )
  order by p.full_name;
$$;

revoke all on function public.invite_member(uuid, text, text, text[]) from public, anon;
revoke all on function public.set_member_roles(uuid, uuid, text[], text) from public, anon;
revoke all on function public.deactivate_member(uuid, uuid, text) from public, anon;
revoke all on function public.list_members(uuid) from public, anon;
grant execute on function public.invite_member(uuid, text, text, text[]) to authenticated;
grant execute on function public.set_member_roles(uuid, uuid, text[], text) to authenticated;
grant execute on function public.deactivate_member(uuid, uuid, text) to authenticated;
grant execute on function public.list_members(uuid) to authenticated;
