# Ronda — Plan de trabajo semanal

> Creado el 25 de noviembre de 2026. Se revisa cada viernes.
> Primer cliente previsto: **Clínica Di Ferro**.

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
- [ ] Reactivar `ronda-dev` en Supabase.
- [ ] Decidir el orden de los módulos (Fase C, más abajo) y registrarlo como ADR.
- [ ] Confirmar si Di Ferro interna pacientes: define si Internación entra en el MVP.

## Fase A — Fundaciones (semanas 1 a 5)

Es igual sea cual sea el orden de módulos. Sin esto no hay nada seguro sobre lo que construir.

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| 1 | El esqueleto ya está hecho (19/10/2026). Falta conectarlo: Docker Desktop, vincular la Supabase CLI a `ronda-dev`, importar el repo en Vercel con sus variables, y pantalla de ingreso con el logo | Un link en internet que abre la pantalla de ingreso de Ronda |
| 2 | Inicio de sesión real: entrar, salir y recuperar la contraseña | Entrar con un usuario de prueba y salir |
| 3 | Instituciones, sedes, membresías y roles en la base, con RLS, tests de aislamiento y dos instituciones ficticias | Un usuario de la institución A no ve nada de la B (tests en verde) |
| 4 | Auditoría (`audit_log`), elegir institución al entrar, menú según el rol | Entrar como Recepción y como Dirección: cada uno ve su menú, y Auditoría muestra los ingresos |
| 5 | Menú en tres bloques, versión para celular, invitar usuarios y asignarles un rol. Módulos activables por institución (ADR 0003) | Dirección invita a una persona nueva y le da un rol desde el celular |

## Fase B — Datos maestros (semanas 6 a 9)

También es común a cualquier orden.

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| 6 | Pacientes: alta, listado y búsqueda. DNI único por institución | Dar de alta pacientes ficticios y encontrarlos |
| 7 | Ficha del paciente: datos personales, estados con historial y motivo, referentes | Pasar un paciente de Admisión a En tratamiento y ver el historial |
| 8 | Obras sociales (catálogo) y cobertura del paciente con número de afiliado | Cargar la cobertura de un paciente desde la lista de obras sociales |
| 9 | Profesionales: disciplina, matrícula, horarios. Equipo tratante con vigencia | Asignar profesionales a un paciente |

**Hito 1 (fines de febrero de 2027):** Ronda real con usuarios, roles, pacientes y profesionales. Ya se puede mostrar a Di Ferro funcionando, aunque todavía no reemplace nada.

## Fase C — Módulos (semanas 10 a 28, orden a decidir)

Son tres bloques. Cambia el orden, no la cantidad de semanas.

**Coberturas y prefacturación (7 semanas)**

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| C1 | Prestaciones y tarifario con vigencias | Cambiar un precio desde una fecha y ver el historial |
| C2 | Reglas de cobertura ordenadas, con "No definido" | Ver qué prestación le toca a cada paciente |
| C3 | Autorizaciones: pedido, estados y vencimientos | Llevar una autorización de Solicitada a Autorizada |
| C4 | Tablero de autorizaciones mes por mes y alertas | El tablero con meses pasados y "A pedir" |
| C5 | Prefacturación del mes y exportación | La prefacturación de un mes, bajada a Excel |
| C6 | Cierre de período (bloquea con "No definido", queda la foto) | Cerrar un mes e intentar modificarlo |
| C7 | Importador de pacientes y autorizaciones, con reporte de conflictos | Importar un archivo de ejemplo ficticio y ver los errores |

**Agenda y turnos (6 semanas)**

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| A1 | Disponibilidad calculada desde los horarios del profesional | La agenda semanal armada sola |
| A2 | Nuevo turno y turnos recurrentes | Dar un turno semanal por tres meses |
| A3 | Bloqueos, feriados, cancelar y reprogramar | Bloquear un día y ver qué turnos quedan afectados |
| A4 | Panel del día de recepción (pantalla de `docs/pantallas/`) | Marcar llegada → Hacer pasar → Finalizar |
| A5 | Mi día y Sala de espera en el celular | Lo mismo desde el teléfono |
| A6 | Asistencia y ausentes, ajustes con usuarios | Registrar un ausente y verlo en la ficha |

**Registro clínico e historia clínica (6 semanas)**

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| H1 | Evolución en borrador y firma (función en la base, trigger que impide modificarla) | Firmar una evolución e intentar editarla |
| H2 | Adendas y quién ve la HC según el equipo tratante | Un profesional fuera del equipo no puede abrir la HC |
| H3 | Historia clínica cronológica y auditoría de lectura | Abrir una HC y verlo en Auditoría |
| H4 | Documentos: subir, ver y anular (almacenamiento privado) | Subir una foto desde el celular a la ficha |
| H5 | Actividades grupales y encuentros con asistencia | Cargar un encuentro grupal y ver las evoluciones |
| H6 | Exportar la HC a PDF con fecha y huella | Bajar el PDF de una HC |

## Fase D — Salida a producción (semanas 29 a 32)

| Sem. | Qué se construye | Demo del viernes |
|---|---|---|
| 29 | Entorno de producción, backups y prueba de restauración | Restaurar un backup en una copia |
| 30 | 2FA para Dirección y Administración, vencimiento de sesiones | Entrar con doble factor |
| 31 | Alta de Di Ferro: configuración, catálogos, importación en producción | Di Ferro configurada con sus datos |
| 32 | Capacitación y uso en paralelo con lo que usan hoy | Primer día de uso real |

**Hito 2 (septiembre de 2027 aprox.):** MVP ambulatorio en uso en Di Ferro.

El primer módulo de la Fase C se puede poner en uso real en paralelo antes, alrededor de **abril o mayo de 2027**, si se adelanta lo mínimo de la Fase D (producción y backups) para ese módulo.

## Fase E — Internación, enfermería y medicación (unas 10 semanas)

Solo si Di Ferro interna. Camas, ingresos y egresos, días autorizados y prórrogas, esquemas de medicación versionados, ronda de administración en el celular. Medicación se construye con cuidado, no rápido (riesgo clínico).

**Hito 3 (fin de 2027 aprox.):** Di Ferro operando completa en Ronda.

## En paralelo, sin horas de desarrollo

- **Consulta legal** (HC digital, firma de evoluciones, datos alojados en Brasil, AAIP). Conviene empezarla en diciembre: puede frenar el Hito 2 aunque el código esté listo.
- Relevar con Di Ferro qué usan hoy, qué les molesta y qué no quieren perder.
- Pedirles un ejemplo de los archivos que usan, armado con **datos inventados** (regla 8), para diseñar el importador.

## Registro semanal

| Sem. | Fecha | Hecho | Pendiente / notas |
|---|---|---|---|
| 0 | 25/11/2026 | Plan creado. Se detectó que el esqueleto ya estaba hecho en `C:\Proyectos\IPL\Ronda` | Decidir orden de módulos |
