# Ronda — Flujos de los procesos de la clínica

> Un archivo por proceso. Cada uno tiene el diagrama y, al pie, quién lo hace, qué queda auditado y qué reglas de `CLAUDE.md` lo tocan.
>
> **Para qué sirven.** No son dibujos: de acá salen los estados, las transiciones válidas y los bloqueos que después se escriben como restricciones y triggers en la base. Sirven también para discutir el proceso con la clínica **antes** de programarlo.
>
> **Cómo verlos.** Los diagramas están en Mermaid. Se ven solos en GitHub y en la vista previa de VS Code (`Ctrl+Shift+V`). No hace falta instalar nada.

## Cómo leer los diagramas

| Señal | Significa |
|---|---|
| Carriles / prefijo de rol | Quién hace ese paso. Si no dice rol, lo hace el sistema |
| Caja **naranja** | El paso escribe en `audit_log`. No se puede borrar |
| Caja **roja** con candado | Camino que la base **impide**. No es un "no deberías": es un error de la base |
| Rombo | Decisión del sistema, según configuración de la institución |
| Línea punteada | Todavía no construido. Dice en qué etapa llega |

## Índice

### Pacientes
| # | Proceso | Etapa |
|---|---|---|
| [01](01-alta-de-paciente.md) | Alta de paciente y admisión | 1 |
| [02](02-ciclo-de-vida-del-paciente.md) | Ciclo de vida del paciente: alta clínica, reingreso y baja | 1 |
| [03](03-equipo-tratante.md) | Armado y cambio del equipo tratante | 1 |
| [24](24-cargar-y-ver-documentos.md) | Cargar y ver documentos: tipos, permisos y anulación | 1 (en la HC: 4) |

### Agenda
| # | Proceso | Etapa |
|---|---|---|
| [04](04-agendar-un-turno.md) | Agendar un turno | 3 |
| [05](05-dia-del-turno.md) | **El día del turno**: confirmación → llegada → consulta → atendido | 3 |
| [06](06-ausente-cancelacion-reprogramacion.md) | Ausente, cancelación y reprogramación | 3 |
| [07](07-bloqueos-y-feriados.md) | Bloqueo de agenda, licencias y feriados | 3 |

### Clínico
| # | Proceso | Etapa |
|---|---|---|
| [08](08-evolucion-diaria.md) | **Evolución diaria**: borrador → firmada → adenda | 4 |
| [09](09-encuentro-grupal.md) | Encuentro grupal: asistencia y evolución grupal | 4 |
| [10](10-consultar-y-exportar-hc.md) | Consultar y exportar la historia clínica | 4 |

### Internación, enfermería y medicación
| # | Proceso | Etapa |
|---|---|---|
| [11](11-ingreso-a-internacion.md) | Ingreso a internación y asignación de cama | 5 |
| [12](12-dias-autorizados-y-prorroga.md) | Días autorizados, vencimiento y prórroga | 5 |
| [13](13-egreso-de-internacion.md) | Egreso y alta de internación | 5 |
| [14](14-esquema-de-medicacion.md) | **Esquema de medicación**: alta, cambio versionado y suspensión | 5 |
| [15](15-ronda-de-administracion.md) | **Ronda de administración** de medicación | 5 |
| [16](16-control-de-enfermeria.md) | Control de enfermería (signos vitales) | 5 |

### Coberturas y facturación
| # | Proceso | Etapa |
|---|---|---|
| [17](17-que-prestacion-se-presenta.md) | Qué prestación se presenta: reglas, "No definido" y excepción | 1 |
| [18](18-autorizacion.md) | **Autorización**: Solicitada → Autorizada → Presentada → Cobrada | 2 |
| [19](19-prefacturacion-y-cierre.md) | Prefacturación mensual y cierre de período | 2 |
| [20](20-cobro-particular-y-copago.md) | Cobro particular y copago | 2 |

### Transversales
| # | Proceso | Etapa |
|---|---|---|
| [21](21-usuarios-y-permisos.md) | Alta de usuario, membresía y cambio de permisos | 0 |
| [22](22-acceso-y-auditoria.md) | Acceso a datos sensibles y auditoría | 0 |
| [23](23-alta-de-institucion.md) | Alta de una institución nueva | 7 |

## Roles que aparecen

Dirección · Coordinación · Administración · Recepción · Profesional (psicología, psiquiatría, trabajo social, nutrición) · Enfermería.

Ver el glosario completo en `CLAUDE.md`.
