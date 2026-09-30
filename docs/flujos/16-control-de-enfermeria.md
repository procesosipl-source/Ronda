# 16 — Control de enfermería

El registro de signos vitales y del estado general del paciente internado. Lo hace enfermería, desde el celular, varias veces por turno.

## Flujo

```mermaid
flowchart TD
    T["Ronda de control"] --> P["Enfermería abre el paciente<br/>desde Internación o desde su ficha"]
    P --> V["Carga los signos vitales:<br/>TA, temperatura, frecuencia cardíaca,<br/>saturación"]
    V --> N["Agrega la nota de enfermería:<br/>cómo pasó el turno, sueño,<br/>alimentación, conducta"]
    N --> F["Firma el control"]
    F --> AUD["Queda en audit_log"]
    AUD --> HC["Aparece en la historia clínica,<br/>con la franja de Enfermería"]

    HC --> AL{"¿Algún valor<br/>fuera de rango?"}
    AL -->|Sí| AVI["Se marca el valor<br/>y se avisa a la guardia"]
    AL -->|No| FIN["Queda registrado"]

    B["Se intenta editar<br/>un control ya firmado"] --> BLO["🔒 Rechazado:<br/>se corrige por adenda"]
    B2["Enfermería abre un paciente<br/>que no está internado"] --> BLO2["🔒 Rechazado y registrado<br/>como acceso denegado"]

    classDef aud fill:#FFF1E6,stroke:#B8520A,color:#B8520A
    classDef bloq fill:#FDECEA,stroke:#B42318,color:#B42318
    class F,AUD,AVI aud
    class BLO,BLO2 bloq
```

## Qué se registra

| Dato | Nota |
|---|---|
| Tensión arterial | Texto: "120/80" |
| Temperatura | Número, en grados |
| Frecuencia cardíaca | Número |
| Saturación de oxígeno | Porcentaje |
| Nota | Texto libre: es contenido clínico |
| Quién y cuándo | Usuario y hora real |

Los rangos que disparan el aviso son **configuración de la institución**: no todos los centros usan los mismos umbrales, y en salud mental el perfil de pacientes varía.

## Un control es una evolución

El control firmado entra en la historia clínica como cualquier otra evolución, con la franja de Enfermería. Sigue las mismas reglas del flujo [08](08-evolucion-diaria.md): una vez firmado, no se modifica; las correcciones van por adenda.

Esto es a propósito. En la app AppSheet los controles vivían en tablas separadas que un script consolidaba después en una "historia clínica unificada", y quedaban filas sin origen claro. Acá hay **un solo modelo de registro clínico**.

## Quién puede qué

| Acción | Dirección | Profesional | Enfermería | Administración |
|---|---|---|---|---|
| Ver los controles | Sí | Sus pacientes | Sí, de internados | **No** |
| Registrar un control | No | No | **Sí** | No |
| Agregar adenda a su control | No | No | Sí, al propio | No |

## Auditoría

Cada control firmado, y los avisos por valores fuera de rango.

## Reglas de `CLAUDE.md` que aplican

- **5** — el control firmado no se modifica.
- **7** — va a `audit_log`.
- **11** — los rangos de alerta son configuración, no están en el código.

## Relacionados

[15 — Ronda de administración](15-ronda-de-administracion.md) · [08 — Evolución diaria](08-evolucion-diaria.md) · [10 — Consultar y exportar la historia clínica](10-consultar-y-exportar-hc.md)
