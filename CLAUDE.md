# Ronda — contexto para Claude Code

> Leé este archivo completo al empezar cada sesión. Si algo de lo que te pido contradice una regla de la sección "Reglas no negociables", frená y avisame antes de hacerlo.

## Qué es

Ronda (nombre provisorio) es una plataforma web SaaS **multi-institución** para gestionar centros de salud, con foco inicial en salud mental: pacientes, agenda, historia clínica, grupos, internación, medicación, autorizaciones de obras sociales y prefacturación.

La desarrolla IPL (Mendoza, Argentina). En todo texto visible, la empresa se nombra solo como "IPL", sin nombre completo. Nace de dos apps AppSheet hechas a medida para una clínica, pero **no es una copia de ellas**: es un producto genérico y configurable. Ninguna regla particular de una clínica va en el código; va en la configuración de esa institución.

Usuarios: dirección, administración, profesionales (psicología, psiquiatría, trabajo social, nutrición), enfermería y recepción. Se usa desde PC, tablet y celular.

## Estado actual

Etapa 0 — Fundaciones. Todavía no hay módulos de negocio. El orden previsto es:

1. Fundaciones: estructura del proyecto, instituciones, usuarios, roles, auditoría.
2. Datos maestros: pacientes, profesionales, obras sociales, prestaciones, tarifario.
3. Agenda y turnos.
4. Registro clínico e historia clínica.
5. Autorizaciones y prefacturación.
6. Internación, enfermería y medicación.
7. Indicadores y reportes.
8. Productización (alta de nuevas instituciones, importador, configuración).

El orden de los pasos 3 a 6 se decidió en `docs/decisiones/0004-orden-de-construccion-para-di-ferro.md`, pensando en Clínica Di Ferro, el primer cliente previsto.

El contexto completo del proyecto (origen, decisiones, alcance del MVP, riesgos, aspectos legales y pendientes) está en `docs/contexto-proyecto.md`. Leelo cuando una tarea toque alcance, arquitectura o prioridades.

El plan semana a semana, con lo que se muestra cada viernes, está en `docs/plan.md`. Al empezar una sesión, mirá en qué semana estamos; al terminarla, actualizá el registro semanal.

El prototipo visual de referencia está en `docs/prototipo/ronda-demo.html`. Las pantallas diseñadas en detalle (captura, maqueta y especificación) están en `docs/pantallas/` y tienen prioridad sobre el prototipo. Usalo como guía de pantallas, textos y flujos; su código **no** se reutiliza.

## Stack

- Frontend: React + Vite + TypeScript (modo estricto), React Router, TanStack Query, react-hook-form + zod, Tailwind CSS.
- Backend: Supabase — PostgreSQL, Auth, Storage, Row Level Security, Edge Functions.
- Hosting: Vercel (frontend). Supabase (backend).
- Tests: Vitest para frontend y lógica; pgTAP (vía Supabase CLI) para la base de datos y las políticas RLS.
- Entornos: `ronda-dev` (desarrollo, solo datos ficticios). Producción se crea más adelante.

No agregues dependencias nuevas sin explicarme para qué y qué alternativa descartaste.

## Reglas no negociables

1. **Aislamiento entre instituciones.** Toda tabla con datos de una institución tiene `institution_id uuid not null`. Las claves foráneas entre tablas de negocio son compuestas `(institution_id, id)`, para que la base impida relacionar registros de instituciones distintas.
2. **RLS siempre.** Toda tabla tiene Row Level Security habilitado y políticas explícitas. Ninguna tabla queda sin políticas. Cada tabla nueva lleva un test que verifique que un usuario de la institución A no puede leer ni escribir datos de la institución B.
3. **La seguridad vive en la base, no en la pantalla.** Ocultar un botón no es un permiso. Todo control de acceso se aplica en RLS o en funciones del servidor; el frontend solo lo refleja.
4. **Secretos.** La clave `service_role` / secret de Supabase nunca va en el frontend, en variables `VITE_*` ni en el repositorio. Los archivos `.env*` (salvo `.env.example`) están en `.gitignore`. Si detectás un secreto en el código, frená y avisame.
5. **Historia clínica inalterable.** Una evolución firmada no se modifica ni se borra: la base lo impide con un trigger. Las correcciones se agregan como adenda vinculada. Los borradores sí se editan, solo por su autor.
6. **Borrado lógico.** Los datos clínicos y administrativos no se eliminan con `DELETE`; se marcan (`deleted_at`, `deleted_by`).
7. **Auditoría.** Las acciones sobre datos sensibles (ver o exportar historia clínica, firmar, cambiar estados, cerrar períodos, cambiar permisos, accesos denegados) se registran en `audit_log`, tabla de solo inserción.
8. **Nunca datos reales en desarrollo.** Los datos de prueba (seeds) son ficticios. No importes ni pegues datos de pacientes reales en ningún archivo, test ni commit.
9. **Esquema solo por migraciones.** Todo cambio de base se hace con archivos en `supabase/migrations/`. Nunca desde el panel de Supabase a mano.
10. **Operaciones críticas en el servidor.** Firmar una evolución, cambiar el estado de un paciente, cerrar un período de facturación o registrar una administración de medicación se hacen con funciones de base de datos o Edge Functions transaccionales, no con varias escrituras sueltas desde el frontend.
11. **Configuración antes que código.** Si una regla varía entre instituciones (obras sociales, prestaciones, precios, reglas de cobertura, estados, tipos de documento, frecuencias obligatorias de evolución), va en tablas de configuración, no en `if` dentro del código.

