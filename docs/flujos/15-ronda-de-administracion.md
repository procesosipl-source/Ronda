# 15 — Ronda de administración de medicación

Lo que hace enfermería varias veces por día: recorrer los pacientes internados y registrar cada toma. Se usa **desde el celular**, con el paciente adelante.

Es el proceso con más riesgo clínico del sistema y el que más rápido tiene que ser: si registrar una toma cuesta más que anotarla en un papel, se vuelve al papel.

## Flujo

```mermaid
flowchart TD
    H["Llega el horario, por ejemplo 08:00"] --> L["La pantalla arma la lista:<br/>esquemas vigentes de pacientes internados<br/>que tienen ese horario"]
    L --> P["Enfermería va paciente por paciente"]
    P --> D{"¿Se administró?"}

    D -->|Sí| SI["Toca Administrada"]
    D -->|No| NO["Toca No administrada"]

    SI --> AT{"¿Pasaron más de 30 minutos<br/>del horario previsto?"}
    AT -->|No| AHORA["Hora de administración = ahora<br/>(un solo toque)"]
    AT -->|Sí, se registra tarde| HORA["Pide la hora en que se administró,<br/>precargada con la hora actual"]
    HORA --> VAL{"¿Es válida?<br/>no futura y no más de 2 h<br/>antes del horario previsto"}
    VAL -->|No| HORA
    VAL -->|Sí| REG
    AHORA --> REG

    REG["Se registra: hora de administración,<br/>hora de registro, usuario,<br/>esquema y dosis"]
    NO --> MOT["Pide el motivo, obligatorio:<br/>rechazo, permiso de salida,<br/>suspendida por guardia, otro"]
    MOT --> REG

    REG --> AUD["Queda en audit_log"]
    AUD --> HC["Aparece en la historia clínica<br/>del paciente"]

    PRN["Indicación a demanda"] --> CUA["Se registra cuando hace falta,<br/>sin horario fijo"]
    CUA --> REG

    B1["Se intenta registrar<br/>un esquema suspendido"] --> BL1["🔒 No aparece en la lista"]
    B2["Se intenta cambiar el esquema<br/>desde la ronda"] --> BL2["🔒 Rechazado:<br/>enfermería administra, no indica"]
    B3["Se intenta editar<br/>una toma ya registrada"] --> BL3["🔒 Rechazado: se corrige<br/>con un registro nuevo"]

    REG -.->|Se cargó mal la hora| CORR["Corregir hora: hora correcta<br/>y motivo, obligatorio"]
    CORR --> NUEVO["Registro nuevo que reemplaza al anterior.<br/>El anterior queda a la vista, tachado"]
    NUEVO --> AUD

    classDef aud fill:#FFF1E6,stroke:#B8520A,color:#B8520A
    classDef bloq fill:#FDECEA,stroke:#B42318,color:#B42318
    class REG,AUD,NUEVO aud
    class BL1,BL2,BL3 bloq
```

## Qué guarda cada toma

| Dato | Nota |
|---|---|
| Esquema | Apunta a la **versión** que estaba vigente. Si después se cambia, este registro no se mueve |
| Fecha y horario previsto | 08, 12, 16, 20, 22, o el que tenga el esquema. Vacío en las tomas a demanda |
| Hora de administración | Cuándo se le dio la medicación al paciente. La carga enfermería: por defecto es la hora actual |
| Hora de registro | Cuándo se cargó en el sistema. La pone el servidor y **no se edita** |
| Estado | Administrada / No administrada |
| Motivo | Obligatorio si no se administró |
| Quién | El usuario, nunca una cuenta compartida |
| Reemplaza a | Solo en una corrección: la toma que corrige, con el motivo |

Hay **tres horas** y cada una dice algo distinto:

- **Horario previsto → hora de administración:** si las rondas se hacen a horario.
- **Hora de administración → hora de registro:** si se registra en el momento o al final del turno. Una toma dada a las 08:05 y cargada a las 09:40 es válida, pero el sistema lo muestra: "Administrada 08:05 · registrada 09:40".

## Registrar tarde

Pasa todos los días: la enfermera da la medicación y la carga después. Para que eso no obligue a mentir la hora:

- Dentro de los 30 minutos del horario previsto, un toque registra la toma con la hora actual. Es el caso normal y tiene que ser rápido.
- Pasados los 30 minutos, la toma aparece como **Atrasada** y el botón pide la hora en que se administró, precargada con la hora actual.
- En cualquier momento, "Otra hora" abre el mismo selector.
- La hora no puede ser futura ni anterior a 2 horas antes del horario previsto. Fuera de ese rango, lo más probable es un error de carga.
- Se puede registrar desde una hora antes del horario previsto. Antes de eso, el botón aparece deshabilitado ("Desde las 07:00").

## Corregir una hora mal cargada

Una toma registrada no se edita. **Corregir hora** pide la hora correcta y un motivo, y crea un registro nuevo que reemplaza al anterior. El anterior no desaparece: queda tachado, con quién lo corrigió. Las dos acciones quedan en auditoría.

Corregir el **estado** (marcar como no administrada una que se registró como administrada, o al revés) sigue el mismo criterio, pero queda para cuando se construya el módulo: en la demo solo se corrige la hora.

## Por qué cuentas individuales

`contexto-proyecto.md` §11 lo fija como decisión comercial: **se cobra por profesional que atiende, nunca por usuario**. Enfermería no paga. Si se cobrara por usuario, el incentivo sería compartir la cuenta de enfermería, y entonces "quién administró" dejaría de significar nada. La auditoría de medicación depende de esto.

## No administrada no es un error

Que un paciente rechace la medicación es información clínica, no una falla de carga. Por eso se registra con motivo, se ve en la historia clínica y llega al médico que indicó.

## Quién puede qué

| Acción | Dirección | Psiquiatría | Enfermería | Administración |
|---|---|---|---|---|
| Ver la ronda del día | Sí | Sí | Sí | **No** |
| Registrar una toma | Sí | No | **Sí** | No |
| Registrar una toma a demanda | Sí | No | **Sí** | No |
| Corregir la hora de una toma | Sí | No | **Sí** | No |
| Cambiar el esquema | Sí | Sí | **No** | No |

## Auditoría

Cada toma registrada, con esquema, estado, motivo, hora de administración, hora de registro y usuario. Cada corrección, con la hora anterior, la nueva y el motivo. Es una tabla de solo inserción: un error se corrige agregando un registro, no editando el anterior.

## Reglas de `CLAUDE.md` que aplican

- **3** — que enfermería no vea el botón de editar esquemas no alcanza: la acción está prohibida en el servidor.
- **5** — criterio de registro clínico: lo registrado no se pisa.
- **7** — cada administración va a `audit_log`.
- **10** — registrar una administración es una operación del servidor, no varias escrituras sueltas.

## Relacionados

[14 — Esquema de medicación](14-esquema-de-medicacion.md) · [16 — Control de enfermería](16-control-de-enfermeria.md) · [11 — Ingreso a internación](11-ingreso-a-internacion.md)
