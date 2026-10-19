# Ronda — Contexto ampliado del proyecto

> Documento de traspaso. Resume todo lo analizado y decidido antes de empezar a programar: de dónde viene el producto, qué es y qué no, cómo se va a construir y qué falta definir.
> `CLAUDE.md` tiene las reglas operativas de cada sesión. Este archivo explica el **porqué** detrás de esas reglas.
> Última actualización: 9 de octubre de 2026.

---

## 1. Origen

IPL – Ingeniería de Procesos Luján desarrolló durante 2026 dos aplicaciones AppSheet + Google Sheets + Apps Script + Looker Studio para una clínica de salud mental de Mendoza:

- **App principal:** pacientes, profesionales, internaciones, agenda por slots, evoluciones individuales y grupales, enfermería, esquema de medicación, historia clínica consolidada por script y generada en PDF, documentos, control de evoluciones faltantes, reporte semanal a Dirección y un comienzo de liquidaciones y facturación.
- **App de Conexión:** en la práctica, un módulo de coberturas y autorizaciones. Seguimiento Solicitado → Autorizado → Facturado → Cobrado por paciente, período y obra social. Incluye módulos con precios por obra social y su historial, consumo de órdenes, presentación mensual, cobros particulares y copagos, y reglas por obra social para determinar qué prestación presentar, con "NO DEFINIDO" como valor por defecto.

Ambas se usaron en un entorno real, con administración, profesionales y enfermería. Eso las convierte en un **MVP validado**: sabemos qué flujos se usan de verdad.

**Decisión clave:** no se reescriben las apps AppSheet en código. Ronda es un **producto genérico para cualquier centro de salud**, que toma de esas apps solo los flujos que demostraron valor. Las reglas particulares de aquella clínica no van en el código: si aplican, van como configuración.

## 2. Lecciones de las apps AppSheet (qué NO copiar)

Del análisis de los datos y de la documentación de ambas apps (62 tablas, unas 1.000 columnas, 289 acciones) surgieron estos problemas:

| Problema detectado | Cómo se resuelve en Ronda |
|---|---|
| Dos padrones de pacientes separados, con IDs, estados y nombres de obra social distintos | Un solo paciente por institución, único por DNI validado |
| Corrupción de IDs por ordenar una planilla sin seleccionar todo | Base relacional con claves `uuid`, restricciones y nunca edición manual de IDs |
| Ningún *security filter*: cualquier usuario veía todo | RBAC + relación de equipo tratante, aplicados en la base con RLS |
| Grupos como columnas (`GRUPO DBT Martes 18 hs`…) | Tabla de actividades grupales + inscripción paciente ↔ grupo |
| Profesionales como columnas en paciente e internación | Tabla de equipo tratante con rol y vigencia |
| 10 tablas `Doc_*` casi idénticas | Una tabla de documentos con tipo configurable |
| Varias tablas de controles consolidadas por script en una "HC unificada", con filas sin origen | Un único modelo de registro clínico. La HC es una consulta, no una copia |
| La HC en PDF se regeneraba y reemplazaba | Evoluciones firmadas inalterables, correcciones por adenda; el PDF es una foto fechada |
| Miles de slots de agenda pregenerados | Disponibilidad calculada desde plantilla + excepciones + turnos |
| Medicación con columnas fijas por horario (8/12/17/22) | Horarios como filas: admite cualquier esquema |
| Históricos con una columna por mes | Tablas de consumo por período |
| Textos libres con errores y variantes ("PREADMISON", 12 formas de escribir un mismo programa) | Catálogos cerrados por institución |
| Lógica de obra social en fórmulas anidadas | Tabla de reglas de cobertura ordenadas y configurables |

**Qué sí se conserva conceptualmente:** el historial de estados del paciente, el log de precios y el tarifario con vigencia desde/hasta, la carga masiva de asistentes a una actividad grupal con marcado individual, la vista de enfermería para celular y el reporte semanal a Dirección.

## 3. Definición del producto

