# DrApp — análisis de competidor

> Relevado el 15/10/2026 a partir de [drapp.com.ar](https://www.drapp.com.ar/), su página de [IA](https://www.drapp.com.ar/ia), [precios](https://www.drapp.com.ar/precios) y su [centro de ayuda](https://ayuda.drapp.com.ar/). No entramos a la aplicación: lo que dice de las pantallas sale de los textos de ayuda, no de capturas. Para ver las pantallas reales, ver "Próximos pasos".
>
> **Por qué importa:** Casa Nida, posible primera cliente, usa DrApp para historia clínica y agenda, con turnos online enlazados desde Instagram. Para que se pasen a Ronda, Ronda tiene que resolverles eso al menos igual de bien.

## 1. Qué es DrApp

Sistema para consultorios y centros médicos de la empresa Grupo Cormos. Está pensado para **atención médica ambulatoria**: tiene receta electrónica, signos vitales, odontograma y percentiles, y nada de internación, grupos ni gestión de obras sociales.

- **Precio:** desde $34.700 + IVA por profesional por mes. Usuarios ilimitados (recepción y administración no pagan). Más de 15 profesionales, cotización a medida. Prueba gratis de 15 días sin tarjeta.
- **Adicionales:** los avisos automáticos por WhatsApp se contratan aparte, por medio de un asesor.
- **Además ofrece:** app para celular, multi-sede, roles y permisos, API pública, y exportación y backup de los datos.

## 2. Funcionalidades

| Área | Qué tiene DrApp | ¿Lo tiene Ronda? |
|---|---|---|
| Agenda | Vista del día con filtros por profesional y estado. Vista "Lista" y "Semana". Bloqueos de días u horarios. Sobreturnos. Imprimir o descargar la agenda del día | Sí, diseñada (flujos 04 a 07 y Panel del día) |
| Nuevo turno | Desde un hueco del calendario o desde el atajo "+" | Sí, desde la agenda (flujo 04) |
| Sesiones recurrentes | Cantidad de turnos + frecuencia (semanal, quincenal o mensual). Muestra las fechas antes de crearlas. Se cancela una sesión o todas las futuras | Sí (serie con fecha de fin, flujo 04) |
| Estados del turno | Reservado → Esperando → En consulta → Atendido · Cancelado · Ausente | Sí, con tiempos de espera y confirmación |
| **Turnos online** | **Página web de turnos propia del consultorio** (un link para compartir, por ejemplo en Instagram) y marketplace **Crontu**, donde el paciente paga $1.000 de gestión o una seña | **No. No está en ninguna etapa** |
| Bloquear paciente | Le impide sacar turnos online; recepción le puede seguir dando turnos | No |
| WhatsApp manual | Tocás el teléfono del paciente en la agenda y se abre WhatsApp Web con el mensaje armado | No (solo el automático, etapa 8.1) |
| WhatsApp automático | Recordatorio, confirmación, cancelación y reprogramación. Con costo extra | Etapa 8.1 |
| Historia clínica | Ver punto 4 | Sí, etapa 5 |
| Pacientes | Alta con DNI que evita duplicados y ofrece **fusionar**. Eliminados en rojo y **restaurables**. Reporte en CSV | Parcial: DNI único y borrado lógico, sin fusión ni restauración en pantalla |
| Telemedicina | Videollamada propia (DrApp Meet) con link automático | Etapa 8.3 |
| Recetas y órdenes | Receta electrónica (Farmalink, Innovamed), órdenes de laboratorio e imágenes | Etapa 8.5 |
| Cobros | Link de Mercado Pago, cobro anticipado, factura ARCA | 2ª etapa y 8.2 |
| IA | Resumen de HC, grabación de consulta → borrador de evolución, asistente por voz o texto ("dame un turno para Julia el martes a la tarde"), **Copiloto**: avisa cada mañana qué turnos tienen riesgo de ausencia y qué huecos llenar | Etapa 8.4 (borrador y resumen) |
| Obras sociales | Solo cobertura y número de afiliado en la ficha, para recetas | **Sí, y es nuestro fuerte**: autorizaciones, reglas de cobertura, prefacturación |
| Grupos, internación, medicación | No | Sí (etapas 4 y 5) |
| Exportación | Backup de la cuenta, CSV de pacientes y de turnos | Importador en etapa 8 |

## 3. Cómo están armadas las vistas

Sale de la ayuda; hay que confirmarlo con capturas reales.

**Agenda del día.** A la izquierda, un panel de filtros (profesional y estado). En el centro, los turnos del día. Cada turno tiene tres acciones a la derecha:
- **"Empezar"**: abre la historia clínica del paciente y arranca el cronómetro de la consulta. Un solo toque del profesional pasa de la agenda a escribir.
- **Botón de estado**: muestra el estado actual; al tocarlo se elige el siguiente.
- **Teléfono**: abre WhatsApp con el mensaje del turno armado.

**Formulario "Nuevo turno".** Campos, en orden: Paciente (buscar por apellido o DNI, o "Crear paciente") · Profesional · Servicio · Cobertura · Ubicación (solo si hay más de una) · Día y horario. Opciones: nota interna, mensaje para el paciente, estado (por defecto "Reservado"), notificar al paciente (tildado por defecto), "computar" (si ocupa disponibilidad), telemedicina, sobreturno. Botón "Guardar". En "Sesiones" se pasa a crear una serie.

**Historia clínica.** Una sola página, no pestañas. Un botón **"Filtros"** elige qué secciones se ven (evoluciones, archivos, diagnósticos, signos vitales, recetas, formularios) y queda guardado. La evolución es un campo amarillo grande que **se guarda solo** mientras se escribe; las anteriores se listan en una columna lateral con fecha y autor. Desde el mismo campo se agregan archivos, diagnósticos (CIE-10), signos vitales, recetas y órdenes. Botones "+ Archivo", "+ Diagnóstico", "+ Tratamiento", "+ Signos vitales", "Resumen IA", "Visibilidad HCE", "Anotaciones" (notas fuera de la HC) e "Imprimir" (imprime lo que muestran los filtros).

**Página de turnos online.** Se configura con un nombre y un mensaje de bienvenida; después se copia el link con "Copy". El paciente ve la disponibilidad real y el turno cae en la agenda marcado con su origen ("Creado por Crontu").

## 4. Historia clínica: DrApp contra Ronda

| Tema | DrApp | Ronda |
|---|---|---|
| Editar o borrar una evolución | El autor puede, **durante 24 horas** | Borrador editable por su autor; **firmada, nunca**. Las correcciones van como adenda (regla 5) |
| Quién la ve | Botón "Visibilidad HCE", por paciente o general | Equipo tratante con vigencia (flujo 03) |
| Auditoría de quién la miró | No la menciona | Sí (regla 7, flujo 22) |
| Formularios | Editor de formularios a medida | Descartado a propósito: "un editor genérico de formularios" está en las personalizaciones a evitar |
| Orientación | Medicina general: signos vitales, recetas, odontograma | Salud mental: evoluciones, grupos, equipo tratante |

**Argumento de venta para Casa Nida:** en DrApp una evolución se puede borrar hasta un día después. En Ronda, lo firmado queda fijo, se corrige con adendas y se registra quién lo leyó. Así lo pide la Ley 26.529 de derechos del paciente, y es lo que protege a la clínica ante un reclamo.

## 5. Qué conviene traer a Ronda

### Imprescindible para Casa Nida

1. **Turnos online (nuevo módulo).** Hoy no está en el plan, y es lo que Casa Nida usa con Instagram. Propuesta:
   - Una página pública por institución con un link fijo (por ejemplo `ronda.app/t/casa-nida`) para poner en la bio de Instagram, en Google Maps y en WhatsApp.
   - La disponibilidad sale del mismo cálculo del flujo 04 (plantilla − excepciones − turnos tomados). No hace falta inventar nada nuevo.
   - **Configurable por institución** (regla 11): qué profesionales y qué tipos de sesión se ofrecen online; anticipación mínima y máxima; si el turno queda confirmado o pendiente de que recepción lo acepte; si un paciente nuevo puede reservar o solo los que ya están en tratamiento.
   - **Salud mental:** un paciente nuevo que reserva solo debería entrar como Preadmisión, o pedir "primera entrevista" en lugar de un turno común. Hay que preguntarle a Casa Nida cómo lo hacen hoy.
   - **Seguridad:** la página no tiene usuario, así que nunca lee la base directo. Pasa por una Edge Function que solo devuelve franjas libres (sin nombres de pacientes), con límite de pedidos y captcha para evitar reservas falsas. El paciente se identifica con DNI y teléfono.
   - **Bloquear paciente para turnos online**, como DrApp.
   - El turno guarda su **origen** (recepción, online, profesional) para medirlo después.
2. **Buscar el próximo turno libre, para la llamada.** El caso que contaron: llama un paciente y la secretaria tiene que ver rápido qué hay. DrApp obliga a elegir profesional y mirar el calendario. Podemos mejorarlo: en "Nuevo turno", un paso **"Buscar disponibilidad"** con filtros de disciplina, profesional, tipo de sesión, día de la semana y mañana o tarde, que lista las **próximas franjas libres de todos los profesionales que cumplen**. Un toque reserva. Es una ventaja concreta sobre DrApp.
3. **Importar desde DrApp.** Casa Nida no va a empezar de cero. DrApp exporta pacientes y turnos en CSV y hace backup de la cuenta. Hay que adelantar una parte del importador (etapa 8) al menos para pacientes y turnos futuros. Ver la advertencia de datos reales en "Próximos pasos".

### Fácil y barato, conviene adelantarlo

4. **WhatsApp manual desde la agenda.** Un enlace `wa.me` con el mensaje armado (fecha, hora, profesional, dirección). No usa la API de WhatsApp, no cuesta nada por mensaje y se puede tener en la etapa 4. El automático sigue en la 8.1.
5. **"Empezar" en la fila del turno.** Pasa el turno a "En consulta" y abre el borrador de evolución ya vinculado al turno. El "Mi día" del celular ya lo tiene ("Evolución"); hay que sumarlo a la agenda de escritorio del profesional.
6. **Vista previa de las fechas al crear una serie**, marcando las que caen en feriados, bloqueos o sobre otro turno. También cancelar "solo esta" o "esta y las siguientes".
7. **Autoguardado del borrador** de evolución, para no perder lo escrito si se corta internet. Solo el borrador: lo firmado no cambia.
8. **Detectar duplicados por DNI con opción de fusionar**, y restaurar pacientes dados de baja por error (borrado lógico).
9. **Imprimir la HC según lo que se está viendo** (filtros por tipo y por fecha), sumado a la auditoría del flujo 10.

### Para más adelante

10. **Copiloto de ausencias:** "estos 3 turnos de hoy tienen riesgo de ausencia, estos 2 huecos se pueden llenar". Encaja con la etapa 7 (indicadores) y con "Para resolver hoy" del Panel del día.
11. **Asistente por voz o texto** para agendar. Va con la etapa 8.4.
12. **Cobro de seña al reservar online** (Mercado Pago), para bajar las ausencias. Va con cobros particulares.

### Lo que no conviene copiar

- **Editar o borrar evoluciones durante 24 horas.** Choca con la regla 5.
- **Editor de formularios libre.** Lo descartamos a propósito. Si Casa Nida necesita una escala o un formulario puntual (por ejemplo, una entrevista de admisión), va como plantilla de evolución del catálogo, no como editor libre.
- **Marketplace propio (Crontu).** Necesita masa crítica de profesionales y no es nuestro foco. Alcanza con la página propia de cada institución.
- **"Anotaciones" fuera de la HC.** En salud mental es una zona gris legal: lo que se escribe sobre un paciente forma parte de su historia. Si se hace, con reglas claras y auditoría.

## 6. Impacto en el plan

Hoy el orden es: autorizaciones y prefacturación (3) → agenda (4) → historia clínica (5). Para Casa Nida lo primero es **agenda, turnos online e historia clínica**. Antes de cambiar nada hay que decidir:

- ¿Adelantamos agenda e historia clínica antes que autorizaciones, o las hacemos en paralelo?
- ¿Dónde entra el módulo de turnos online? Propuesta: código `online_booking`, que requiere Base, en la misma etapa que la agenda.
- ¿Adelantamos el importador de pacientes y turnos?

Si se decide, se registra como ADR en `docs/decisiones/` y se actualizan `CLAUDE.md`, `contexto-proyecto.md` y `modulos.md`.

## 7. Preguntas para Casa Nida

1. ¿Cuántos profesionales atienden y de qué disciplinas? ¿Una sede o varias?
2. ¿Trabajan con obras sociales, con autorizaciones? ¿O todo es particular?
3. ¿Tienen grupos, talleres u hospital de día?
4. Turnos online: ¿quién reserva solo, pacientes nuevos o también los que ya están en tratamiento? ¿El turno queda firme o lo revisa la secretaria? ¿Cobran seña?
5. ¿Qué mensajes le mandan hoy al paciente (recordatorio, confirmación)? ¿Pagan los avisos automáticos de DrApp?
6. ¿Qué es lo que **más** les molesta de DrApp? ¿Y qué no quieren perder?
7. ¿Cómo escriben hoy las evoluciones? ¿Usan formularios o plantillas?
8. ¿Cuántos pacientes y cuántos años de historia clínica tienen cargados? ¿Pueden pedirle a DrApp el backup completo?
9. ¿Cuánto pagan hoy por mes?

## 8. Próximos pasos

- **Ver las pantallas reales.** Lo mejor: que Casa Nida nos muestre DrApp en uso un rato, o sacar la prueba gratis de 15 días y cargar **solo datos inventados**. Con capturas propias armamos la comparación visual.
- **Datos reales (regla 8).** Si Casa Nida nos pasa un export de DrApp, **no se abre en desarrollo ni se sube al repo**. Para diseñar el importador alcanza con los nombres de las columnas, o con un archivo de ejemplo armado a mano con datos ficticios. La importación real se hace después, en producción.
- Definir con el equipo los puntos de la sección 6.

## Fuentes

- [drapp.com.ar](https://www.drapp.com.ar/) · [IA](https://www.drapp.com.ar/ia) · [Precios](https://www.drapp.com.ar/precios)
- Centro de ayuda: [índice](https://ayuda.drapp.com.ar/) · [Crear un nuevo turno](https://ayuda.drapp.com.ar/como-crear-un-nuevo-turno) · [Turnos recurrentes](https://ayuda.drapp.com.ar/crear-turnos-recurrentes-o-sesiones) · [Estados del turno](https://ayuda.drapp.com.ar/gestion%C3%A1-el-estado-de-los-turnos) · [Agenda del día](https://ayuda.drapp.com.ar/como-utilizar-la-agenda) · [Historia clínica](https://ayuda.drapp.com.ar/gestionar-historia-clinica-electronica) · [Página web de turnos](https://ayuda.drapp.com.ar/configurar-pagina-web-personalizada) · [Crontu](https://ayuda.drapp.com.ar/crontu-la-nueva-forma-de-conectar-pacientes-con-profesionales-de-salud) · [Avisos por WhatsApp](https://ayuda.drapp.com.ar/avisos-autom%C3%A1ticos-por-whatsapp-a-pacientes) · [Bloquear paciente](https://ayuda.drapp.com.ar/bloquear-un-paciente-para-restringir-que-tome-turnos-online) · [Pacientes](https://ayuda.drapp.com.ar/como-utilizar-la-seccion-pacientes) · [Disponibilidad avanzada](https://ayuda.drapp.com.ar/configurar-pr%C3%A1cticas-espec%C3%ADficas-para-determinadas-coberturas-consultorios-u-horarios)
- [DrApp Pro en App Store](https://apps.apple.com/ar/app/drapp-pro/id1568156396)
