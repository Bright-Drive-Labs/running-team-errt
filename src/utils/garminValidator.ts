/**
 * GARMIN WORKOUT RULES VALIDATOR
 * Valida que los markdown_payload cumplan con el estándar oficial
 *
 * IMPORTANTE: Este validador NO modifica nada.
 * Solo detecta problemas y proporciona feedback claro.
 *
 * Referencia: GARMIN_WORKOUT_RULES.md
 */

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  summary: string;
}

export interface ValidationError {
  line: number;
  message: string;
  severity: 'critical' | 'major';
}

export interface ValidationWarning {
  line: number;
  message: string;
}

/**
 * Validar que un markdown_payload cumple con Garmin Workout Rules
 */
export function validateGarminWorkout(markdown: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const lines = markdown.split('\n');

  // REGLA 1: Debe tener al menos Warmup y Cooldown
  const hasWarmup = /warmup/i.test(markdown);
  const hasCooldown = /cooldown/i.test(markdown);

  if (!hasWarmup) {
    errors.push({
      line: 1,
      message: 'Falta sección "Warmup". Requerida al inicio del entrenamiento.',
      severity: 'critical'
    });
  }

  if (!hasCooldown) {
    errors.push({
      line: lines.length,
      message: 'Falta sección "Cooldown". Requerida al final del entrenamiento.',
      severity: 'critical'
    });
  }

  // REGLA 2: Verificar idioma (inglés)
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    const lowerLine = line.toLowerCase();

    // Palabras en español prohibidas en directivas
    const spanishDirectives = ['calentamiento', 'carrera', 'descanso', 'enfriamiento', 'zona'];
    spanishDirectives.forEach(word => {
      if (lowerLine.includes(word) && (lowerLine.includes('run') || lowerLine.includes('recover') || lowerLine.includes('warmup'))) {
        warnings.push({
          line: lineNum,
          message: `Posible mezcla de idiomas. Usa solo inglés para directivas.`
        });
      }
    });
  });

  // REGLA 3: NUNCA usar metros (m), solo kilómetros (km)
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (/\d+\s*m\s+(?:pace|speed|run|interval)/.test(line) && !line.includes('km')) {
      errors.push({
        line: lineNum,
        message: `❌ CRÍTICO: Detectado "m" (metros). Usa SIEMPRE "km" (kilómetros). Ejemplo: "0.4km" no "400m"`,
        severity: 'critical'
      });
    }
  });

  // REGLA 4: Verificar formato de intensidad
  const validIntensities = ['warmup', 'interval', 'recovery', 'cooldown'];
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (line.includes('intensity=')) {
      const match = line.match(/intensity=(\w+)/);
      if (match) {
        const intensity = match[1].toLowerCase();
        if (!validIntensities.includes(intensity)) {
          errors.push({
            line: lineNum,
            message: `Intensidad inválida: "intensity=${intensity}". Usa: warmup, interval, recovery, cooldown`,
            severity: 'major'
          });
        }
      }
    }
  });

  // REGLA 5: Si hay distancia, debe estar en km
  lines.forEach((line, idx) => {
    const lineNum = idx + 1;
    if (/\d+\.\d+\s*km|^\s*-\s*run/i.test(line)) {
      // Verificar que el pace tenga formato MM:SS
      if (line.includes('pace') && !/\d+:\d{2}/.test(line)) {
        warnings.push({
          line: lineNum,
          message: `Pace sin formato MM:SS detectado. Ejemplo correcto: "4:45 pace"`
        });
      }
    }
  });

  // REGLA 6: Multiplicadores deben estar presentes (Nx o 1x)
  const hasMultipliers = /\d+x\s*$|^\s*\d+x\s*-/m.test(markdown);
  if (!hasMultipliers && /run|recover/i.test(markdown)) {
    warnings.push({
      line: 0,
      message: `No se detectaron multiplicadores (Nx, 1x). Se recomienda agrupar las series.`
    });
  }

  // Compilar resumen
  let summary = '';
  if (errors.length === 0 && warnings.length === 0) {
    summary = '✅ Workout válido según Garmin Workout Rules';
  } else if (errors.length > 0) {
    summary = `❌ ${errors.length} error(es) crítico(s), ${warnings.length} advertencia(s)`;
  } else {
    summary = `⚠️ Sin errores críticos, pero ${warnings.length} advertencia(s)`;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    summary
  };
}

/**
 * Generar reporte detallado de validación
 */
export function generateValidationReport(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push(`\n${'='.repeat(60)}`);
  lines.push(`VALIDACIÓN: GARMIN WORKOUT RULES`);
  lines.push(`${'='.repeat(60)}`);
  lines.push(`\n${result.summary}\n`);

  if (result.errors.length > 0) {
    lines.push(`\n❌ ERRORES (${result.errors.length}):`);
    result.errors.forEach(err => {
      lines.push(`  [Línea ${err.line}] ${err.severity.toUpperCase()}: ${err.message}`);
    });
  }

  if (result.warnings.length > 0) {
    lines.push(`\n⚠️ ADVERTENCIAS (${result.warnings.length}):`);
    result.warnings.forEach(warn => {
      lines.push(`  [Línea ${warn.line}] ${warn.message}`);
    });
  }

  lines.push(`\n${'='.repeat(60)}\n`);

  return lines.join('\n');
}

/**
 * Validación rápida: retorna true/false solamente
 */
export function isValidGarminWorkout(markdown: string): boolean {
  return validateGarminWorkout(markdown).valid;
}