### Core (toda institución lo tiene)
- Organización y seguridad: instituciones, sedes, usuarios, membresías, roles, auditoría.
- Pacientes: identidad, cobertura, referentes, estados con historial, equipo tratante.
- Profesionales: disciplina, matrícula, firma, plantillas horarias.
- Agenda: turnos, asistencia, feriados, bloqueos.
- Registro clínico: evoluciones individuales y grupales, notas de enfermería.
- Historia clínica: vista cronológica, adendas, exportación PDF, documentos.
- **Coberturas y autorizaciones:** obras sociales, prestaciones, autorizaciones con vencimiento y consumo, prefacturación.
- Indicadores básicos.

**Nota:** la clasificación original ponía facturación como opcional. Se separó en dos. **Autorizaciones y prefacturación** son core, porque es lo que hace cobrar a la clínica y el dolor más fácil de vender. **Factura electrónica ARCA** y conciliación de cobros son opcionales o se resuelven exportando al sistema contable del cliente.

### Módulos opcionales
- Internación: habitaciones, camas, ingresos, egresos, días autorizados, prórrogas. Muchas instituciones son solo ambulatorias.
- Enfermería avanzada y medicación (esquema + registro de administración).
- Actividades grupales.
- Cobros particulares y copagos; liquidación a profesionales.
- Reportes programados por mail; control de evoluciones faltantes.

### Configurable por institución (sin tocar código)
Catálogos (obras sociales, prestaciones, estados, tipos de sesión, tipos de documento), tarifario con vigencias, reglas de cobertura, plantillas de documentos, evoluciones obligatorias por rol y frecuencia, duración de turnos, sedes y módulos activos.

### Personalizaciones a evitar
Pantallas o flujos exclusivos de un cliente; campos nuevos en tablas del core por pedido puntual; integraciones a medida en etapas tempranas (por ejemplo con el sistema RAS); reportes armados a mano por cliente; un editor genérico de formularios.

## 4. MVP comercial (para una segunda institución)

| Funcionalidad | Etapa |
|---|---|
| Pacientes, estados, equipo tratante | MVP |
| Profesionales, plantillas horarias, turnos, asistencia | MVP |
| Evoluciones individuales y grupales | MVP |
| HC cronológica + PDF | MVP |
| Autorizaciones con vencimientos y alertas | MVP |
| Prefacturación mensual exportable | MVP |
| Roles, auditoría, backups | MVP |
| Tablero básico | MVP |
| Internación | MVP si el cliente interna; si no, 2ª etapa |
| Control de evoluciones faltantes, enfermería, medicación, cobros particulares, reporte semanal, liquidación a profesionales, recordatorios WhatsApp/mail | 2ª etapa |
| Portal del paciente, receta electrónica, factura electrónica ARCA, integración con portales de obras sociales, resúmenes de HC con IA | Futura |
| Form builder, app nativa, integración RAS, telemedicina | No recomendable al inicio |

Medicación va en 2ª etapa por riesgo clínico: se diseña con cuidado, no rápido.

## 5. Prototipo de demostración

`docs/prototipo/ronda-demo.html` es una demo navegable con datos ficticios y sin backend, para mostrar a clientes. Incluye:

