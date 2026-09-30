# Pantalla: Panel del día (recepción) y vistas de celular

> Referencia visual aprobada. Cada pantalla tiene su captura (`.png`) y su maqueta en HTML estático (`.html`) en esta misma carpeta. Al construirlas en React, respetar estructura, jerarquía, textos y estilos; los datos de las maquetas son ficticios. Colores, tipografía y componentes: `docs/diseno.md`.

Archivos:

- `panel-del-dia-escritorio.png` / `.html` — escritorio, rol Recepción (1440 × 1080).
- `mi-dia-celular-profesional.png` / `.html` — celular, rol Profesional (390 × 844).
- `sala-de-espera-celular-recepcion.png` / `.html` — celular, rol Recepción (390 × 844).

---

## 1. Panel del día — escritorio (recepción)

Es la pantalla de inicio de Recepción y Administración. Responde tres preguntas de un vistazo: quién está en el edificio, quién llega y qué hay que resolver hoy.

### Estructura

1. **Menú lateral** (248 px, blanco): logo, selector de institución y sede, grupos "Operación" (Panel del día, Agenda, Pacientes, Grupos y talleres, Internación) y "Administración" (Autorizaciones con contador, Prefacturación, Métricas). Abajo: Configuración y Ayuda. Solo muestra las secciones que el rol puede ver.
2. **Barra superior** (64 px): buscador global (paciente, DNI o profesional), avisos y usuario con su rol.
3. **Encabezado**: título "Panel del día", subtítulo con fecha, sede y cantidad de turnos. A la derecha: navegación de día (‹ Hoy ›), "Bloquear horario" (secundario) y "Nuevo turno" (único botón principal).
4. **Cuatro contadores** que funcionan como filtros al tocarlos: en sala de espera, espera de más de 15 minutos, turnos sin confirmar y autorizaciones por vencer. El activo lleva borde naranja de marca. Los que requieren atención muestran el número en color "Atención".
5. **Lista de turnos** (columna principal):
   - Filtros por estado con cantidad: Todos, Esperando, Por llegar, En consulta, Atendidos. Filtro por profesional a la derecha.
   - Columnas: Hora · Paciente (nombre + tipo de sesión) · Cobertura · Profesional (punto de color de disciplina + nombre) · Estado · Acción.
   - **Agrupada por dónde está el paciente**, en este orden: En consulta → En sala de espera → Por llegar. Encabezado de grupo en gris con cantidad.
   - Al pie: resumen de atendidos, con cuántos no tienen evolución escrita, y enlace para ver el resto.
6. **Columna derecha** (300 px):
   - **Profesionales hoy:** por profesional, estado actual ("En consulta", "Le esperan", "Libre hasta 12:30") y ocupación del día ("6 de 10 turnos" con barra).
   - **Para resolver hoy:** tareas accionables (renovar una autorización, reenviar recordatorios, evoluciones sin escribir). Cada ítem lleva a la pantalla donde se resuelve.

### Columna Cobertura (diferencial de producto)

Muestra la obra social y **una sola etiqueta** con lo más importante para ese turno, en este orden de prioridad:

1. Autorización vencida o por vencer → "Vence 2 oct" (Atención) o "Autorización vencida" (Error).
2. Copago o saldo pendiente → "Copago pendiente" (Atención).
3. Consumo de la autorización → "Sesión 5 de 12" (neutra).
4. Particular sin deuda → sin etiqueta.

### Ciclo de un turno y acción por fila

Cada fila tiene **un solo botón**, según el estado:

| Estado | Etiqueta de estado | Botón |
|---|---|---|
| Por llegar, confirmado | "Confirmó" (Éxito) | Marcar llegada (secundario) |
| Por llegar, sin confirmar | "Sin confirmar" (Atención) | Marcar llegada (secundario) |
| En sala de espera | "Espera N min"; en Atención a partir de 15 min | Hacer pasar (naranja suave) |
| En consulta | reloj + minutos en consulta (naranja suave) | Finalizar (secundario) |
| Atendido | — | (se ve desde "Atendidos") |
| Ausente | "Ausente" (Error) | — |

El resto de las acciones (reprogramar, cancelar, cobrar, ver ficha) van en el menú de la fila o al abrir el turno, nunca como botones sueltos.

Cada cambio de estado registra fecha, hora y usuario (auditoría) y actualiza los tiempos de espera.

---

## 2. Mi día — celular (profesional)

Pantalla de inicio del profesional en el celular. Prioriza lo que está pasando ahora.

1. **Encabezado:** símbolo de Ronda, "Mi día", nombre y disciplina del profesional, avisos.
2. **Fecha y cantidad de turnos**, con selector Día / Semana.
3. **Aviso de evoluciones pendientes** (franja "Atención"), si las hay. Lleva a la lista para escribirlas.
4. **Tarjeta "En consulta"**: hora de inicio, minutos transcurridos, paciente, tipo de sesión, cobertura y número de sesión. Botones: **Evolución** (principal) y **Ver historia**.
5. **Tarjeta "Siguiente"**: paciente, hora, si ya llegó y cuánto espera. Botón **Hacer pasar**.
6. **Más tarde**: el resto del día (hora, paciente, tipo, estado de confirmación). Incluye bloqueos de agenda.
7. **Barra inferior**: Mi día, Agenda, Pacientes, Más.

Si no hay nadie en consulta, la tarjeta principal pasa a ser la del próximo paciente.

---

## 3. Sala de espera — celular (recepción)

Para recepción cuando no está en la PC, o en centros sin computadora en el mostrador.

1. **Encabezado:** "Sala de espera", sede y fecha.
2. **Buscador** de paciente o DNI.
3. **Selector** Esperando · Por llegar · En consulta, con cantidades.
4. **Tarjetas de paciente**: nombre, hora del turno, profesional (punto de disciplina), tiempo de espera (en "Atención" desde 15 min), obra social con su etiqueta de cobertura. Botón grande **Hacer pasar** y menú "Más acciones" (reprogramar, cobrar, marcar ausente, ver ficha).
5. **Botón fijo "Nuevo turno"** sobre la barra inferior.
6. **Barra inferior**: Panel, Agenda, Pacientes, Más.

Áreas táctiles de 44 px como mínimo en todos los botones.

---

## Relación con el modelo de datos

Esta pantalla necesita, como mínimo:

- `appointment` con estados: `scheduled` → `confirmed` → `arrived` → `in_session` → `completed`, más `no_show` y `cancelled`. Cada transición con marca de tiempo (`arrived_at`, `started_at`, `finished_at`) para calcular espera y duración.
- Confirmación del turno (por WhatsApp o manual) con su origen.
- Vínculo turno ↔ autorización, para mostrar "sesión N de M" y vencimientos.
- Saldo de copago o deuda por paciente.
- Vínculo turno ↔ evolución, para detectar evoluciones pendientes.
- Bloqueos de agenda por profesional o consultorio.
