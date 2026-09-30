# 06 — Ausente, cancelación y reprogramación

Los tres finales de un turno que no termina en atención. Se distinguen porque **impactan distinto**: en la asistencia, en el consumo de la autorización y en el cobro.

## Los tres casos

```mermaid
flowchart TD
    T["Turno programado o confirmado"] --> Q{"¿Qué pasó?"}

    Q -->|"El paciente avisa antes"| CAN["Cancelado"]
    Q -->|"No vino y no avisó"| AUS["Ausente"]
    Q -->|"Se corre a otro día"| REP["Reprogramado"]
    Q -->|"La clínica no puede atender"| CCL["Cancelado por la institución"]

    CAN --> LIB["Libera la franja"]
    CAN --> NOA["No cuenta como ausencia del paciente"]
    CAN --> NOC["No consume la autorización"]

    AUS --> NOLIB["La franja ya pasó"]
    AUS --> SIA["Cuenta en el indicador de asistencia"]
    AUS --> CONS{"¿La obra social<br/>descuenta el ausente?"}
    CONS -->|Según configuración| SI["Consume la autorización"]
    CONS -->|Según configuración| NO["No la consume"]

    REP --> NUE["Se crea el turno nuevo,<br/>vinculado al original"]
    REP --> ORI["El original queda como Reprogramado,<br/>no se borra"]

    CCL --> AVI["Hay que avisarle al paciente"]
    CCL --> NOSI["No cuenta como ausencia del paciente"]

    classDef aud fill:#FFF1E6,stroke:#B8520A,color:#B8520A
    class CAN,AUS,REP,CCL aud
```

Que el ausente consuma o no la autorización **varía entre obras sociales**, así que es configuración de la institución, no un `if` en el código.

## Quién marca qué

| Acción | Dirección | Administración / Recepción | Profesional |
|---|---|---|---|
| Cancelar | Sí | Sí | Sus turnos |
| Marcar ausente | Sí | Sí | Sus turnos |
| Reprogramar | Sí | Sí | Sus turnos |
| Cancelar por la institución | Sí | Sí | Sus turnos |

Toda cancelación pide **motivo**. Es lo que después permite distinguir "el paciente abandonó" de "la clínica no pudo atender".

## Ausente automático

Al cerrar el día, los turnos que quedaron en Programado o Confirmado y ya pasaron se marcan como Ausente, con el usuario "sistema". Recepción puede corregirlos después: la corrección queda registrada.

## Caminos que la base impide

```mermaid
flowchart LR
    A["Turno ya Atendido"] -->|se intenta cancelar| B["🔒 Rechazado"]
    C["Cancelación sin motivo"] --> D["🔒 Rechazado"]
    E["Se intenta borrar un turno"] --> F["🔒 Rechazado: se marca, no se borra"]

    classDef bloq fill:#FDECEA,stroke:#B42318,color:#B42318
    class B,D,F bloq
```

## Auditoría

Cada cancelación con su motivo, cada ausente (y quién lo marcó, o si fue el sistema) y cada reprogramación con el turno de origen y el de destino.

## Reglas de `CLAUDE.md` que aplican

- **6** — cancelar y reprogramar marcan; nunca borran.
- **7** — todo va a `audit_log`.
- **11** — si el ausente consume la autorización es configuración por obra social.

## En camino

- El paciente cancela o pide reprogramar desde el mensaje de WhatsApp — etapa 8.1.

## Relacionados

[05 — El día del turno](05-dia-del-turno.md) · [18 — Autorización](18-autorizacion.md)