- Selector de rol (Dirección, Psicóloga, **Psiquiatría**, Enfermería, Recepción), que muestra RBAC en vivo.
- Menú en tres bloques: uso diario (Panel de turnos, Agenda, Pacientes, **Profesionales**), Administración, y Configuración y Ayuda al pie.
- Panel de turnos con alertas, y "Mi día" en celular para quien atiende.
- Agenda semanal armada **desde los horarios cargados en la ficha del profesional**: al cambiarlos, la grilla cambia.
- **Profesionales:** disciplina, matrícula, firma y horarios de atención, todo editable.
- Pacientes: alta con **número de afiliado**, y ficha con datos personales, referentes, diagnóstico, cobertura y equipo tratante **editables**. Cambiar el equipo cambia en vivo quién ve la HC.
- **Documentos:** se suben desde la ficha (en el celular, con una foto), se ven en un visor, se descargan y se anulan con motivo. El tipo de documento, configurable, dice si forma parte de la historia clínica; esos solo los ve quien tiene acceso a la HC.
- Historia clínica: evoluciones firmadas, adendas y **documentos de la HC en orden cronológico**; la exportación PDF los incluye (imágenes adentro, PDF como anexos).
- Grupos con asistencia que generan evoluciones.
- Camas con días autorizados y prórrogas.
- **Medicación en dos pestañas:** los esquemas los indica y cambia psiquiatría (cambiar versiona, no pisa); enfermería registra las tomas, incluidas las de a demanda, **con la hora real en que las dio** aunque las cargue más tarde, y puede corregir una hora dejando el registro anterior a la vista.
- Autorizaciones en tablero, **mes por mes** (5 meses atrás y 3 adelante), con la columna "A pedir" en los meses futuros.
- Prefacturación que bloquea el cierre si hay pacientes "No definido", y que se mira mes por mes: cerrados (la foto del cierre), pendiente de cierre, en curso y una estimación de los meses futuros.
- **Métricas:** asistencia, ocupación, turnos por disciplina y estado de las autorizaciones.
- Configuración (reglas de cobertura, tarifario, permisos) y auditoría en vivo.
- Las funciones que todavía no existen se muestran con etiqueta **"Próximamente"** y la etapa en que llegan. **No se presenta como disponible nada que no esté construido.**

**Vistas previas.** Algunas funciones de "En camino" se pueden recorrer en el prototipo para mostrar cómo van a funcionar: recordatorios por WhatsApp, borrador de evolución con IA, consentimiento firmado desde el celular y link de pago. Van siempre **rotuladas como "Vista previa"**, con la etapa en que llegan, y lo que se crea con ellas queda marcado. Al mostrarlas a un cliente, decir que **no están disponibles**: sirven para validar la idea antes de construirla.

**Lista única de "En camino".** Es la misma en el prototipo (Configuración → Institución), en la web pública y en este documento. Si cambia, se actualizan las tres:

| Funcionalidad | Etapa | Módulo (ver `docs/modulos.md`) |
|---|---|---|
| Link de pago | 2ª etapa | Cobros particulares |
| Consentimientos firmados desde el celular | 2ª etapa | Base |
| Recordatorios por WhatsApp | 8.1 | Recordatorios por WhatsApp |
| Factura electrónica ARCA | 8.2 | Factura electrónica ARCA |
| Videollamada | 8.3 | Telesalud |
| Borrador de evolución con IA | 8.4 | IA clínica |
| Receta electrónica | 8.5 | Receta electrónica |
| Autorizaciones en línea | 8.6 | Obras sociales en línea |
| Portal del paciente | a definir | Portal del paciente |

Los procesos que la demo recorre están diagramados en `docs/flujos/` (24 diagramas en Mermaid, con roles, puntos de auditoría y caminos bloqueados). Ante una diferencia entre la demo y un flujo, gana el flujo: es la especificación.

Sirve como **especificación visual**: al construir una pantalla real, tomar de la demo el flujo, los textos y la jerarquía. Su código no se reutiliza.

Guion de venta sugerido:
1. Dirección → "Hoy".
2. Psicóloga → firmar una evolución e intentar editarla.
3. Enfermería → registrar una toma desde el celular.
4. Administración → avanzar una autorización e intentar abrir una HC.
5. Dirección → Auditoría muestra todo lo anterior.

### Pantallas de referencia aprobadas

Además de la demo, hay pantallas diseñadas en detalle que tienen **prioridad sobre la demo** cuando se superponen. Están en `docs/pantallas/`, cada una con captura (`.png`), maqueta HTML y especificación (`panel-del-dia.md`):

