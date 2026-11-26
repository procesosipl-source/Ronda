# 0005 — Instituciones, membresías y roles

- **Fecha:** 26 de noviembre de 2026
- **Estado:** Aceptada
- **Afecta a:** Todas las etapas. Es la base de toda política RLS.

## Contexto

Ronda es multi-institución (regla 1 de `CLAUDE.md`). Hace falta decidir cómo se conecta una persona con una institución y con qué permisos, y dónde se aplica eso. El flujo [21 — Usuarios y permisos](../flujos/21-usuarios-y-permisos.md) define el modelo: usuario, membresía, institución y rol.

Quedaron dos preguntas abiertas: si una persona puede tener **varios roles** en la misma institución, y si los roles son **fijos** o los define cada institución.

## Decisión

1. **Tablas:** `institution` (el tenant), `site` (sede), `role` (catálogo), `user_profile` (nombre de cada usuario de Auth) y `membership` (usuario ↔ institución ↔ rol).
2. **Varios roles por persona.** `membership` tiene una fila por rol: si la directora también atiende pacientes, tiene una fila con Dirección y otra con Profesional, y sus permisos se suman. En las clínicas chicas es lo normal.
3. **Catálogo de roles fijo y común**, mantenido por IPL con migraciones: `director`, `coordinator`, `administration`, `reception`, `professional`, `nursing`. Las políticas RLS dependen de esos códigos, así que una institución no puede crear roles. Más adelante se le puede dejar cambiar el **nombre visible** de un rol, sin tocar el código.
4. **`user_profile` no tiene `institution_id`**: una persona puede pertenecer a varias instituciones. Se crea sola con un trigger cuando se crea el usuario en Auth.
5. **Funciones auxiliares en un esquema `private`**, que la API no expone: `is_member(institución)`, `has_role(institución, roles)` y `shares_institution_with(usuario)`. Todas las políticas las usan. Son `security definer` para que la política de `membership` no se consulte a sí misma.
6. **Permisos de esta etapa:**
   - Los miembros ven su institución, sus sedes, sus membresías y el nombre de sus compañeros.
   - Solo Dirección crea y modifica sedes.
   - **Nadie escribe membresías desde la aplicación todavía.** Invitar, cambiar roles y dar de baja llegan en la semana 5 con una función del servidor que registra en `audit_log` (reglas 7 y 10).
   - El alta y los cambios de una institución los hace IPL (flujo 23).
   - Sin sesión no se ve nada. Nadie borra filas: la baja es lógica (regla 6).
7. **La base completa las columnas comunes** (`created_by`, `updated_at`, `deleted_by`…) con un trigger, e impide que un registro cambie de institución.

## Alternativas descartadas

**Un solo rol por membresía.** Es más simple, pero obliga a inventar roles combinados ("Dirección y Profesional") o a elegir uno y perder permisos. Pasar de uno a varios más adelante obligaría a rehacer las políticas.

**Roles configurables por institución.** Respeta mejor la regla 11, pero las políticas de seguridad tendrían que interpretar roles que no conocen. Lo que varía entre instituciones (nombres, qué módulos usan) se puede configurar sin que cada una invente roles.

**Roles como `enum` de PostgreSQL.** Es más liviano, pero agregar o renombrar valores es incómodo y no permite guardar el nombre visible ni el orden.

**Guardar el rol en el token de sesión (JWT).** Ahorra consultas, pero un cambio de rol no se aplica hasta que la persona vuelve a entrar. El flujo 21 pide efecto inmediato.

## Consecuencias

- Toda tabla de negocio nueva usa `private.is_member` para leer y `private.has_role` para escribir según el rol, además de `module_enabled` cuando sea de un módulo opcional (ADR 0003).
- Toda tabla de negocio lleva `unique (institution_id, id)` para las claves foráneas compuestas.
- La semana 4 suma `audit_log` y la elección de institución al entrar. La semana 5 suma invitar usuarios y cambiar roles.
- `role` y `user_profile` se suman al glosario de `CLAUDE.md`.
