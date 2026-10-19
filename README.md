# Ronda

Plataforma web para gestionar centros de salud mental: pacientes, agenda, historia clínica, grupos, internación, medicación, autorizaciones de obras sociales y prefacturación. La desarrolla IPL – Ingeniería de Procesos Luján.

- **Reglas del proyecto y glosario:** [`CLAUDE.md`](CLAUDE.md). Leelo antes de tocar código.
- **Contexto, alcance y plan:** [`docs/contexto-proyecto.md`](docs/contexto-proyecto.md).
- **Diseño visual:** [`docs/diseno.md`](docs/diseno.md).

## Qué necesitás instalado

| Programa | Para qué |
|---|---|
| [Node.js 24](https://nodejs.org/) o más nuevo | Correr la aplicación y las herramientas |
| [Git](https://git-scm.com/) | Guardar y compartir los cambios |
| [Docker Desktop](https://www.docker.com/products/docker-desktop/) | Levantar una copia de la base en tu computadora y correr los tests de la base |

La Supabase CLI no se instala aparte: viene con el proyecto y se usa con `npx supabase`.

## Primera vez

```bash
npm install                 # descarga las librerías
cp .env.example .env.local  # crea tu archivo de configuración
```

Completá `.env.local` con la URL y la **clave publicable** de `ronda-dev` (panel de Supabase → Project Settings → API Keys). La clave secreta nunca va en ese archivo: si la ponés por error, la aplicación no arranca y te avisa.

## Comandos de todos los días

| Comando | Qué hace |
|---|---|
| `npm run dev` | Abre la aplicación en http://localhost:5173 y se actualiza sola al guardar |
| `npm test` | Corre los tests |
| `npm run typecheck` | Revisa que los tipos de TypeScript estén bien |
| `npm run lint` | Busca errores comunes en el código |
| `npm run build` | Arma la versión para publicar, en `dist/` |

Antes de dar una tarea por terminada, `npm test` y `npm run typecheck` tienen que pasar.

## Base de datos (Supabase)

Todo cambio de la base se hace con un archivo en `supabase/migrations/`, nunca desde el panel de Supabase.

```bash
npx supabase login                              # una sola vez
npx supabase link --project-ref <ref-de-ronda-dev>
npx supabase start                              # base local (necesita Docker)
npx supabase migration new <nombre>             # nueva migración
npx supabase db reset                           # reconstruye la base local con migraciones + seed
npx supabase test db                            # tests pgTAP de supabase/tests/
```

Los datos de `supabase/seed.sql` son **ficticios**. Nunca se cargan datos de pacientes reales en desarrollo.

## Estructura

```
src/app          rutas, proveedores y pantallas generales
src/features     un directorio por módulo (patients, appointments…)
src/components   componentes de interfaz reutilizables
src/lib          cliente de Supabase y utilidades
public/brand     logo e íconos
supabase/        migraciones, Edge Functions, tests y seed
docs/            contexto, decisiones, flujos, pantallas y prototipo
```

## Publicación

El frontend se publica en Vercel desde la rama `main`. Las variables `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` se cargan en el panel de Vercel, no en el repositorio.