- **Panel del día — escritorio (recepción):** turnos agrupados por dónde está el paciente (en consulta, en sala de espera, por llegar), contadores que filtran, columna **Cobertura** con la etiqueta más relevante (autorización por vencer, copago pendiente, "sesión N de M"), una acción por fila (*Marcar llegada → Hacer pasar → Finalizar*), panel "Profesionales hoy" y lista "Para resolver hoy".
- **Mi día — celular (profesional):** paciente en consulta con botón *Evolución*, siguiente paciente con *Hacer pasar* y resto del día.
- **Sala de espera — celular (recepción):** tarjetas grandes con tiempo de espera y cobertura, *Hacer pasar* y *Nuevo turno* siempre visible.

Se tomó como referencia de organización la pantalla de un competidor (Menta), pero el diseño es propio: no se copian pantallas de otros productos.

### Identidad visual

Estética limpia estilo SimplePractice con los colores de IPL (blanco, naranja y gris), **solo modo claro**. Logo "Recorrido": anillo abierto con punto naranja, que además es la "o" de la palabra. Todo definido en `docs/diseno.md`; archivos del logo en `docs/marca/`.

## 6. Arquitectura

### Decisión
**React + Vite + TypeScript en Vercel, con Supabase** (PostgreSQL, Auth, Storage, RLS, Edge Functions), más un worker liviano para PDFs, mails y reportes programados cuando haga falta.

Motivos:
- Es el stack que IPL ya usó en otro proyecto (Florena).
- RLS es la mejor barrera contra fugas entre instituciones.
- Los servicios gestionados reducen el mantenimiento para un equipo chico.
- TypeScript de punta a punta facilita el trabajo con IA.

### Alternativas evaluadas y descartadas por ahora
- **Next.js full-stack + Postgres gestionado + auth externa:** más control, pero más piezas para armar (auth, auditoría, permisos).
- **Django + Postgres:** muy maduro para datos y auditoría, pero implica un lenguaje nuevo para el equipo.

### Principios
- Monolito modular, sin microservicios.
- Multi-tenant con esquema compartido: `institution_id` en toda tabla de negocio + claves foráneas compuestas `(institution_id, id)` + RLS.
- Lógica crítica en la base o en funciones de servidor, nunca solo en el frontend.
- Evitar depender de funciones exclusivas de Supabase más allá de lo necesario, por si la validación legal obliga a cambiar de proveedor de alojamiento.

## 7. Seguridad (mínimos)

- **HC inalterable:** evolución firmada = no editable ni borrable (trigger en base); adendas visibles; PDF con fecha y huella.
- **Auditoría** de lectura, escritura y exportación de HC, firmas, cambios de estado, cierres de período, permisos y accesos denegados. Tabla de solo inserción.
- **RBAC por rol + relación:** el profesional ve a sus pacientes (equipo tratante); Administración ve cobertura pero no el contenido clínico; Enfermería ve internados.
- **Accesos:** cuentas individuales siempre, nunca compartidas. 2FA obligatorio para Dirección y Administración. Sesiones con expiración y cierre remoto.
- **Datos y documentos:** cifrado en tránsito y en reposo. Documentos en buckets privados con URLs firmadas de corta duración. Borrado lógico y retención configurable.
- **Backups:** con recuperación a un punto en el tiempo (plan pago de Supabase) y **pruebas de restauración periódicas**.
- **Datos reales:** nunca en desarrollo.

## 8. Aspectos legales a validar con especialistas (no se asume cumplimiento)

