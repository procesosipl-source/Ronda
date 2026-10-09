# 24 — Cargar y ver documentos

Subir un archivo a la ficha de un paciente (un consentimiento firmado en papel, un estudio, la orden de la obra social, una foto del DNI) y abrirlo después. Se hace desde la PC o **desde el celular, sacando una foto**.

Un documento puede ser **parte de la historia clínica** o **administrativo**. Esto no lo decide quien lo sube: lo define el **tipo de documento**, que configura cada institución.

## Subir un documento

```mermaid
flowchart TD
    S["Subir documento,<br/>desde la ficha del paciente"] --> P{"¿Puede subir a este paciente?"}
    P -->|No| BP["🔒 Rechazado"]
    P -->|Sí| F["Elige el archivo, lo arrastra<br/>o saca una foto"]
    F --> V{"¿PDF o imagen,<br/>hasta 10 MB?"}
    V -->|No| F
    V -->|Sí| T["Elige el tipo de documento<br/>(catálogo de la institución)"]
    T --> D["Carga la fecha del documento:<br/>la que figura en el papel"]
    D --> FD{"¿Es posterior a hoy?"}
    FD -->|Sí| D
    FD -->|No| G["Se guarda en almacenamiento privado,<br/>con quién lo subió y cuándo"]
    G --> AUD["Queda en audit_log"]
    AUD --> HC{"¿El tipo forma parte<br/>de la historia clínica?"}
    HC -->|Sí| EN["Aparece en la historia clínica<br/>en el orden de su fecha"]
    HC -->|No| AD["Queda solo en la pestaña Documentos"]

    classDef aud fill:#FFF1E6,stroke:#B8520A,color:#B8520A
    classDef bloq fill:#FDECEA,stroke:#B42318,color:#B42318
    class G,AUD aud
    class BP bloq
```

**Dos fechas, dos significados.** La *fecha del documento* es la que figura en el papel (un estudio del 6 de octubre que se escanea el 9). Con esa fecha se ordena en la historia clínica. La *fecha de carga* la pone el sistema y no se edita.

## Ver un documento

```mermaid
flowchart TD
    A["Toca un documento"] --> T{"¿Forma parte de la<br/>historia clínica?"}
    T -->|No| VER["Se abre el visor"]
    T -->|Sí| R{"¿Su rol tiene acceso a<br/>la historia clínica de este paciente?"}
    R -->|No| NO["🔒 Rechazado"]
    R -->|Sí| LOG["Queda en audit_log"]
    LOG --> VER
    NO --> LOGD["El intento queda como acceso denegado"]
    VER --> URL["El archivo se abre con un enlace firmado<br/>que vence en minutos"]
    URL --> DESC["Puede descargarlo"]

    classDef aud fill:#FFF1E6,stroke:#B8520A,color:#B8520A
    classDef bloq fill:#FDECEA,stroke:#B42318,color:#B42318
    class LOG,LOGD aud
    class NO bloq
```

Quien no puede ver los documentos clínicos ve un aviso: "Hay 3 documentos de la historia clínica que tu rol no puede ver". No se ocultan como si no existieran.

## Anular

Un documento **no se borra**. Si se cargó por error (otro paciente, archivo equivocado), se **anula** con un motivo obligatorio:

- queda tachado en la lista, con quién lo anuló, cuándo y por qué;
- deja de incluirse en el PDF de la historia clínica;
- el archivo se conserva.

Pueden anular quien lo subió y Dirección.

## Tipos de documento

Catálogo cerrado por institución (regla 11). Cada tipo tiene un nombre y la opción **"Forma parte de la historia clínica"**. Ejemplo de la demo:

| Tipo | Historia clínica |
|---|---|
| Consentimiento informado | Sí |
| Informe de admisión | Sí |
| Estudio o análisis | Sí |
| Informe de interconsulta | Sí |
| Orden de la obra social | No |
| DNI o credencial | No |
| Otro | No |

Cambiar la opción de un tipo cambia quién ve **todos** los documentos de ese tipo, incluidos los ya cargados. Por eso solo lo hace Dirección y queda en auditoría.

## Quién puede qué

| Acción | Dirección | Profesional (equipo tratante) | Enfermería (internados) | Administración |
|---|---|---|---|---|
| Subir un documento administrativo | Sí | Sí | Sí | Sí |
| Subir un documento de la HC | Sí | Sí | Sí | **No** |
| Ver un documento administrativo | Sí | Sí | Sí | Sí |
| Ver un documento de la HC | Sí | Sí | Sí | **No** |
| Anular | Sí | Solo los que subió | Solo los que subió | Solo los que subió |
| Configurar los tipos | Sí | No | No | No |

## Qué guarda cada documento

| Dato | Nota |
|---|---|
| Paciente | Con clave compuesta `(institution_id, id)` |
| Tipo | Del catálogo `document_type`, que dice si forma parte de la HC |
| Título | La descripción, o el nombre del tipo si no se cargó |
| Archivo | Ruta en un bucket privado de Storage, nombre original, tipo y tamaño |
| Fecha del documento | La que figura en el papel. No puede ser futura |
| Subido por / subido el | Los pone el servidor |
| Anulado | Fecha, usuario y motivo (`deleted_at`, `deleted_by` y motivo) |

## Auditoría

Subir, abrir un documento de la historia clínica, anular, cambiar la configuración de un tipo y **todo intento denegado**.

## Reglas de `CLAUDE.md` que aplican

- **2 y 3** — quién ve qué se resuelve en RLS, también en las políticas del bucket de Storage. Administración no puede abrir un documento clínico aunque tenga el enlace.
- **6** — anular es borrado lógico: el archivo y el registro se conservan.
- **7** — abrir un documento clínico es tan sensible como abrir la historia clínica.
- **11** — qué tipos existen y cuáles forman parte de la HC es configuración, no código.

## Relacionados

[10 — Consultar y exportar la historia clínica](10-consultar-y-exportar-hc.md) · [22 — Acceso y auditoría](22-acceso-y-auditoria.md) · [01 — Alta de paciente](01-alta-de-paciente.md)
