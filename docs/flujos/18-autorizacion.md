# 18 — Autorización de la obra social

El pedido que la clínica le hace a una obra social para poder cobrar la atención de un paciente en un período. Es lo que hace cobrar a la institución, y el dolor más fácil de vender.

Reemplaza a la "App de Conexión" de AppSheet.

## Estados

```mermaid
stateDiagram-v2
    direction LR
    [*] --> Solicitada: administración pide a la obra social

    Solicitada --> Autorizada: la obra social aprueba
    Solicitada --> NoAutorizada: la obra social rechaza

    Autorizada --> Presentada: se presenta la facturación del período
    Presentada --> Cobrada: entra el pago

    NoAutorizada --> Solicitada: se vuelve a pedir con más respaldo
    NoAutorizada --> [*]: se pasa a particular o se da de baja

    Cobrada --> [*]

    note right of Autorizada
        Trae cantidad autorizada
        y fecha de vencimiento.
        Avisa 15 días antes.
    end note

    note right of Presentada
        A partir de acá, el período
        de facturación se cierra.
    end note
```

## Ciclo completo

```mermaid
flowchart TD
    P["Paciente en tratamiento<br/>con obra social"] --> R["¿Qué prestación corresponde?<br/>(ver flujo 17)"]
    R --> ND{"¿La regla dio<br/>No definido?"}
    ND -->|Sí| AL["Aviso: hay que resolverlo<br/>antes de facturar"]
    ND -->|No| SOL["Administración solicita<br/>la autorización"]
    SOL --> AUD1["Queda en audit_log"]
    AUD1 --> ESP["Esperando respuesta"]

    ESP --> RTA{"Respuesta"}
    RTA -->|Autoriza| AUT["Autorizada: cantidad y vencimiento"]
    RTA -->|Rechaza| NOA["No autorizada, con motivo"]

    AUT --> CON["Se consume con cada turno atendido<br/>Sesión N de M"]
    CON --> VEN{"¿Se vence o<br/>se agota?"}
    VEN -->|Quedan 15 días| AV["Aviso en Panel de turnos<br/>y en Autorizaciones"]
    AV --> REN["Se pide renovación"]
    REN --> SOL

    CON --> PRE["Fin de mes: se presenta<br/>con la prefacturación"]
    PRE --> COB["Se registra el cobro"]
    COB --> AUD2["Queda en audit_log"]

    NOA --> DEC{"¿Qué se hace?"}
    DEC -->|Reclamar| SOL
    DEC -->|Pasa a particular| PART["Se cobra al paciente<br/>(ver flujo 20)"]

    classDef aud fill:#FFF1E6,stroke:#B8520A,color:#B8520A
    class AUD1,AUD2 aud
```

## Qué tiene una autorización

| Campo | Nota |
|---|---|
| Paciente y obra social | Del padrón de la institución |
| Período | El mes que cubre |
| Prestación | Sale de las reglas de cobertura, o de una excepción registrada (flujo 17) |
| Cantidad autorizada | Sesiones o días |
| Cantidad consumida | Se calcula de los turnos atendidos, no se carga a mano |
| Vencimiento | Dispara el aviso de 15 días |
| Número de la obra social | Como lo devuelve la financiadora |
| Estado e historial | Cada cambio con fecha, usuario y motivo |

El consumo **se calcula**, no se escribe: era una de las fuentes de error de las planillas.

## Caminos que la base impide

```mermaid
flowchart LR
    A["Autorización de un período cerrado"] -->|se intenta cambiar| B["🔒 Rechazado"]
    C["Se intenta pasar de Solicitada a Cobrada"] --> D["🔒 Rechazado: falta Autorizada y Presentada"]
    E["Se intenta consumir más de lo autorizado"] --> F["⚠ Se permite, pero queda marcado<br/>como exceso a resolver"]

    classDef bloq fill:#FDECEA,stroke:#B42318,color:#B42318
    classDef warn fill:#FEF6D8,stroke:#8A6100,color:#8A6100
    class B,D bloq
    class F warn
```

Exceder lo autorizado no se bloquea: en la práctica pasa, y esconderlo sería peor que mostrarlo. Se marca para que alguien lo resuelva.

## Quién puede qué

| Acción | Dirección | Administración | Profesional | Enfermería |
|---|---|---|---|---|
| Ver autorizaciones | Sí | Sí | Las de sus pacientes | No |
| Solicitar y avanzar estados | Sí | Sí | No | No |
| Registrar el cobro | Sí | Sí | No | No |

## Auditoría

Cada cambio de estado, con el motivo cuando lo hay, y el registro del cobro.

## Reglas de `CLAUDE.md` que aplican

- **1** — la autorización es de una institución; las FK compuestas impiden cruzar padrones.
- **7** — todos los cambios de estado van a `audit_log`.
- **10** — avanzar de estado es una operación del servidor.
- **11** — obras sociales, prestaciones y reglas de cobertura son configuración, no `if` en el código.

## En camino

- Validación de afiliados y autorizaciones contra el canal digital de cada financiadora — etapa 8.6, empezando por la más usada en Mendoza.