- **Ley 25.326 (datos personales, salud = dato sensible):** inscripción de bases ante la AAIP, medidas de seguridad, transferencia internacional (Supabase aloja en São Paulo), rol de IPL como encargado de tratamiento y contrato de procesamiento con cada institución.
- **Ley 26.529 (derechos del paciente) y Ley 27.706 (HC digital):** integridad, inalterabilidad, firma, conservación, acceso del paciente.
- **Ley 25.506 (firma digital/electrónica):** valor de la firma escaneada frente a la electrónica o la digital. Afecta directamente la HC.
- **Ley 26.657 (salud mental):** registros de internación involuntaria, comunicaciones obligatorias, abordaje interdisciplinario.
- **Normativa de Mendoza** y habilitaciones de cada institución cliente.
- **Ley 27.553 (receta electrónica):** desde 2025 es la única modalidad válida y las plataformas deben estar aprobadas en el ReNaPDiS. Ronda lo resuelve integrándose con una plataforma ya aprobada (etapa 8.5).
- **IA con datos de salud:** consentimiento del paciente, grabación de sesiones, condiciones del proveedor de IA sobre uso y retención de datos, transferencia internacional (etapa 8.4).
- **Contratos:** términos SaaS, SLA, responsabilidad, seguro de ciberriesgo, devolución de datos al terminar el servicio.

Se puede desarrollar todo el MVP con datos ficticios mientras se hace esta validación.

## 9. Migración desde AppSheet (cuando corresponda)

**Piloto: coberturas y prefacturación**, que reemplaza a la App de Conexión. Los motivos:
- Tiene pocos usuarios.
- Su valor es inmediato.
- No toca la HC.
- Obliga a resolver primero la unificación de los padrones de pacientes.

Secuencia:
1. Modelo nuevo y catálogos limpios.
2. Script de migración repetible, con reporte de conflictos (duplicados, DNI inválidos, obras sociales sin mapear, huérfanos).
3. Carga en paralelo, con AppSheet todavía como fuente de verdad.
4. Uno o dos cierres mensuales comparando contra Conexión.
5. Corte de Conexión.
6. Después: agenda → registro clínico y HC → internación, enfermería y medicación.
7. Retiro de AppSheet, con los históricos en solo lectura.

Riesgos: fatiga por doble carga, reglas implícitas en fórmulas sin documentar, evoluciones históricas sin firma ni origen, rechazo si la app nueva es más lenta en el celular.

## 10. Roadmap por etapas (sin tiempos todavía)

| # | Etapa | Entregable | Depende de |
|---|---|---|---|
| 0 | Fundaciones | Instituciones, usuarios, membresías, roles y auditoría funcionando, sin módulos de negocio | — |
| 1 | Datos maestros | Pacientes, profesionales, obras sociales, prestaciones, tarifario, reglas de cobertura | 0 |
| 2 | Coberturas y prefacturación (piloto) | Un cierre mensual real hecho en Ronda | 1 |
| 3 | Agenda y turnos | Plantillas, turnos, asistencia, recordatorios | 1 |
| 4 | Registro clínico e HC | Evoluciones, grupales, adendas, PDF | 1, 3 |
| 5 | Internación, enfermería, medicación | Operación de internación, pensada para el celular | 4 |
| 6 | Indicadores y reportes | Tableros y reporte semanal nativos | 2–5 |
| 7 | Productización | Una segunda institución operando sin tocar código | todas |
| 8 | Integraciones e IA | Ver detalle abajo; habilita el plan Pro | 3, 4 |

### Etapa 8 — Integraciones e IA (después del MVP)

Ninguna se construye desde cero: Ronda se conecta a servicios especializados. Orden propuesto:

| # | Funcionalidad | Cómo | Esfuerzo | Condiciones |
|---|---|---|---|---|
| 8.1 | Recordatorios y confirmación de turnos por WhatsApp | API oficial de WhatsApp Business vía proveedor. La respuesta del paciente actualiza el turno (confirmado, cancelado, pide reprogramar) | Bajo-medio | Costo por mensaje: considerarlo en el precio de cada plan |
| 8.2 | Factura electrónica ARCA | Servicios web de ARCA, desde la prefacturación | Medio | Certificado digital por institución |
| 8.3 | Videollamada | Primero: enlace de videollamada en el recordatorio del turno virtual. Después: servicio de video embebido en Ronda | Medio | Validar encuadre normativo de teleconsulta |
| 8.4 | IA clínica | Voz a texto + API de IA (por ejemplo Claude) para: borrador de evolución desde notas o audio, digitalizar documentos en foto, resumen de HC | Medio | **La IA propone, el profesional revisa y firma**; nunca firma sola. Consentimiento del paciente; grabar sesiones solo opcional y con consentimiento explícito por sesión; contrato con el proveedor (uso y retención de datos, transferencia internacional). Requiere consulta legal previa |
| 8.5 | Receta electrónica | **Integrarse con una plataforma ya aprobada en el ReNaPDiS** que ofrezca API: se prescribe desde Ronda, la emite la plataforma habilitada y queda en la HC | Medio | Inscribir a Ronda como recetario propio queda descartado por ahora (trámite, requisitos técnicos de fiscalización, firma digital) |
| 8.6 | Obras sociales online (validación de afiliados, autorizaciones) | Caso por caso, según el canal digital de cada financiadora. Empezar por la más usada por los clientes (probablemente OSEP en Mendoza) | Variable | Depende de cada obra social |

