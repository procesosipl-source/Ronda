# 12 — Días autorizados, vencimiento y prórroga

Una internación tiene días autorizados por la obra social. Cuando se agotan, la clínica sigue atendiendo pero **deja de cobrar**. Avisar a tiempo es plata.

## Flujo

```mermaid
flowchart TD
    I["Internación en curso"] --> C["Cada día se calcula:<br/>días transcurridos vs. autorizados"]
    C --> E{"¿Cuántos quedan?"}

    E -->|Más de 5| OK["Al día. Barra en verde"]
    E -->|5 o menos| AV["Aviso en Panel de turnos<br/>e Internación"]
    E -->|0 o menos| EX["Excede lo autorizado.<br/>Aviso en rojo"]

    AV --> PRO["Se solicita la prórroga"]
    EX --> PRO

    PRO --> DOC["Se arma el pedido:<br/>días pedidos, motivo clínico,<br/>informe del profesional"]
    DOC --> ENV["Se envía a la obra social"]
    ENV --> AUD["Queda en audit_log"]
    AUD --> RTA{"Respuesta"}

    RTA -->|Autoriza| SUM["Se suman los días.<br/>La barra vuelve a verde"]
    RTA -->|Rechaza| DEC{"¿Qué se hace?"}
    DEC --> ALTA["Se planifica el egreso"]
    DEC --> PART["Sigue internado como particular"]
    DEC --> RECL["Se reclama con más respaldo"]
    RECL --> DOC

    SUM --> AUD2["Queda en audit_log"]

    classDef aud fill:#FFF1E6,stroke:#B8520A,color:#B8520A
    classDef warn fill:#FEF6D8,stroke:#8A6100,color:#8A6100
    classDef bad fill:#FDECEA,stroke:#B42318,color:#B42318
    class AUD,AUD2,SUM aud
    class AV warn
    class EX bad
```

**Exceder los días autorizados no bloquea nada.** El paciente sigue internado y atendido: es una cuestión administrativa, no clínica. Lo que hace el sistema es que nadie pueda decir que no lo sabía.

## El cálculo

| Dato | De dónde sale |
|---|---|
| Días transcurridos | Fecha de hoy menos fecha de ingreso |
| Días autorizados | De la autorización vigente, más las prórrogas aprobadas |
| Días que quedan | Autorizados menos transcurridos |
| Umbral del aviso | Configurable por institución. Por defecto, 5 días |

Los días **se calculan**; no se cargan a mano. En las planillas se cargaban y se desactualizaban.

## Quién puede qué

| Acción | Dirección | Administración | Profesional | Enfermería |
|---|---|---|---|---|
| Ver los días que quedan | Sí | Sí | Sus pacientes | Sí |
| Solicitar la prórroga | Sí | Sí | No | No |
| Escribir el informe que la respalda | No | No | Sí | No |
| Registrar la respuesta | Sí | Sí | No | No |

## Auditoría

Solicitud de prórroga con días pedidos y motivo, y la respuesta de la obra social.

## Reglas de `CLAUDE.md` que aplican

- **7** — solicitud y respuesta van a `audit_log`.
- **11** — el umbral del aviso y los plazos de cada obra social son configuración.

## Relacionados

[11 — Ingreso a internación](11-ingreso-a-internacion.md) · [13 — Egreso](13-egreso-de-internacion.md) · [18 — Autorización](18-autorizacion.md)