## Convenciones

- **Idioma:** identificadores de código y base de datos en inglés (`snake_case` en SQL, `camelCase` en TypeScript). Todos los textos visibles para el usuario en español rioplatense (es-AR), en voz activa y sin tecnicismos. Comentarios y documentación en español.
- **Fechas:** en la base se guardan en UTC (`timestamptz`). Se muestran en hora de Argentina (`America/Argentina/Mendoza`).
- **Identificadores:** `uuid` como clave primaria. Nada de claves armadas con texto.
- **Columnas comunes** en tablas de negocio: `id`, `institution_id`, `created_at`, `created_by`, `updated_at`, `updated_by`, `deleted_at`, `deleted_by`.
- **Catálogos cerrados:** nada de texto libre donde debería haber una lista (estados, obras sociales, prestaciones, disciplinas).
- **Diseño visual:** toda pantalla respeta `docs/diseno.md` (paleta blanco, naranja y gris de IPL, tipografía, componentes y textos). No inventes colores ni estilos fuera de esa guía.
- **Estados:** cada entidad con ciclo de vida (paciente, autorización, internación, período) guarda su historial de cambios con fecha, usuario y motivo.

## Glosario del dominio

| Español (interfaz) | Inglés (código) | Significado |
|---|---|---|
| Institución | `institution` | Clínica o centro cliente. Es el tenant. |
| Sede | `site` | Lugar físico de una institución. |
| Usuario | `user` (Supabase Auth) | Persona que inicia sesión. Su nombre está en `user_profile`. |
| Membresía | `membership` | Relación usuario ↔ institución ↔ rol. Una fila por rol: una persona puede tener varios roles en una institución y estar en varias instituciones (ADR 0005). |
| Rol | `role` | Catálogo fijo: Dirección (`director`), Coordinación (`coordinator`), Administración (`administration`), Recepción (`reception`), Profesional (`professional`), Enfermería (`nursing`). |
| Auditoría | `audit_log` | Registro de solo inserción de acciones sensibles. Las acciones salen del catálogo `audit_action` y se escriben solo desde funciones del servidor (ADR 0006). |
| Módulo | `module` | Parte del producto que una institución tiene o no (Internación, Obras sociales…). Catálogo común; Base (`core`) siempre activa. |
| Módulos de la institución | `institution_module` | Qué módulos tiene activos cada institución, con vigencia. Los cambia solo IPL (ADR 0003). Se consulta con `module_enabled()`. |
| Profesional | `professional` | Persona que atiende. Tiene disciplina, matrícula y firma. |
| Disciplina | `discipline` | Psicología, Psiquiatría, Trabajo social, Nutrición, Enfermería, etc. |
| Paciente | `patient` | Persona atendida. Única por tipo y número de documento (DNI, Pasaporte u Otro) dentro de cada institución. Puede tener nombre elegido (Ley 26.743), que es el que muestran las pantallas. |
| Estado del paciente | `patient_status` | Preadmisión, Admisión, En tratamiento, Alta, Baja: vienen por defecto y cada institución los puede ajustar. Los saltos permitidos están en `patient_status_transition` y el historial en `patient_status_history`. |
| Equipo tratante | `care_team_member` | Profesionales asignados a un paciente, con vigencia. Define quién ve su historia clínica. |
| Referente | `patient_contact` | Familiar o contacto responsable del paciente. Uno puede ser el principal. Ojo: no es el profesional que conduce el tratamiento; ese es el **Profesional a cargo** del equipo tratante. |
| Plantilla horaria | `schedule_template` | Días y franjas en que atiende un profesional en una sede. |
| Turno | `appointment` | Cita de un paciente con un profesional. |
| Asistencia | `attendance` | Presente / ausente de un turno o encuentro grupal. |
| Evolución | `clinical_note` | Registro clínico de un profesional sobre un paciente. Borrador o firmada. |
| Adenda | `clinical_note_addendum` | Corrección o agregado a una evolución firmada. |
| Actividad grupal | `group_activity` | Grupo o taller estable (ej. grupo DBT). |
| Encuentro | `group_session` | Una ocurrencia de la actividad grupal, con asistencia por paciente. |
| Internación | `admission` | Episodio de internación con ingreso, egreso y días autorizados. |
| Cama | `bed` | Cama dentro de una habitación (`room`). |
| Esquema de medicación | `medication_order` | Indicación médica: medicamento, dosis, vía, horarios, vigencia. |
| Administración | `medication_administration` | Registro de cada toma: administrada o no, con motivo. |
| Obra social | `payer` | Obra social, prepaga o Particular. Catálogo propio de cada institución, con código RNOS opcional. |
| Cobertura | `patient_coverage` | Obra social y número de afiliado del paciente, con vigencia. Una sola vigente; cambiarla cierra la anterior. |
| Prestación | `service` | Lo que se factura (consulta, módulo, día de internación). |
| Tarifario | `price_list_item` | Precio de una prestación para una obra social, con vigencia desde/hasta. |
| Regla de cobertura | `coverage_rule` | Regla ordenada que define qué prestación se presenta según obra social, estado y modalidad. Sin coincidencia → "No definido". |
| Autorización | `authorization` | Pedido a una obra social: Solicitada → Autorizada / No autorizada → Presentada → Cobrada. |
| Período de facturación | `billing_period` | Mes que se prefactura y se cierra. Cerrado = no modificable. |
| Documento | `document` | Archivo asociado a un paciente. Se anula, no se borra. |
| Tipo de documento | `document_type` | Catálogo de la institución. Dice si los documentos de ese tipo forman parte de la historia clínica. |

