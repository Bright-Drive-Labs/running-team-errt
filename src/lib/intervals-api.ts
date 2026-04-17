import { supabase } from './supabase';
import { logApiKeyAccessed } from '../utils/auditLog';

/**
 * Types for Intervals.icu API
 */
export interface IntervalWorkoutData {
  name: string;
  description?: string;
  coach_notes?: string;
  planned_duration_seconds?: number;
  intensity?: 'easy' | 'moderate' | 'hard' | 'threshold' | 'vo2max' | 'anaerobic' | 'sprint';
  workout_doc?: {
    secs: number;
    km: number;
    pace?: string;
    difficulty?: string;
    description?: string;
  }[];
  [key: string]: any;
}

/**
 * Obtener API Key desencriptada desde Vault RPC
 *
 * SEGURIDAD:
 * - Solo llamar cuando sea necesario (no cachear)
 * - Desencriptación ocurre en servidor Supabase (seguro)
 * - Backend recibe en memoria temporal (se descarta después)
 * - Log cada acceso para auditoría
 *
 * @param athleteId - UUID del atleta
 * @param tenantId - UUID del tenant
 * @param coachName - Nombre del coach (para audit log)
 * @returns API Key desencriptada o null si error
 */
export async function getIntervalsApiKey(
  athleteId: string,
  tenantId: string,
  coachName: string
): Promise<string | null> {
  try {
    // Llamar RPC get_intervals_key() (creada por AGENTE 1)
    const { data: apiKey, error } = await supabase.rpc('get_intervals_key', {
      p_athlete_id: athleteId,
      p_tenant_id: tenantId
    });

    if (error) {
      console.error('RPC get_intervals_key error:', error);

      // Log acceso fallido
      await logApiKeyAccessed({
        tenant_id: tenantId,
        actor_id: 'system',
        actor_name: coachName,
        athlete_id: athleteId,
        status: 'FAILED',
        error: error.message
      });

      return null;
    }

    if (!apiKey || typeof apiKey !== 'string') {
      console.warn('getIntervalsApiKey: No API key returned');

      await logApiKeyAccessed({
        tenant_id: tenantId,
        actor_id: 'system',
        actor_name: coachName,
        athlete_id: athleteId,
        status: 'FAILED',
        error: 'No API key found'
      });

      return null;
    }

    // Log acceso exitoso
    await logApiKeyAccessed({
      tenant_id: tenantId,
      actor_id: 'system',
      actor_name: coachName,
      athlete_id: athleteId,
      status: 'SUCCESS'
    });

    return apiKey;

  } catch (err) {
    console.error('getIntervalsApiKey error:', err);
    return null;
  }
}

/**
 * Crear workout en Intervals.icu usando API Key del Vault
 *
 * FLUJO:
 * 1. Obtener API Key desencriptada del Vault (RPC)
 * 2. Usar en memoria temporal
 * 3. API Key se descarta después del request (scope termina)
 * 4. Log acceso a audit_logs
 *
 * @param athleteId - UUID del atleta
 * @param tenantId - UUID del tenant
 * @param coachName - Nombre del coach
 * @param workoutData - Datos del workout
 * @returns true si éxito, false si error
 */
export async function createIntervalsWorkout(
  athleteId: string,
  tenantId: string,
  coachName: string,
  workoutData: IntervalWorkoutData
): Promise<boolean> {
  try {
    // Obtener API Key desencriptada
    const apiKey = await getIntervalsApiKey(athleteId, tenantId, coachName);

    if (!apiKey) {
      console.error('Could not retrieve API key for athlete:', athleteId);
      return false;
    }

    // URL del endpoint
    const intervalsUrl = 'https://api.intervals.icu/v2/workouts';

    // Realizar request a Intervals.icu
    const response = await fetch(intervalsUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(workoutData)
    });

    // ⚠️ IMPORTANTE: API Key se descarta aquí (variable scope termina)
    // No persiste, no se loguea en texto plano, no se guarda

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Intervals.icu API error:', response.status, errorData);
      return false;
    }

    return true;

  } catch (err) {
    console.error('createIntervalsWorkout error:', err);
    return false;
  }
}

/**
 * Obtener workouts del athlete desde Intervals.icu
 *
 * @param athleteId - UUID del atleta
 * @param tenantId - UUID del tenant
 * @param coachName - Nombre del coach
 * @returns Array de workouts o null si error
 */
export async function getIntervalsWorkouts(
  athleteId: string,
  tenantId: string,
  coachName: string,
  limit: number = 10
): Promise<any[] | null> {
  try {
    const apiKey = await getIntervalsApiKey(athleteId, tenantId, coachName);

    if (!apiKey) {
      return null;
    }

    const response = await fetch(
      `https://api.intervals.icu/v2/workouts?limit=${limit}`,
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    if (!response.ok) {
      console.error('Failed to fetch workouts:', response.status);
      return null;
    }

    const data = await response.json();
    return data.workouts || [];

  } catch (err) {
    console.error('getIntervalsWorkouts error:', err);
    return null;
  }
}

/**
 * Sincronizar datos de Garmin hacia Intervals.icu
 * (Ejemplo: puede ser expandido según necesidad)
 *
 * @param athleteId - UUID del atleta
 * @param tenantId - UUID del tenant
 * @param garminData - Datos de Garmin a sincronizar
 * @returns true si éxito
 */
export async function syncGarminToIntervals(
  athleteId: string,
  tenantId: string,
  garminData: any
): Promise<boolean> {
  try {
    const apiKey = await getIntervalsApiKey(athleteId, tenantId, 'Garmin Sync');

    if (!apiKey) {
      return false;
    }

    const response = await fetch('https://api.intervals.icu/v2/activities', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(garminData)
    });

    return response.ok;

  } catch (err) {
    console.error('syncGarminToIntervals error:', err);
    return false;
  }
}
