# 🏃‍♂️ Antigravity IA: Garmin & Intervals.icu Workout Standard

Este documento es el **CONTRATO OFICIAL** (Standard Operating Procedure) para cualquier terminal de Antigravity IA que deba generar entrenamientos dirigidos a Intervals.icu para ser exportados e interpretados por dispositivos Garmin de manera perfecta.

¡Cumplir estas reglas es mandatorio para garantizar la sincronización adecuada del cronómetro y pantallas del GPS!

## 0. Prerrequisito Crítico: Configuración del Atleta en Intervals.icu
Antes de que Antigravity IA envíe cualquier entrenamiento (y para que Intervals pueda mostrar las barras gráficas correctamente), el entrenador humano TIENE que realizar este paso manual e indelegable:

1. **Perfil Completo:** Crear y rellenar perfectamente el perfil del atleta en Intervals.icu (peso, edad, etc.).
2. **Métricas de Referencia:** Cargar obligatoriamente los "ritmos de carrera" basándose en las mejores marcas del atleta (test de 5K, 10K, Media Maratón, etc.). Si esto no se carga, el entrenamiento no se estructurará bien en el calendario web.
3. **Definir la Metodología (El Target):** La configuración en Intervals debe estar fijada explícitamente para interpretar los entrenamientos por **Ritmo (Pace)** y NO por Potencia (Power) ni Frecuencia Cardíaca (HR). 
*(Nota arquitectónica: La estructura del envío siempre dependerá de cómo el entrenador maneje a su grupo dictado en el `Methodology Engine`. En el caso del Escuadrón Rumbero, la variable regente es el **Ritmo**).*

## 1. Reglas de Oro (Core Rules)
1. **Idioma Estricto:** Siempre usar INGLÉS para las directivas (`Warmup`, `Run`, `Recover`, `Cooldown`). Esto estandariza la comunicación tecnológica y evita un mal parseo.
2. **Distancias Precisas:** Usar siempre KILÓMETROS (ej `0.4km`) cuando el objetivo de la serie se base en distancia. **¡NUNCA usar metros (`400m`)!** Intervals lo interpreta como minutos y destruye el entrenamiento.
3. **Control del Cronómetro Garmin:** Usar imperativamente `intensity=recovery` para los descansos. Al evitar la etiqueta estándar de descanso (`rest`), obligas a Garmin a mantener el reloj encendido temporizando el intervalo visiblemente al atleta.
4. **Agrupar Series (Chunks):** Usar siempre multiplicadores. Para series uniformes usa `[N]x` (ej: `10x`); para piramidales/variables usa `1x` como agrupador que contenga a todas adentro. Esto es vital para separar las distintas "Fases" del entreno.

## 2. Sintaxis de los Bloques

### Fase Inicial (Warmup)
- **Tag Principal:** `Warmup`
- **Etiqueta:** `intensity=warmup`
- **Formato:** Es recomendable usar rango de ritmos (pace) para que Intervals genere graficos en rampa.
*Ejemplo:*
`- Warmup 15m 8:01-6:37 pace intensity=warmup`

### Fase de Trabajo (Main Interval)
- **Prefijo Rítmico / Multiplicador:** Indicar el número de repeticiones (`Nx` o `1x` si son diferentes)
- **Segmento de Esfuerzo:** `Run` + Distancia (`km`) + ritmo (`pace`) + `intensity=interval`
- **Segmento de Recuperación:** `Recover` + Tiempo (`s`) + `intensity=recovery`
*Ejemplo para pasadas regulares:*
```markdown
10x
- Run 0.4km 4:45 pace intensity=interval
- Recover 80s intensity=recovery
```

### Fase Final (Cooldown)
- **Tag Principal:** `Cooldown`
- **Etiqueta:** `intensity=cooldown`
- **Formato:** Invierte el orden del Warmup.
*Ejemplo:*
`- Cooldown 5m 6:37-8:01 pace intensity=cooldown`

---

## 3. Ejemplos Completos Finalizados

### Caso A: Entrenamiento Uniforme (10x400)
```markdown
Warmup
- Warmup 15m 8:01-6:37 pace intensity=warmup

10x
- Run 0.4km 4:45 pace intensity=interval
- Recover 80s intensity=recovery

Cooldown
- Cooldown 5m 6:37-8:01 pace intensity=cooldown
```

### Caso B: Series Piramidales (Distancias variables)
```markdown
Warmup
- Warmup 15m 8:01-6:37 pace intensity=warmup

1x
- Run 0.3km 4:45 pace intensity=interval
- Recover 60s intensity=recovery
- Run 0.4km 4:45 pace intensity=interval
- Recover 80s intensity=recovery
- Run 0.5km 4:45 pace intensity=interval
- Recover 90s intensity=recovery

Cooldown
- Cooldown 5m 6:37-8:01 pace intensity=cooldown
```
