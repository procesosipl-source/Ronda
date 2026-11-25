# 0004 — Orden de construcción: Agenda, Historia clínica, Coberturas, Internación

- **Fecha:** 25 de noviembre de 2026
- **Estado:** Aceptada
- **Afecta a:** El orden de las etapas 2 a 5 del roadmap (contexto §10) y el plan semanal (`docs/plan.md`).

## Contexto

El roadmap original empezaba por **coberturas y prefacturación** como piloto, para reemplazar la App de Conexión: pocos usuarios, valor inmediato y sin tocar la historia clínica (contexto §9).

Ahora sabemos dos cosas que cambian ese razonamiento:

1. **El primer cliente probable es Clínica Di Ferro**, que usa la **app AppSheet principal** (pacientes, agenda, evoluciones, HC, internación, enfermería y medicación). **La App de Conexión es de otra institución.** Empezar por coberturas no le reemplaza nada a Di Ferro.
2. **Di Ferro interna pacientes**, así que internación, enfermería y medicación entran en el MVP.

Además, hay una sola persona trabajando unas 10 horas por semana, y necesita resultados visibles cada semana para mostrar.

## Decisión

Después de Fundaciones y Datos maestros (iguales en cualquier orden), los módulos se construyen así:

1. **Agenda y turnos** (etapa 3).
2. **Registro clínico e historia clínica** (etapa 4).
3. **Coberturas y prefacturación** (etapa 2).
4. **Internación, enfermería y medicación** (etapa 5).

Los números de etapa se mantienen como **nombre** de cada etapa, porque se usan en muchos documentos. Lo que cambia es el orden en que se construyen.

## Alternativas descartadas

**Coberturas → Agenda → HC (el orden original).** Tenía sentido para reemplazar Conexión. Para Di Ferro no reemplaza nada de lo que usa hoy y no muestra avances a quienes van a usar Ronda todos los días.

**Agenda → Coberturas → HC.** Dejaba la historia clínica al final, cuando la consulta legal ya estuviera resuelta. Se descarta porque la HC es el centro de lo que usa Di Ferro y porque agenda e HC dependen una de la otra en el día a día (del turno se pasa a la evolución).

## Consecuencias

- La agenda es lo primero que se puede poner en uso real (hacia mayo de 2027), con AppSheet todavía como respaldo.
- La migración ya no empieza por Conexión: el plan de contexto §9 queda como referencia para cuando Conexión (u otra institución con ese perfil) se sume.
- Mientras no esté hecha la internación, Di Ferro usa Ronda y AppSheet a la vez. Hay que cuidar que no carguen lo mismo en los dos lados (riesgo de fatiga por doble carga, contexto §9).
- La consulta legal sobre HC digital y firma de evoluciones tiene que estar avanzada antes de la etapa 4 (semana 16 del plan).