Modelo de datos: prever desde las etapas 3 y 4 los campos que estas integraciones necesitan (origen de la confirmación del turno, turno virtual con enlace, evolución con origen "borrador IA" y aprobación del profesional, receta vinculada a la HC).

## 11. Modelo comercial

- Implementación inicial para centros (migración, configuración, capacitación) + suscripción mensual + módulos opcionales.
- **Se cobra por profesional que atiende, nunca por usuario:** recepción, administración y enfermería no pagan. Cobrar por usuario empuja a compartir cuentas, sobre todo en enfermería, y rompe la auditoría.
- Todo pedido especial pasa por el roadmap común y se construye solo si sirve a varias instituciones. La consultoría de procesos se factura aparte.

### Referencia: Menta (competidor, Buenos Aires)

Relevado en septiembre 2026 en su sitio. **Pendiente de reconfirmar:** en la sesión del 29 de septiembre de 2026 no se pudo acceder al sitio para verificarlo, así que los datos de abajo son los del relevamiento original. Hay que reconfirmarlos antes de publicar cualquier comparación pública. Planes para independientes con 20% de descuento pagando anual: Start USD 8/mes (hasta 5 pacientes), Plus USD 15,20 (hasta 10 pacientes), Pro USD 20,80 (pacientes ilimitados + funciones de IA y videollamadas). Para centros: plan Clinic "a consultar". Fuerte en IA, videollamadas, recetas e integraciones con financiadoras; foco en profesionales independientes.

### Propuesta de precios para Ronda (a validar)

Misma forma de cobrar que Menta, algo más barata, competiendo con lo que Ronda tiene. En dólares, cobrado en pesos al tipo de cambio del día; mensual o anual con 20% de descuento.

| Plan | Ronda (anual) | Incluye |
|---|---|---|
| Inicio | USD 7/mes · **pacientes ilimitados** | Agenda, recordatorios, historia clínica, asistencia |
| Profesional | USD 13/mes · pacientes ilimitados | + consentimientos, documentos, métricas, links de pago |
| Pro | Se lanza con la etapa 8 (videollamada + IA) | — |
| Centros | **Precio publicado:** base por institución + monto por profesional que atiende | Todo + recepción, roles, obras sociales, autorizaciones, prefacturación, grupos |
| Internación | Módulo adicional por cama | Camas, enfermería, medicación |

Diferenciales comerciales: pacientes ilimitados desde el plan más barato, precio de centros publicado (Menta dice "consultar"), usuarios no clínicos gratis, y foco en obras sociales argentinas, internación y salud mental.

**Antes de publicar:** calcular costos fijos (Supabase, hosting, backups), costo de WhatsApp por mensaje y horas de soporte por cliente. **No publicar funciones que todavía no existen.**

## 12. Riesgos principales

