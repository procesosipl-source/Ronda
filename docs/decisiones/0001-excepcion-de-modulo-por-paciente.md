# 0001 — La prestación se calcula; la excepción se registra

- **Fecha:** 29 de septiembre de 2026
- **Estado:** Aceptada
- **Afecta a:** Coberturas, autorizaciones, prefacturación (etapas 1 y 2)

## Contexto

Qué prestación se le presenta a una obra social por un paciente sale de una **tabla de reglas ordenadas**: la primera que coincide gana, y si ninguna coincide el resultado es `No definido`. Esto reemplaza a las fórmulas anidadas de la App de Conexión de AppSheet, que nadie podía leer ni cambiar sin romper algo.

Al revisar el prototipo surgió el pedido de **poder editar el módulo desde la ficha del paciente**. Es un pedido razonable: en la práctica hay pacientes que, por lo acordado con la auditoría de su obra social, no siguen la regla general.

El problema es que un campo editable a mano rompería la regla 11 de `CLAUDE.md` ("configuración antes que código", y por extensión, antes que carga manual): si cada paciente puede tener su prestación escrita a dedo, las reglas dejan de ser la fuente de verdad, nadie sabe por qué un paciente factura lo que factura, y volvemos al problema que veníamos a resolver.

## Decisión

La prestación **se sigue calculando** desde las reglas. Además, cada paciente puede tener una **excepción** con tres condiciones:

1. **Motivo obligatorio.** Sin motivo no se guarda.
2. **Siempre visible.** La ficha muestra el valor con la etiqueta "Excepción" y, al lado, cuál era la regla que le correspondía.
3. **Auditada.** Cargarla y quitarla van a `audit_log`, con usuario y fecha.

La prefacturación usa la excepción si existe; si no, la regla. La excepción no borra ni edita la regla.

## Alternativas descartadas

**Campo editable sin más.** Es lo más rápido y lo que pidieron literalmente. Se descarta porque en seis meses nadie podría explicar por qué un paciente factura distinto, y las reglas quedarían de adorno. Es exactamente el problema de las planillas.

**No permitir excepciones; que todo se resuelva agregando reglas.** Es lo más puro y fue la primera opción. Se descarta porque obliga a crear una regla para un caso único, y una tabla de reglas con veinte reglas de un paciente cada una es peor que una excepción declarada. Además, crear una regla mal puede afectar a otros pacientes; la excepción, por definición, no.

**Marcar la excepción sin exigir motivo.** Se descarta porque el motivo es justamente lo que hace auditable la excepción. Sin él es un campo editable con otro nombre.

## Consecuencias

- La ficha del paciente tiene un panel de Cobertura que muestra el valor calculado, por qué regla salió y, si la hay, la excepción.
- Si una institución acumula excepciones parecidas, eso mismo es la señal de que le falta una regla. Vale la pena mostrar un aviso cuando haya varias excepciones con la misma prestación.
- La tabla `patient` necesita `module_exception` (prestación, motivo, quién y cuándo), o una tabla aparte si después se quiere versionar.
- El flujo está documentado en [`docs/flujos/17-que-prestacion-se-presenta.md`](../flujos/17-que-prestacion-se-presenta.md).
