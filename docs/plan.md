# Ronda — Plan de trabajo semanal

> Creado el 25 de noviembre de 2026. Se revisa cada viernes.
> Primer cliente previsto: **Clínica Di Ferro**, la institución que usa la app AppSheet principal. Interna pacientes.
> Orden de los módulos: **Agenda → Historia clínica → Coberturas → Internación** ([ADR 0004](decisiones/0004-orden-de-construccion-para-di-ferro.md)).

## Supuestos

- **Dedicación:** 2 horas por día hábil, unas **10 horas por semana**, una persona trabajando con Claude Code.
- **Cada semana termina con algo que se puede mostrar** ("Demo del viernes"). Si una semana no llega, la demo se achica, pero no se saltea. Se termina lo empezado antes de abrir algo nuevo.
- **Pausa de fin de año:** se cuentan 2 semanas sin avance entre diciembre y enero.
- **Margen:** las fechas de los hitos ya llevan un 20 % extra para imprevistos. Las semanas de la tabla no.
- La semana 1 empieza el **lunes 30 de noviembre de 2026**.

## Cómo se trabaja cada semana

1. **Lunes:** se elige la tarea de la semana de esta lista y se arma el plan corto con Claude.
2. **Martes a jueves:** se construye, con tests.
3. **Viernes:** se prueba la demo, se hace el commit y el push, y se marca la semana en esta lista. Si algo se corrió, se ajustan las semanas siguientes.

Regla práctica: **ninguna sesión termina sin push.** El código que queda solo en la computadora no existe.

## Semana 0 — Ordenar (esta semana)

- [x] Subir a GitHub todo lo pendiente. La carpeta de trabajo es `C:\Proyectos\IPL\Ronda`; la del Escritorio quedó vieja y se puede borrar.
- [x] Decidir el orden de los módulos (ADR 0004).
- [x] Confirmar si Di Ferro interna pacientes: sí.
- [ ] Reactivar `ronda-dev` en Supabase.

## Fase A — Fundaciones (semanas 1 a 5)

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| 1 | El esqueleto ya está hecho (19/10/2026). Falta conectarlo: Docker Desktop, vincular la Supabase CLI a `ronda-dev`, importar el repo en Vercel con sus variables, y pantalla de ingreso con el logo | Un link en internet que abre la pantalla de ingreso de Ronda |
| 2 | Inicio de sesión real: entrar, salir y recuperar la contraseña | Entrar con un usuario de prueba y salir |
| 3 | Instituciones, sedes, membresías y roles en la base, con RLS, tests de aislamiento y dos instituciones ficticias | Un usuario de la institución A no ve nada de la B (tests en verde) |
| 4 | Auditoría (`audit_log`), elegir institución al entrar, menú según el rol | Entrar como Recepción y como Dirección: cada uno ve su menú, y Auditoría muestra los ingresos |
| 5 | Menú en tres bloques, versión para celular, invitar usuarios y asignarles un rol. Módulos activables por institución (ADR 0003) | Dirección invita a una persona nueva y le da un rol desde el celular |

## Fase B — Datos maestros (semanas 6 a 9)

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| 6 | Pacientes: alta, listado y búsqueda. DNI único por institución | Dar de alta pacientes ficticios y encontrarlos |
| 7 | Ficha del paciente: datos personales, estados con historial y motivo, referentes | Pasar un paciente de Admisión a En tratamiento y ver el historial |
| 8 | Obras sociales (catálogo) y cobertura del paciente con número de afiliado | Cargar la cobertura de un paciente desde la lista de obras sociales |
| 9 | Profesionales: disciplina, matrícula, horarios. Equipo tratante con vigencia | Asignar profesionales a un paciente |

**Hito 1 (fines de febrero de 2027):** Ronda real con usuarios, roles, pacientes y profesionales. Ya se puede mostrar a Di Ferro funcionando, aunque todavía no reemplace nada.

## Fase C — Módulos (semanas 10 a 28)

