# Ronda — Catálogo de módulos

> **Estado: propuesta para revisar.** Surge del pedido de un cliente al ver la demo: vender el sistema por partes. Nada de esto está decidido ni publicado. Al aprobarlo, se actualizan `contexto-proyecto.md` §3, §4 y §11, la web pública y la pantalla de módulos del prototipo.

## Para qué sirven los módulos

- **Que cada institución pague por lo que usa.** Un consultorio ambulatorio no necesita camas; una clínica con internación sí.
- **Que el producto siga siendo uno solo.** Un módulo es una parte del producto común que se activa o no. No es una versión a medida para un cliente (ver "Personalizaciones a evitar" en el contexto, §3).
- **Que la seguridad no dependa de la pantalla.** Un módulo apagado no es un menú escondido: la base rechaza sus operaciones (ADR [0003](decisiones/0003-modulos-activables-por-institucion.md)).

## Reglas del catálogo

1. **Base siempre incluida.** Sin pacientes, agenda e historia clínica no hay producto.
2. **Cada módulo dice qué necesita.** No se puede activar uno sin los que requiere, ni apagar uno del que dependen otros activos.
3. **Apagar no borra.** Los datos de un módulo apagado se conservan y se pueden **leer**, pero no se cargan datos nuevos. Es obligatorio para la historia clínica (conservación legal) y evita que un cliente pierda información por bajar de plan.
4. **Lo que no existe no se vende.** Un módulo de etapas futuras se muestra como "Próximamente", con su etapa, y no se puede contratar.
5. **Los módulos de integraciones con costo por uso** (WhatsApp) se cobran aparte del abono, según consumo.

## Catálogo propuesto

| Módulo | Código | Incluye | Requiere | Cómo se cobra | Etapa |
|---|---|---|---|---|---|
| **Base** | `core` | Pacientes, estados y equipo tratante; profesionales y horarios; agenda, turnos y asistencia; historia clínica y PDF; documentos; usuarios, roles y auditoría; métricas básicas | — | Por profesional que atiende | 0–4 |
| **Obras sociales** | `coverage` | Obras sociales, prestaciones, reglas de cobertura, tarifario con vigencias, autorizaciones con vencimientos, prefacturación y cierre de período | Base | Incluido en Centros | 1–2 |
| **Cobros particulares** | `private_billing` | Cobros a particulares, copagos, saldo del paciente y, cuando exista, link de pago | Base | Fijo por institución | 2ª etapa |
| **Grupos y talleres** | `groups` | Actividades grupales, inscripción, encuentros con asistencia masiva y evolución grupal | Base | Incluido en Centros | 4 |
| **Internación** | `inpatient` | Habitaciones y camas, ingresos y egresos, días autorizados y prórrogas | Base | Por cama | 5 |
| **Enfermería y medicación** | `medication` | Esquemas de medicación versionados, ronda de administración, tomas a demanda, controles de enfermería | Base | Incluido con Internación; aparte para hospital de día | 5 |
| **Gestión para Dirección** | `management` | Control de evoluciones faltantes, reporte semanal por mail, tableros de ocupación, asistencia y facturación | Base | Fijo por institución | 6 |
| **Liquidación a profesionales** | `professional_payout` | Cálculo de honorarios por prestación atendida y resumen mensual por profesional | Base | Fijo por institución | 2ª etapa |
| **Recordatorios por WhatsApp** | `whatsapp` | Recordatorio del turno y confirmación o pedido de reprogramación desde el mensaje | Base | Por mensaje enviado | 8.1 |
| **Factura electrónica ARCA** | `e_invoice` | Emisión de factura electrónica desde la prefacturación o desde un cobro particular | Obras sociales **o** Cobros particulares | Fijo por institución | 8.2 |
| **Telesalud** | `telehealth` | Turno virtual con enlace de videollamada; después, video dentro de Ronda | Base | Por profesional que atiende (plan Pro) | 8.3 |
| **IA clínica** | `clinical_ai` | Borrador de evolución desde audio o notas, digitalización de documentos, resumen de HC. La IA propone; el profesional revisa y firma | Base | Por profesional que atiende (plan Pro) | 8.4 |
| **Receta electrónica** | `e_prescription` | Prescripción desde Ronda a través de una plataforma habilitada en el ReNaPDiS | Base | Por profesional que prescribe | 8.5 |
| **Obras sociales en línea** | `payer_online` | Validación de afiliados y pedido de autorizaciones en el sistema de cada obra social | Obras sociales | Fijo por institución | 8.6 |
| **Portal del paciente** | `patient_portal` | El paciente ve sus turnos, documentos y pagos con su propio acceso | Base | A definir | a definir |

### Por qué estos cortes

- **Obras sociales va junto, no en partes.** Autorizaciones sin prefacturación (o al revés) no sirven: comparten reglas, tarifario y período. Es el corazón de Centros.
- **Medicación se separa de Internación.** Un hospital de día administra medicación sin tener camas. Para quien interna, va incluida.
- **Grupos es aparte** porque muchos consultorios no los tienen, y en salud mental son centrales.
- **Las integraciones de la etapa 8 son módulos propios** porque cada una tiene un costo externo (mensajes, certificados, plataforma de recetas, proveedor de IA) y condiciones legales distintas.
- **Documentos va en Base.** Sin documentos, la historia clínica queda incompleta (ver flujo [24](flujos/24-cargar-y-ver-documentos.md)).

## Relación con los planes de precio

Los planes de `contexto-proyecto.md` §11 pasan a ser **paquetes de módulos**:

| Plan | Módulos |
|---|---|
| Inicio | Base, con límites de uso a definir |
| Profesional | Base |
| Pro | Base + Telesalud + IA clínica (cuando existan) |
| Centros | Base + Obras sociales + Grupos y talleres |
| Adicionales | Internación (por cama), Enfermería y medicación, Cobros particulares, Gestión para Dirección, Liquidación, y las integraciones |

## Para revisar juntos

1. **¿Están bien los cortes?** En particular: ¿Grupos va incluido en Centros o se vende aparte? ¿Gestión para Dirección es un módulo o parte de Centros?
2. **Diferencia entre Inicio y Profesional.** Si los dos son "Base", hay que definir qué los distingue (límite de profesionales, de sedes, de almacenamiento de documentos).
3. **El contexto §11 promete cosas que no existen.** El plan Inicio incluye "recordatorios" (etapa 8.1) y Profesional, "links de pago" (2ª etapa). La web ya no los muestra, pero el contexto sí. Hay que sacarlos del plan o marcarlos como "Próximamente".
4. **Precio de cada módulo.** Falta calcular costos fijos y de soporte (contexto §11, "Antes de publicar").
5. **Período de prueba.** ¿Se puede activar un módulo por 30 días sin cargo?

## En el prototipo (después de aprobar)

En Configuración → Institución, una sección **Módulos** con una tarjeta por módulo: activo, inactivo o "Próximamente". Dirección puede encender o apagar un módulo; el menú cambia en el momento y queda registrado en la auditoría. Apagar uno del que dependen otros muestra cuáles hay que apagar antes.
