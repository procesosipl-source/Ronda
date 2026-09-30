# 0002 — Cambiar un esquema de medicación crea una versión nueva

- **Fecha:** 29 de septiembre de 2026
- **Estado:** Aceptada
- **Afecta a:** Medicación y enfermería (etapa 5)

## Contexto

Un esquema de medicación dice qué toma un paciente, en qué dosis, por qué vía y a qué hora. Lo indica psiquiatría; enfermería registra cada toma contra ese esquema.

El pedido fue que **los profesionales puedan editar los esquemas fácilmente**. Es correcto: hoy la medicación se ajusta seguido, y si cambiar una dosis cuesta trabajo, se termina anotando en papel.

El riesgo aparece cuando se mira qué pasa con lo ya registrado. Si el esquema se editara en el lugar:

- Enfermería registró a las 08:00 "Quetiapina 25 mg administrada".
- A las 10:00 el médico cambia el esquema a 50 mg.
- El registro de las 08:00 apunta al esquema, que ahora dice 50 mg.
- **El sistema afirma que a las 08:00 se administraron 50 mg. Es falso.**

En un registro clínico de medicación eso no es un detalle de implementación: es información incorrecta sobre lo que entró al cuerpo de una persona.

## Decisión

Cambiar un esquema vigente **no modifica la fila**. En una sola operación del servidor:

1. Se cierra el esquema vigente: `hasta = hoy`, motivo "reemplazado por una indicación nueva".
2. Se crea un esquema nuevo con `version = anterior + 1`.

Las administraciones ya registradas siguen apuntando al esquema que efectivamente se administró. El esquema cerrado **no se oculta**: se muestra en la ficha, atenuado, con su fecha y su motivo.

Suspender sigue el mismo criterio: `hasta` y motivo obligatorio, sin borrar.

Es el mismo principio que la regla 5 de `CLAUDE.md` para la historia clínica, aplicado a la medicación, y por la misma razón.

## Alternativas descartadas

**Editar el esquema en el lugar.** Lo más simple y lo que se pidió textualmente. Se descarta por el escenario de arriba: corrompe el registro de administraciones hacia atrás.

**Editar en el lugar, pero copiar la dosis en cada administración.** Resuelve el registro histórico y es menos trabajo. Se descarta porque se pierde el rastro del cambio: no se puede responder "¿quién subió la dosis y cuándo?", que es la primera pregunta ante un evento adverso.

**Prohibir los cambios: para modificar, suspender y crear de cero.** Es lo más estricto y no necesita versionado. Se descarta por usabilidad: obliga a recargar todo el esquema para cambiar un horario, y se pierde el vínculo entre la indicación vieja y la nueva.

## Consecuencias

- La tabla `medication_order` lleva `valid_from`, `valid_to`, `end_reason` y `version`. La vigencia es la que decide qué entra en la ronda del día.
- `valid_to` es **exclusivo**: un esquema cerrado hoy ya no genera tomas hoy.
- Cerrar el anterior y crear el nuevo tiene que ser **una** transacción (regla 10). Si se hiciera en dos escrituras sueltas, un corte a mitad dejaría al paciente sin esquema o con dos vigentes.
- La pantalla muestra los esquemas cerrados junto a los vigentes: es historial clínico, no ruido.
- Enfermería ve los esquemas pero no los edita, y esa restricción se aplica en el servidor, no escondiendo el botón (regla 3).
- El flujo está documentado en [`docs/flujos/14-esquema-de-medicacion.md`](../flujos/14-esquema-de-medicacion.md) y [`15-ronda-de-administracion.md`](../flujos/15-ronda-de-administracion.md).