### Agenda y turnos (semanas 10 a 15)

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| 10 | Disponibilidad calculada desde los horarios del profesional | La agenda semanal armada sola |
| 11 | Nuevo turno y turnos recurrentes | Dar un turno semanal por tres meses |
| 12 | Bloqueos, feriados, cancelar y reprogramar | Bloquear un día y ver qué turnos quedan afectados |
| 13 | Panel del día de recepción (pantalla de `docs/pantallas/`) | Marcar llegada → Hacer pasar → Finalizar |
| 14 | Mi día y Sala de espera en el celular | Lo mismo desde el teléfono |
| 15 | Asistencia y ausentes, ajustes con usuarios | Registrar un ausente y verlo en la ficha |

### Registro clínico e historia clínica (semanas 16 a 21)

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| 16 | Evolución en borrador y firma (función en la base, trigger que impide modificarla) | Firmar una evolución e intentar editarla |
| 17 | Adendas y quién ve la HC según el equipo tratante | Un profesional fuera del equipo no puede abrir la HC |
| 18 | Historia clínica cronológica y auditoría de lectura | Abrir una HC y verlo en Auditoría |
| 19 | Documentos: subir, ver y anular (almacenamiento privado) | Subir una foto desde el celular a la ficha |
| 20 | Actividades grupales y encuentros con asistencia | Cargar un encuentro grupal y ver las evoluciones |
| 21 | Exportar la HC a PDF con fecha y huella | Bajar el PDF de una HC |

### Coberturas y prefacturación (semanas 22 a 28)

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| 22 | Prestaciones y tarifario con vigencias | Cambiar un precio desde una fecha y ver el historial |
| 23 | Reglas de cobertura ordenadas, con "No definido" | Ver qué prestación le toca a cada paciente |
| 24 | Autorizaciones: pedido, estados y vencimientos | Llevar una autorización de Solicitada a Autorizada |
| 25 | Tablero de autorizaciones mes por mes y alertas | El tablero con meses pasados y "A pedir" |
| 26 | Prefacturación del mes y exportación | La prefacturación de un mes, bajada a Excel |
| 27 | Cierre de período (bloquea con "No definido", queda la foto) | Cerrar un mes e intentar modificarlo |
| 28 | Importador de pacientes y autorizaciones, con reporte de conflictos | Importar un archivo de ejemplo ficticio y ver los errores |

## Fase D — Salida a producción (semanas 29 a 32)

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| 29 | Entorno de producción, backups y prueba de restauración | Restaurar un backup en una copia |
| 30 | 2FA para Dirección y Administración, vencimiento de sesiones | Entrar con doble factor |
| 31 | Alta de Di Ferro: configuración, catálogos, importación en producción | Di Ferro configurada con sus datos |
| 32 | Capacitación y uso en paralelo con AppSheet | Primer día de uso real |

**Hito 2 (septiembre de 2027 aprox.):** agenda, historia clínica y coberturas en uso en Di Ferro. Internación, enfermería y medicación siguen en AppSheet.

Se puede poner la agenda en uso real antes, hacia **mayo de 2027**, adelantando lo mínimo de esta fase (producción y backups).

## Fase E — Internación, enfermería y medicación (semanas 33 a 42)

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| 33 | Habitaciones y camas | El mapa de camas con ocupación |
| 34 | Ingreso a internación (asignar cama, días autorizados) | Internar a un paciente ficticio |
| 35 | Prórrogas y egreso | Pedir una prórroga y dar el alta |
| 36 | Esquema de medicación versionado (lo indica psiquiatría) | Cambiar una dosis y ver la versión anterior |
| 37 | Horarios de toma como filas, tomas a demanda | Un esquema con horarios fuera de los habituales |
| 38 | Ronda de administración en el celular (función en la base) | Registrar una toma desde el teléfono |
| 39 | Hora real de la toma y corrección con registro anterior visible | Corregir una hora y ver el historial |
| 40 | Controles de enfermería | Cargar signos vitales en el celular |
| 41 | Pruebas con enfermería de Di Ferro (datos ficticios) | Ajustes según lo que digan |
| 42 | Puesta en producción y uso en paralelo | Primera guardia usando Ronda |

Medicación se construye con cuidado, no rápido (riesgo clínico).

**Hito 3 (diciembre de 2027 aprox.):** Di Ferro operando completa en Ronda y AppSheet retirado, con los históricos en solo lectura.

