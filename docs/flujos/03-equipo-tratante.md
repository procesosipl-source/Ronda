# 03 — Armado y cambio del equipo tratante

Quiénes son los profesionales asignados a un paciente. **Es lo que define quién ve su historia clínica**, así que cambiarlo cambia permisos: no es un dato administrativo más.

Reemplaza a "profesionales como columnas del paciente" de la app AppSheet.

## Flujo

```mermaid
flowchart TD
    A["Paciente pasa a Admisión"] --> AS["Se asigna el equipo:<br/>profesional, rol y fecha de inicio"]
    AS --> ROL{"Rol en el equipo"}
    ROL --> REF["Referente: conduce el tratamiento"]
    ROL --> TRA["Tratante: atiende regularmente"]
    ROL --> INT["Interconsulta: interviene puntualmente"]

    REF --> EF["Efecto inmediato:<br/>ese profesional ya ve la historia clínica"]
    TRA --> EF
    INT --> EF
    EF --> AUD["Queda en audit_log"]

    AUD --> CAM{"¿Cambia el equipo?"}
    CAM -->|Entra alguien| AS
    CAM -->|Sale alguien| SAL["Se cierra su vigencia: hasta = hoy<br/>No se borra la fila"]
    SAL --> PIE["Desde ese día deja de ver<br/>la historia clínica"]
    PIE --> AUD2["Queda en audit_log"]

    SAL -.-> HIST["Las evoluciones que escribió<br/>siguen en la historia clínica, con su firma"]

    B["Se intenta borrar un integrante"] --> BLO["🔒 Rechazado: se cierra la vigencia"]
    B2["Profesional fuera del equipo<br/>intenta abrir la historia clínica"] --> BLO2["🔒 Rechazado por RLS<br/>y registrado como acceso denegado"]

    classDef aud fill:#FFF1E6,stroke:#B8520A,color:#B8520A
    classDef bloq fill:#FDECEA,stroke:#B42318,color:#B42318
    class EF,AUD,SAL,AUD2 aud
    class BLO,BLO2 bloq
```

## Vigencia

Cada integrante tiene `desde` y `hasta`.

- **Sin `hasta`** → integra el equipo hoy y ve la historia clínica.
- **Con `hasta`** → dejó de integrarlo **ese mismo día**. No ve la historia clínica desde entonces.

Guardar la vigencia en vez de borrar la fila permite responder después: *¿quién tenía acceso a esta historia clínica en marzo?* Es lo primero que se pregunta ante un incidente.

## Efecto en permisos

```mermaid
flowchart LR
    P["Profesional"] --> Q{"¿Integra el equipo<br/>tratante hoy?"}
    Q -->|Sí| V["Ve la ficha, la historia clínica<br/>y puede escribir evoluciones"]
    Q -->|No| N["No ve al paciente<br/>ni aparece en su lista"]
```

Enfermería es la excepción: ve a los **internados**, integre o no el equipo, porque los cuida durante la guardia.

## Quién puede qué

| Acción | Dirección | Administración | Profesional | Enfermería |
|---|---|---|---|---|
| Ver el equipo | Sí | Sí | Sí, si lo integra | Sí, de internados |
| Agregar o quitar integrantes | Sí | Sí | No | No |

Un profesional no se agrega a sí mismo a un equipo: sería darse acceso a una historia clínica.

## Auditoría

Alta y baja de cada integrante, con el paciente, el profesional, el rol y la fecha. Es una de las entradas más consultadas, porque es un cambio de permisos.

## Reglas de `CLAUDE.md` que aplican

- **2 y 3** — el acceso a la historia clínica se aplica en RLS cruzando con esta tabla, no ocultando botones.
- **6** — quitar cierra la vigencia; no borra.
- **7** — es un cambio de permisos: va a `audit_log`.

## Relacionados

[08 — Evolución diaria](08-evolucion-diaria.md) · [22 — Acceso y auditoría](22-acceso-y-auditoria.md)
