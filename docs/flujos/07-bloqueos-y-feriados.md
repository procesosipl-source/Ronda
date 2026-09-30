# 07 — Bloqueo de agenda, licencias y feriados

Cómo se saca disponibilidad de la agenda sin tocar la plantilla horaria del profesional.

Son tres cosas distintas: la **plantilla** dice cuándo atiende habitualmente, la **excepción** dice cuándo no, y el **feriado** afecta a toda la institución.

## Los tres niveles

```mermaid
flowchart TD
    subgraph Nivel1["1. Plantilla horaria — permanente"]
        P["Ficha del profesional:<br/>día, desde, hasta, sede"]
    end
    subgraph Nivel2["2. Excepción — puntual"]
        B["Bloqueo de un rato:<br/>reunión, supervisión"]
        L["Licencia: varios días seguidos"]
        C["Bloqueo de consultorio o sede"]
    end
    subgraph Nivel3["3. Feriado — toda la institución"]
        F["Calendario de feriados<br/>y días no laborables"]
    end

    P --> D["Disponibilidad final"]
    B --> D
    L --> D
    C --> D
    F --> D
```

## Flujo

```mermaid
flowchart TD
    I["Se necesita liberar tiempo"] --> T{"¿De qué se trata?"}
    T -->|Un rato de un día| BL["Bloqueo: profesional, fecha,<br/>desde, hasta y motivo"]
    T -->|Varios días| LI["Licencia: profesional,<br/>desde, hasta y motivo"]
    T -->|Un consultorio o la sede| CO["Bloqueo de recurso"]
    T -->|Todo el centro| FE["Feriado en el calendario"]

    BL --> CHK{"¿Hay turnos<br/>en ese rango?"}
    LI --> CHK
    CO --> CHK
    FE --> CHK

    CHK -->|No| APL["Se aplica: esas franjas<br/>dejan de ofrecerse"]
    CHK -->|Sí| LIS["Se muestra la lista de turnos afectados<br/>y se pide qué hacer con cada uno"]
    LIS --> DEC{"Por cada turno"}
    DEC --> REP["Reprogramar"]
    DEC --> CAN["Cancelar por la institución"]
    DEC --> MAN["Dejarlo: el bloqueo no lo pisa"]
    REP --> APL
    CAN --> APL
    MAN --> APL

    APL --> AUD["Queda en audit_log"]

    classDef aud fill:#FFF1E6,stroke:#B8520A,color:#B8520A
    class APL,AUD aud
```

**El bloqueo nunca borra turnos en silencio.** Si hay turnos adentro, alguien decide qué hacer con cada uno: es gente esperando una atención.

## Quién puede qué

| Acción | Dirección | Administración / Recepción | Profesional |
|---|---|---|---|
| Bloquear su propia agenda | — | — | Sí |
| Bloquear la agenda de otro | Sí | Sí | No |
| Cargar licencias | Sí | Sí | No |
| Bloquear consultorio o sede | Sí | Sí | No |
| Editar el calendario de feriados | Sí | Sí | No |

## Auditoría

Alta y baja de bloqueos, licencias y feriados, con el rango y el motivo. Y los turnos que se reprogramaron o cancelaron por el bloqueo.

## Reglas de `CLAUDE.md` que aplican

- **6** — quitar un bloqueo lo marca, no lo borra.
- **11** — el calendario de feriados es configuración de cada institución: hay feriados provinciales y días no laborables propios.

## Relacionados

[04 — Agendar un turno](04-agendar-un-turno.md) · [06 — Ausente, cancelación y reprogramación](06-ausente-cancelacion-reprogramacion.md)