## En paralelo, sin horas de desarrollo

- **Consulta legal** (HC digital, firma de evoluciones, datos alojados en Brasil, AAIP). Conviene empezarla en diciembre: puede frenar el Hito 2 aunque el código esté listo.
- Relevar con Di Ferro qué usan hoy, qué les molesta y qué no quieren perder.
- Pedirles un ejemplo de los archivos que usan, armado con **datos inventados** (regla 8), para diseñar el importador.

## Registro semanal

| Sem. | Fecha | Hecho | Pendiente / notas |
|---|---|---|---|
| 0 | 25/11/2026 | Plan creado. Se detectó que el esqueleto ya estaba hecho en `C:\Proyectos\IPL\Ronda`. Orden de módulos decidido (ADR 0004) | — |
| 1 | 25/11/2026 | `ronda-dev` reactivado, `.env.local`, publicado en Vercel (https://ronda-liart.vercel.app), pantalla de ingreso | Vincular la Supabase CLI (falta permiso de la cuenta personal en la organización). Docker: reinstalar como "All-users" |
| 2 | 25/11/2026 | Ingreso real, inicio protegido con Salir, recuperar contraseña, contraseña nueva de 10 caracteres o más | En el panel de Supabase: apagar el registro libre, largo mínimo 10, direcciones permitidas, usuario de prueba. Probar en el celular. Vercel Hobby no es para uso comercial: pasar a Pro antes de la Fase D |
| 3 | 26/11/2026 | Docker y Supabase local funcionando. Migración con instituciones, sedes, roles (catálogo fijo), perfiles y membresías (varios roles por persona), RLS en todas las tablas, ADR 0005. 30 tests pgTAP de aislamiento en verde. Seed con dos instituciones ficticias. Migración aplicada en `ronda-dev`. Confirmado en el panel: registro libre apagado y contraseña mínima de 10 |
| 4 | 27/11/2026 | `audit_log` de solo inserción (ni un administrador de la base la modifica), catálogo de acciones, `enter_institution` y `leave_institution` en el servidor, ADR 0006. Elegir institución al entrar, menú lateral según el rol (tabla acordada), barra superior con selector de institución, pantalla de Auditoría. 47 tests pgTAP y 39 de Vitest en verde. `npm run dev:local` para probar contra la base local | Los accesos que RLS rechaza no pueden registrarse; se registran en las funciones del servidor (ADR 0006). Íconos del menú y versión para celular: semana 5 | `ronda-dev` no tiene membresías: el usuario de prueba de la semana 2 no ve ninguna institución hasta la semana 5 (invitar usuarios). Los tests pgTAP no corren contra `ronda-dev` con `--linked`; se corren en la base local. Vitest falla si la terminal abre la carpeta como `c:\` en minúscula: correrlo desde `C:\` |
| 5 | 27/11/2026 | Módulos activables (ADR 0003 aceptado): catálogo, requisitos con alternativas, `module_enabled()`, solo IPL los cambia. Invitar usuarios (Edge Function `invite-user`), cambiar roles y dar de baja con motivo, todo en la auditoría; la institución nunca queda sin Dirección. Menú en tres bloques con íconos, versión para celular, Configuración con Usuarios y Módulos. 84 tests pgTAP y 48 de Vitest en verde | Mails de invitación en inglés y con límite de pocos por hora (Supabase por defecto): pasar a un servicio de mails con el dominio de IPL antes de la Fase D. Reinvitar a alguien que no aceptó todavía no reenvía el mail |
| 6 | 30/11/2026 | Pacientes: estados configurables por institución (cinco por defecto), historial de estados de solo inserción, alta con `create_patient` en el servidor (queda en Preadmisión y en la auditoría), documento con tipo y único por institución, nombre elegido y sexo registral opcionales, búsqueda sin acentos por nombre o documento. Pantallas: lista con buscador, alta con aviso de documento repetido y ficha mínima. 110 tests pgTAP y 62 de Vitest | Profesional y Enfermería todavía no ven pacientes: se abre con el equipo tratante (semana 9) y la internación (semana 34). La obra social se suma al alta en la semana 8 |
