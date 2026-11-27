# 0006 — Auditoría de solo inserción, escrita por el servidor

- **Fecha:** 27 de noviembre de 2026
- **Estado:** Aceptada
- **Afecta a:** Todas las etapas. Cada módulo suma sus acciones a la auditoría.

## Contexto

La regla 7 de `CLAUDE.md` y el flujo [22 — Acceso y auditoría](../flujos/22-acceso-y-auditoria.md) piden registrar las acciones sobre datos sensibles en una tabla que nadie pueda modificar ni borrar, y que solo lea Dirección. Hace falta decidir quién escribe esa tabla, cómo se protege y qué se registra al entrar.

## Decisión

1. **`audit_log`** guarda fecha y hora, institución, usuario, una **copia** del nombre y los roles de la persona en ese momento, la acción, la entidad y el registro afectados, y un campo `details` con datos extra. La copia es a propósito: si después cambia un nombre o un rol, la auditoría sigue diciendo lo que era cierto entonces.
2. **Catálogo cerrado de acciones** (`audit_action`), con su texto en español para la pantalla. Lo mantiene IPL por migraciones y cada módulo suma las suyas. Arranca con: *Ingresó a la institución*, *Salió* y *Acceso denegado*.
3. **Nadie escribe directo.** La aplicación no tiene permiso de insertar en `audit_log`. Escribe solo `private.write_audit`, una función interna que completan las demás funciones del servidor. El usuario, el nombre, los roles y la fecha los pone la base, así que nadie puede registrar algo a nombre de otra persona.
4. **Solo inserción, en dos capas:** la aplicación no tiene permiso de modificar ni borrar, y además un trigger rechaza `UPDATE`, `DELETE` y `TRUNCATE` aunque los intente un administrador de la base.
5. **Solo Dirección la lee**, y solo la de su institución (RLS).
6. **Entrar a una institución es una función del servidor**, `enter_institution`, que verifica la membresía y registra el ingreso. Si la persona no tiene membresía, registra *Acceso denegado* en la auditoría de esa institución y devuelve `false`, **sin lanzar un error**: un error desharía también el registro.
7. **Se pide elegir la institución en cada ingreso.** La elección se guarda en el navegador junto con el identificador de la sesión de Supabase. Al recargar la página no se vuelve a registrar el ingreso, pero al entrar de nuevo sí.

## Limitación conocida

Cuando RLS filtra o rechaza una consulta, no puede dejar registro: la base deshace todo lo que pasó en esa consulta, incluido el intento de escribir en la auditoría. Por eso **los accesos denegados se registran en las funciones del servidor** (entrar a una institución hoy; abrir o exportar una historia clínica, firmar o cerrar un período más adelante). Las pantallas sensibles, como la historia clínica, se van a leer a través de funciones del servidor y no con consultas directas a las tablas, justamente para poder registrar quién las abrió y quién lo intentó sin permiso.

## Alternativas descartadas

**Que la aplicación inserte en `audit_log`.** Es lo más simple, pero cualquiera podría registrar eventos falsos o a nombre de otra persona, o simplemente no registrar nada.

**Triggers en cada tabla que copien todos los cambios.** Registra todo de forma automática, pero el flujo 22 pide registrar lo que importa: si se registra todo, nadie mira la auditoría. Además, un trigger no ve las lecturas, y ver una historia clínica es de lo más importante que hay que registrar.

**Usar el registro de Auth de Supabase (`auth.audit_log_entries`).** Ya registra los inicios de sesión, pero no sabe nada de instituciones: Dirección no podría ver solo los de la suya.

**Registrar el ingreso con cada renovación del token.** Sería automático, pero el token se renueva cada hora y llenaría la auditoría de ingresos que nadie hizo.

## Consecuencias

- Cada módulo nuevo suma sus acciones a `audit_action` en su migración y llama a `private.write_audit` desde sus funciones del servidor.
- Las lecturas que hay que auditar (historia clínica) pasan por funciones del servidor.
- Hay que pensar más adelante cuánto tiempo se conserva la auditoría y cómo se exporta. Eso queda para la consulta legal.
