# 0003 — Los módulos se activan por institución y se controlan en la base

- **Fecha:** 9 de octubre de 2026
- **Estado:** Propuesta (se acepta junto con el catálogo de `docs/modulos.md`)
- **Afecta a:** Todas las etapas. Se construye en la etapa 0, junto con instituciones y roles.

## Contexto

Un cliente propuso vender Ronda por módulos, y el catálogo propuesto está en [`docs/modulos.md`](../modulos.md). Hace falta decidir **dónde se aplica** que una institución tenga o no un módulo.

La forma más rápida es esconder las secciones del menú. Pero la regla 3 de `CLAUDE.md` dice que ocultar un botón no es un permiso: si el control vive solo en la pantalla, cualquiera que conozca la dirección o llame a la API usa un módulo que no contrató. Peor: podría cargar datos clínicos (por ejemplo, medicación) en un módulo que después nadie ve.

## Decisión

1. **Catálogo de módulos** en la tabla `module`: código, nombre, módulos que requiere y si está disponible o es "Próximamente". Es la misma para todas las instituciones y la mantiene IPL.
2. **Módulos de cada institución** en la tabla `institution_module`: `institution_id`, `module_code`, desde, hasta, quién lo activó y quién lo desactivó. Con RLS como toda tabla. No se borra: apagar un módulo cierra la vigencia (`hasta`), así queda el historial.
3. **Una función en la base, `module_enabled(institution_id, module_code)`**, que se usa:
   - en las políticas RLS de **escritura** (insert y update) de las tablas de cada módulo;
   - en las funciones del servidor de cada módulo (por ejemplo, registrar una toma o cerrar un período), que fallan con un mensaje claro si el módulo no está activo.
4. **La lectura no se corta.** Con un módulo apagado, sus datos se pueden seguir leyendo según los permisos de siempre. Los registros clínicos tienen obligación de conservación y no pueden desaparecer porque la institución cambió de plan.
5. **Las dependencias se controlan en la base.** Activar un módulo sin los que requiere, o apagar uno del que dependen otros activos, lo rechaza un trigger sobre `institution_module`.
6. **El frontend solo lo refleja.** Lee los módulos activos para armar el menú y las pantallas, sin decidir nada por su cuenta.
7. **Auditoría.** Activar y desactivar un módulo va a `audit_log`, con usuario y fecha.

## Alternativas descartadas

**Esconder el menú y nada más.** Es lo más rápido. Se descarta por la regla 3: deja la API abierta y permite cargar datos en módulos no contratados.

**Planes fijos en el código** (`if plan === 'centros'`). Se descarta por la regla 11: cada cambio comercial obligaría a tocar código, y los planes van a cambiar. Los planes son paquetes de módulos, y eso es configuración.

**Una instalación o un esquema de base distinto por cliente, con solo sus módulos.** Da aislamiento máximo, pero multiplica el mantenimiento, las migraciones y los errores. Contradice la decisión de multi-tenant con esquema compartido (contexto §6).

**Bloquear también la lectura al apagar un módulo.** Es lo más estricto comercialmente. Se descarta porque dejaría inaccesibles registros clínicos que hay que conservar, y porque un cliente que baja de plan no puede perder su información.

## Consecuencias

- Cada tabla de un módulo opcional lleva en su política de escritura `and module_enabled(institution_id, '<código>')`. Se agrega a la plantilla de migraciones de la etapa 0.
- Cada tabla nueva de un módulo opcional lleva, además del test de aislamiento entre instituciones, un test pgTAP que verifica que **no se puede escribir con el módulo apagado** y que **sí se puede leer**.
- El seed de desarrollo tiene dos instituciones con módulos distintos (una con Internación y otra sin), para probar los dos caminos.
- El alta de una institución nueva (flujo 23) incluye elegir sus módulos.
- `CLAUDE.md` suma `module` e `institution_module` al glosario.
