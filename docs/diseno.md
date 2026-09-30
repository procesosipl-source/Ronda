# Ronda — Guía de diseño visual

> Toda pantalla nueva respeta este archivo. Las pantallas ya diseñadas en detalle están en `docs/pantallas/` (captura, maqueta HTML y especificación) y tienen prioridad sobre la demo. Si algo no está definido en ninguno de los dos, seguí el prototipo (`docs/prototipo/ronda-demo.html`) y proponé agregarlo a esta guía.

## Estilo general

Referencia de estilo: aplicaciones de gestión para salud mental ambulatoria del tipo SimplePractice. Interfaz **limpia, clara y tranquila**, con los colores de IPL: blanco, naranja y gris.

Principios:

1. **Blanco y gris dominan; el naranja se usa poco.** El naranja marca lo que se puede hacer (botón principal, enlace, ítem activo), no decora. Si una pantalla tiene más de uno o dos elementos naranjas fuertes, sobra naranja.
2. **Mucho aire.** Espaciado generoso, pocas líneas divisorias, tarjetas blancas sobre fondo gris muy claro.
3. **Una acción principal por pantalla.** Un solo botón naranja relleno; el resto, botones secundarios (blancos con borde) o enlaces.
4. **Jerarquía por peso y tamaño, no por color.** Títulos en gris casi negro; información secundaria en grises más claros.
5. **El color de estado nunca es la única señal.** Siempre va con un texto ("Presente", "Vence el 5 oct") o un ícono.
6. **Pensada para el celular** en las pantallas de enfermería y profesionales: botones grandes, una columna, sin tablas anchas.

## Paleta

| Token | Valor | Uso |
|---|---|---|
| `--brand` | `#F07D00` | Naranja IPL de marca: logo, indicador de ítem activo, anillo de foco. **Nunca para texto sobre blanco** (contraste 2,75:1, insuficiente). |
| `--primary` | `#B8520A` | Naranja de acción: botones principales, enlaces, pestaña y chip activos. Contraste 4,94:1 sobre blanco (cumple WCAG AA). |
| `--primary-hover` | `#9A3F07` | Hover y presionado del botón principal. |
| `--primary-ink` | `#FFFFFF` | Texto sobre botón principal. |
| `--primary-soft` | `#FFF1E6` | Fondo de ítem activo del menú, avisos informativos, selección. |
| `--bg` | `#F6F7F9` | Fondo de la aplicación. |
| `--surface` | `#FFFFFF` | Tarjetas, paneles, menú lateral, barra superior, modales. |
| `--sunk` | `#F0F1F4` | Fondos hundidos: hover de filas, columnas del tablero, campos deshabilitados. |
| `--line` | `#E5E7EB` | Bordes y divisores. |
| `--ink` | `#1F2328` | Texto principal y títulos. |
| `--ink-2` | `#4B5563` | Texto secundario. |
| `--ink-3` | `#6B7280` | Texto terciario: fechas, ayudas, etiquetas de columnas. Es el gris más claro permitido para texto. |

### Estados

| Estado | Texto | Fondo | Uso |
|---|---|---|---|
| Éxito | `#1E7A4C` | `#E3F4EA` | Presente, firmado, cobrada, administrada. |
| Atención | `#8A6100` | `#FEF6D8` | Pendiente, por vencer, borrador. Es ocre/amarillo a propósito, para no confundirse con el naranja de marca. |
| Error / riesgo | `#B42318` | `#FDECEA` | Ausente, vencido, rechazado, no administrada, acceso denegado. |

### Colores por disciplina

Se usan como punto o franja lateral en agenda e historia clínica; nunca como fondo grande. Ninguno es naranja, para no competir con la marca.

| Disciplina | Color |
|---|---|
| Psicología | `#2563EB` |
| Psiquiatría | `#7C3AED` |
| Trabajo social | `#0891B2` |
| Enfermería | `#059669` |
| Nutrición | `#65A30D` |
| Grupal | `#DB2777` |

Estos colores son configurables por institución en el futuro. Por ahora quedan fijos.

### Solo modo claro

Ronda se usa **únicamente en modo claro**, aunque el sistema operativo o el navegador estén en modo oscuro. No se implementan temas oscuros ni se usa `prefers-color-scheme: dark`. Declarar `<meta name="color-scheme" content="light">` y `color-scheme: light` en `:root`.

## Tipografía

- **Interfaz:** Instrument Sans (Google Fonts), con respaldo `system-ui, "Segoe UI", sans-serif`. Pesos 400, 500, 600 y 700.
- **Texto clínico largo** (evoluciones, adendas, HC impresa): Newsreader (Google Fonts), con respaldo `Georgia, serif`. Es la única excepción a la tipografía sans: mejora la lectura de textos largos y diferencia visualmente lo que escribió un profesional de la interfaz. Si se decide eliminarla, todo queda en Instrument Sans.
- **Escala:** título de página 1,6–1,8 rem (600); título de panel 1,15 rem (600); cuerpo 15 px; secundario 0,84 rem; mínimo 0,76 rem, solo para etiquetas.
- **Números en tablas y horarios:** `font-variant-numeric: tabular-nums`.

## Forma y espaciado

