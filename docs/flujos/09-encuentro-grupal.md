# 09 — Encuentro grupal

Un grupo o taller estable (por ejemplo, grupo DBT de los martes) tiene **encuentros**. En cada encuentro se toma asistencia y se registra qué se trabajó.

Reemplaza a "grupos como columnas" de la app AppSheet (`GRUPO DBT Martes 18 hs`…), que hacía imposible agregar un grupo sin tocar la estructura.

## Modelo

```mermaid
flowchart LR
    AG["Actividad grupal<br/>nombre, profesional, día y hora"] --> IN["Inscripción<br/>paciente ↔ actividad, con vigencia"]
    AG --> EN["Encuentro<br/>una fecha concreta"]
    EN --> AS["Asistencia<br/>una fila por paciente"]
    AS --> EV["Evolución grupal"]
```

Agregar un grupo nuevo es agregar una fila, no una columna.

## Flujo del encuentro

```mermaid
flowchart TD
    P["Llega el día del encuentro"] --> L["Se abre con los inscriptos vigentes<br/>ya listados"]
    L --> MAR["El coordinador marca presente<br/>o ausente a cada uno"]
    MAR --> MASA["Puede marcar a todos presentes<br/>y corregir las excepciones"]
    MASA --> TEMA["Carga el tema trabajado<br/>y la observación del grupo"]
    TEMA --> FIR{"¿Firma el encuentro?"}
    FIR -->|No| BOR["Queda en borrador"]
    BOR --> MAR
    FIR -->|Sí| GEN["Se firma"]
    GEN --> EVO["Genera una evolución por cada<br/>paciente presente, en su historia clínica"]
    EVO --> AUD["Queda en audit_log"]

    EVO -.-> IND["Si hace falta, el profesional agrega<br/>después una nota individual"]

    B["Se intenta editar<br/>un encuentro ya firmado"] --> BLO["🔒 Rechazado: se corrige por adenda"]
    B2["Se intenta marcar asistencia<br/>de alguien no inscripto"] --> BLO2["🔒 Rechazado: primero se lo inscribe"]

    classDef aud fill:#FFF1E6,stroke:#B8520A,color:#B8520A
    classDef bloq fill:#FDECEA,stroke:#B42318,color:#B42318
    class GEN,EVO,AUD aud
    class BLO,BLO2 bloq
```

La carga masiva con corrección individual se conserva a propósito de la app AppSheet: es lo que hace que tomar asistencia de un grupo de quince personas lleve segundos.

## Por qué genera una evolución por paciente

La historia clínica es **por paciente**. Si el encuentro grupal quedara solo en el grupo, la historia clínica de cada uno tendría un agujero los martes. Al firmar, cada presente recibe en su historia clínica una evolución de disciplina "Grupal", con el tema y la observación, firmada por el coordinador.

Esas evoluciones siguen las mismas reglas del flujo [08](08-evolucion-diaria.md): firmadas, no se modifican.

## Quién puede qué

| Acción | Dirección | Administración | Coordinador del grupo | Otro profesional |
|---|---|---|---|---|
| Ver la actividad y sus inscriptos | Sí | Sí | Sí | Si atiende a algún inscripto |
| Inscribir o dar de baja pacientes | Sí | Sí | Sí | No |
| Tomar asistencia y firmar | No | No | Sí | No |
| Ver las evoluciones generadas | Sí | **No** | Sí | Solo las de sus pacientes |

## Auditoría

Firma del encuentro, evoluciones generadas, e inscripciones y bajas del grupo.

## Reglas de `CLAUDE.md` que aplican

- **5** — el encuentro firmado y sus evoluciones no se modifican.
- **6** — dar de baja a un inscripto cierra su vigencia.
- **11** — las actividades grupales son datos, no código.

## Relacionados

[08 — Evolución diaria](08-evolucion-diaria.md) · [10 — Consultar y exportar la historia clínica](10-consultar-y-exportar-hc.md)