## Estructura del repositorio

```
/src
  /app          rutas, layout, proveedores
  /features     un directorio por módulo (patients, appointments, clinical-notes…)
  /components   componentes de interfaz reutilizables
  /lib          cliente de Supabase, utilidades, tipos generados
/public
  /brand        archivos del logo y los íconos
/supabase
  /migrations   migraciones SQL versionadas
  /functions    Edge Functions
  /tests        tests pgTAP de base y RLS
  seed.sql      datos ficticios
/docs
  /competencia  análisis de productos competidores
  /decisiones   una nota por decisión de arquitectura (ADR)
  /flujos       un diagrama por proceso de la clínica (Mermaid)
  /pantallas    pantallas diseñadas en detalle: captura, maqueta y especificación
  /prototipo    demo navegable de referencia
  /web          borrador de la web pública del producto
  modulos.md    catálogo de módulos para vender (propuesta en revisión)
  plan.md       plan de trabajo semanal y registro de avance
```

Los procesos de la clínica están diagramados en `docs/flujos/` (índice en su `README.md`). Antes de modelar una tabla con ciclo de vida o de escribir un trigger, mirá el flujo correspondiente: de ahí salen los estados, las transiciones válidas y los bloqueos.

## Cómo trabajamos

- Antes de escribir código en una tarea no trivial, proponé un plan corto y esperá mi aprobación.
- Hacé cambios chicos y enfocados. Una tarea, un conjunto de cambios coherente.
- Después de cada cambio, corré los tests y el chequeo de tipos. No des una tarea por terminada si fallan.
- Explicá en lenguaje simple qué hiciste y por qué. El equipo viene de AppSheet y Apps Script, no de desarrollo de software tradicional.
- Si falta información o hay dos caminos razonables, preguntá antes de asumir.
- Cuando tomemos una decisión de arquitectura, registrala en `docs/decisiones/` con número, contexto, decisión y alternativas descartadas.
- Si una tarea te lleva a romper una regla de este archivo, no la rompas: avisame y proponé alternativas.
- Mantené este archivo actualizado cuando cambie algo de lo que describe (etapa actual, stack, convenciones).