1. Que IPL termine siendo software factory de un solo cliente, construyendo pedidos sin preguntar si sirven a otros.
2. Vender sin validar lo legal (HC electrónica, alojamiento de datos).
3. Una fuga de datos de salud mental: por eso el aislamiento y la auditoría van desde la etapa 0.
4. Soporte 24/7 en instituciones con internación: definir quién atiende antes de firmar un SLA.
5. Conocimiento concentrado en una sola persona: se mitiga con documentación en el repositorio.
6. Adopción: si en el celular es más lento que AppSheet, se vuelve al papel.
7. Código generado con IA sin arquitectura ni tests: se mitiga con `CLAUDE.md`, ADRs y tests de reglas críticas.

## 13. Estado del entorno

- [x] VS Code + extensión de Claude Code.
- [x] Proyecto `ronda-dev` en Supabase (región São Paulo, solo datos ficticios).
- [x] Cuenta de Vercel vinculada a GitHub (el proyecto todavía no se importó).
- [x] Repositorio clonado, con remoto `procesosipl-source/Ronda`, `CLAUDE.md` en la raíz y la demo en `docs/prototipo/`. Desde el 19 de octubre de 2026 está en `C:\Proyectos\IPL\Ronda`.
- [ ] Borrar la copia vieja del Escritorio (`C:\Users\LUCAS\Desktop\Ronda`) una vez abierta la nueva en VS Code.
- [ ] Instalar Docker Desktop, que usa la Supabase CLI para levantar la base local y correr los tests pgTAP (antes de la sesión 2).
- [ ] Reactivar `ronda-dev`: Supabase lo pausó por inactividad (visto el 9 de octubre de 2026). En la misma organización hay otro proyecto pausado, "procesosipl-source's Project" (`us-east-2`), que no es de Ronda: conviene borrarlo si no se usa.
- [ ] Esqueleto del proyecto (sesión 1).

**Cuidado:** en la misma computadora existe otro proyecto de cliente (FLEXColor, en el Escritorio). Antes de cada sesión, verificar que VS Code tenga abierta la carpeta de Ronda. Los proyectos de clientes nunca se anidan uno dentro de otro.

## 14. Próximos pasos

0. **Arreglos al prototipo** (hechos el 9 de octubre de 2026): registro de medicación con hora real y corrección, carga y visor de documentos, documentos en la HC y en su PDF, selector de mes en Autorizaciones y Prefacturación, y una sola lista de "En camino". **Queda pendiente:** revisar el catálogo de módulos ([`docs/modulos.md`](modulos.md)) y, al aprobarlo, aceptar el ADR 0003, armar la pantalla de módulos del prototipo y actualizar §3, §4 y §11.
1. **Sesión 1 — Esqueleto:** verificar el entorno y crear la app React + Vite + TypeScript con Tailwind, la Supabase CLI vinculada a `ronda-dev`, `.gitignore`, `.env.example` y el README. Primer commit y push. Importar el repo en Vercel.
2. **Sesión 2 — Modelo de fundaciones:** diseñar juntos, antes de escribir SQL, las tablas `institution`, `site`, `membership`, `role`, `audit_log` y el perfil de usuario. Después migraciones, políticas RLS, tests de aislamiento entre instituciones y seed ficticio con dos instituciones.
3. **Sesión 3 — Login y roles en la interfaz:** inicio de sesión, selección de institución cuando el usuario pertenece a varias, menú según rol y una pantalla "Hoy" vacía.
4. Recién después, **datos maestros** (etapa 1).

## 15. Decisiones pendientes

- [ ] Idioma del código: la propuesta es identificadores en inglés e interfaz en español (ver glosario en `CLAUDE.md`). Falta confirmarlo.
- [ ] Nombre definitivo del producto ("Ronda" es provisorio).
- [ ] Mover el repositorio y las cuentas a una organización/cuenta de IPL, en lugar de la cuenta personal de GitHub.
- [ ] Consulta legal: alojamiento de datos, firma de evoluciones, obligaciones ante la AAIP.
- [ ] Perfil de las instituciones objetivo (ambulatorias o con internación, tamaño, especialidad): define qué entra al core.
- [ ] Equipo disponible y horas por semana: necesario para estimar tiempos.
- [ ] Qué indicadores de Looker Studio mira realmente Dirección.
