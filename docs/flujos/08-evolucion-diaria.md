# 08 — Evolución diaria

El registro clínico que escribe un profesional sobre un paciente. Es el proceso más delicado del sistema: **una evolución firmada no se modifica ni se borra nunca**. Las correcciones se agregan como adenda, a la vista.

Esto no es una convención del equipo: es un requisito legal (Ley 26.529 y Ley 27.706) y lo impone un trigger en la base.

## Estados

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Borrador: el profesional empieza a escribir

    Borrador --> Borrador: solo su autor la edita
    Borrador --> Firmada: firma
    Borrador --> [*]: su autor la descarta

    Firmada --> Firmada: no se modifica nunca

    state "Firmada + adenda" as ConAdenda
    Firmada --> ConAdenda: su autor agrega una adenda
    ConAdenda --> ConAdenda: puede haber más de una

    note right of Borrador
        Solo la ve su autor.
        No cuenta como evolución hecha.
    end note

    note right of Firmada
        Queda cerrada: autor, matrícula,
        fecha, hora y huella del texto.
    end note
```

## El flujo completo

```mermaid
flowchart TD
    T["Turno Atendido"] --> AV["Aviso: falta la evolución"]
    AV --> ESC["Profesional escribe la evolución"]
    ESC --> DEC{"¿Firma ahora?"}
    DEC -->|No| BOR["Queda en borrador<br/>solo la ve su autor"]
    BOR --> ESC
    DEC -->|Sí| VAL{"¿Es del equipo tratante<br/>de este paciente?"}
    VAL -->|No| NO["🔒 Rechazado y registrado<br/>como acceso denegado"]
    VAL -->|Sí| FIR["Se firma: autor, matrícula,<br/>fecha, hora y huella"]
    FIR --> AUD["Queda en audit_log"]
    AUD --> HC["Aparece en la historia clínica<br/>y el aviso desaparece"]

    HC --> ERR{"¿Hay que corregir algo?"}
    ERR -->|Sí| ADE["Se agrega una adenda<br/>debajo, con su propia firma"]
    ERR -->|Se intenta editar| BLO["🔒 El trigger lo rechaza"]
    ADE --> AUD2["Queda en audit_log"]

    classDef aud fill:#FFF1E6,stroke:#B8520A,color:#B8520A
    classDef bloq fill:#FDECEA,stroke:#B42318,color:#B42318
    class FIR,AUD,ADE,AUD2 aud
    class NO,BLO bloq
```

## Quién puede qué

| Acción | Dirección | Administración | Profesional del equipo | Otro profesional | Enfermería |
|---|---|---|---|---|---|
| Ver la evolución | Sí | **No** | Sí | No | Solo de internados |
| Escribir una evolución | No | No | Sí | No | Nota de enfermería |
| Editar un borrador | No | No | Solo el propio | No | Solo el propio |
| Firmar | No | No | Sí, la propia | No | Sí, la propia |
| Agregar adenda | No | No | Solo a la propia | No | Solo a la propia |
| Modificar una firmada | **Nadie** | **Nadie** | **Nadie** | **Nadie** | **Nadie** |

Dirección lee pero no escribe: no atiende. Administración no ve contenido clínico, y cada intento queda registrado.

## Lo que hace la base, no la pantalla

| Regla | Cómo se garantiza |
|---|---|
| Una firmada no se edita | Trigger `before update`: si la fila ya estaba firmada, error |
| Una firmada no se borra | Trigger `before delete`: error siempre |
| Un borrador lo edita solo su autor | Política RLS por `created_by` |
| Solo el equipo tratante ve la evolución | Política RLS que cruza con `care_team_member` vigente |
| La adenda no reemplaza nada | Tabla aparte (`clinical_note_addendum`) con FK a la evolución |

La huella (`hash` del texto firmado) permite mostrar en el PDF que el contenido no cambió desde la firma.

## Auditoría

Se registra: ver la evolución, firmarla, agregar adenda, exportar la historia clínica y **todo intento de acceso denegado**.

## Reglas de `CLAUDE.md` que aplican

- **5** — historia clínica inalterable. Es la razón de ser de este flujo.
- **3** — la restricción vive en el trigger y en RLS, no en la pantalla.
- **6** — un borrador descartado se marca, no se borra.
- **7** — lectura, firma, adenda y exportación van a `audit_log`.
- **10** — firmar es una operación del servidor, no varias escrituras desde el frontend.

## En camino

- Borrador armado por IA desde notas o audio — etapa 8.4. **La IA propone; el profesional revisa y firma. La IA nunca firma.**