- **Radios:** 8 px en botones, campos y chips; 12 px en tarjetas y paneles; 14 px en modales; píldora completa en etiquetas de estado.
- **Sombras:** mínimas. Tarjetas con `0 1px 2px rgba(16,24,40,.04)`. Nada de sombras marcadas.
- **Espaciado:** múltiplos de 4 px. Padding de paneles 14–18 px; separación entre bloques 20 px; márgenes de página 28 px en escritorio y 16 px en celular.
- **Ancho máximo del contenido:** 1180 px.

## Estructura de la aplicación

- **Menú lateral blanco** a la izquierda (232 px) con el logo, la institución activa y las secciones que el rol puede ver. El ítem activo lleva fondo `--primary-soft`, texto `--primary` y una franja `--brand` a la izquierda. Los contadores de pendientes van en píldora de "Atención".
- **Barra superior blanca** con la persona usuaria, su rol y, si pertenece a varias instituciones, el selector de institución.
- **En celular** (menos de 900 px) el menú lateral pasa a una barra horizontal desplazable arriba, y todo el contenido va en una columna.

## Componentes

- **Botón principal:** fondo `--primary`, texto blanco, 600. Uno por pantalla.
- **Botón secundario:** fondo blanco, borde `--line`, texto `--ink`.
- **Enlace o botón terciario:** sin fondo, texto `--primary`.
- **Chips de filtro:** blancos con borde; el activo con fondo `--primary-soft`, borde y texto `--primary`.
- **Pestañas:** subrayado de 2 px `--brand` en la activa, texto `--primary`.
- **Etiquetas de estado:** píldora con colores de la tabla de Estados. Siempre con texto.
- **Tablas:** encabezados en `--ink-3`, 0,8 rem; filas separadas por `--line`; hover `--sunk`. Si no entran, la tabla se desplaza horizontalmente dentro de su panel, nunca la página.
- **Tarjetas de turno en la agenda:** fondo suave con franja izquierda de 3 px del color del estado (programado = naranja suave, presente = éxito, ausente = error).
- **Historia clínica:** línea de tiempo con franja lateral del color de la disciplina; texto de la evolución en Newsreader; firma y huella en gris claro debajo.
- **Modales:** para crear o confirmar algo corto. Máximo ~560 px de ancho. Si el formulario es largo, usar una pantalla completa.
- **Avisos breves (toast):** abajo al centro, fondo `--ink`, desaparecen solos.
- **Estados vacíos:** una frase útil que diga qué hacer, nunca solo "Sin datos".

## Textos

- Español rioplatense, voz activa, tuteo con voseo ("Registrá", "Buscá").
- Botones con verbo y objeto: "Firmar evolución", "Agendar turno", no "Aceptar".
- Nada de jerga técnica en la interfaz (no "registro", "sincronizar", "entidad").
- Fechas cortas: "lun 5 oct"; largas: "Lunes 5 de octubre". Horas en 24 h.

## Accesibilidad (mínimos)

- Contraste AA en todo texto (4,5:1; 3:1 en textos grandes y bordes de controles).
- Foco visible con anillo `--brand` de 2 px en todo elemento interactivo.
- Todo se puede usar con teclado.
- Áreas táctiles de al menos 40 × 40 px en celular.
- Respetar "reducir movimiento" del sistema.

## Logo

Archivos en `public/brand/` (o `docs/marca/` hasta que exista el frontend).

**Concepto "Recorrido":** un anillo abierto con un punto naranja en el hueco. Representa la ronda en marcha, el cuidado que rodea a la persona, y al mismo tiempo es la "o" de la palabra. El hueco está girado 40° hacia la derecha para transmitir movimiento y evitar que se confunda con el símbolo de encendido/apagado.

| Archivo | Uso |
|---|---|
| `ronda-logotipo.svg` | Logo principal sobre fondos claros: menú lateral, inicio de sesión, documentos PDF. |
| `ronda-logotipo-negativo.svg` | Sobre fondos oscuros (gris `#1F2328`). |
| `ronda-logotipo-sobre-naranja.svg` | Sobre el naranja de marca. |
| `ronda-simbolo.svg` | Solo el símbolo, sobre fondo claro: espacios chicos, cargas, marca de agua. |
| `ronda-simbolo-blanco.svg` / `ronda-simbolo-negativo.svg` | Símbolo sobre naranja / sobre gris oscuro. |
| `favicon.svg`, `favicon-32.png`, `favicon-16.png` | Pestaña del navegador. |
| `icono-app.svg`, `apple-touch-icon.png` (180), `icono-192.png`, `icono-512.png` | Ícono al instalar la app en el celular (PWA). |

Reglas:

- El texto del logotipo está convertido a trazos (Instrument Sans Bold): no se reescribe con una fuente.
- No cambiar colores fuera de las versiones de arriba, no deformar, no rotar, no agregar sombras ni contornos.
- Espacio libre alrededor: como mínimo la altura del punto naranja multiplicada por dos.
- Tamaño mínimo: logotipo 80 px de ancho; símbolo 16 px (en ese tamaño usar `favicon.svg`, que tiene trazo más grueso).
- En la interfaz, el logotipo va arriba del menú lateral con 30 px de alto.

## Pendiente

- [ ] Confirmar el naranja exacto de la marca IPL (el `#F07D00` es una aproximación) y, si hay, el gris institucional. Si el naranja oficial cambia, recalcular `--primary` para mantener el contraste 4,5:1 sobre blanco.
- [x] Logo definitivo de Ronda (concepto "Recorrido").
