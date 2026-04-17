/**
 * BACKEND INTEGRATION EXAMPLE
 * ==============================
 * Cómo usar las funciones PostgreSQL/Vault desde el backend
 * Este archivo es una referencia para AGENTE 5 (Backend Integration)
 *
 * Archivo: backend_integration_example.js
 * Proyecto: Bright Drive ERRT
 * Creado por: SQL Specialist
 * Fecha: 2026-04-15
 */

// =====================================================
// INICIALIZACIÓN DEL CLIENTE SUPABASE (service_role)
// =====================================================
// En el backend, siempre usamos service_role para máxima seguridad

import { createClient } from '@supabase/supabase-js';

// Variables de entorno (en tu .env o Railway config)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY; // ⚠️ SECRETO

// Cliente solo para el backend
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// =====================================================
// FUNCIÓN 1: GUARDAR API KEY ENCRIPTADA
// =====================================================
/**
 * Guarda la API Key de Intervals de un atleta encriptada en Vault
 *
 * @param {string} athleteId - UUID del atleta
 * @param {string} tenantId - UUID del tenant (equipo)
 * @param {string} apiKey - API Key de Intervals (ej: "353s8jyj62zdo4jkc2sfvfhwi")
 * @returns {Promise<boolean>} - TRUE si éxito, FALSE si error
 */
async function storeAthletesIntervalsKey(athleteId, tenantId, apiKey) {
  try {
    // Validar inputs
    if (!athleteId || !tenantId || !apiKey) {
      throw new Error('Missing required parameters: athleteId, tenantId, apiKey');
    }

    // Llamar la función RPC (Remote Procedure Call)
    // store_intervals_key() está en PostgreSQL y encripta automáticamente
    const { data, error } = await supabaseAdmin.rpc('store_intervals_key', {
      p_athlete_id: athleteId,
      p_tenant_id: tenantId,
      p_api_key: apiKey
    });

    if (error) {
      console.error('[StoreKey] Error:', error.message);
      return false;
    }

    console.log('[StoreKey] Success:', {
      athleteId,
      tenantId,
      result: data
    });

    return data === true;
  } catch (err) {
    console.error('[StoreKey] Exception:', err.message);
    return false;
  }
}

// =====================================================
// FUNCIÓN 2: RECUPERAR API KEY DESENCRIPTADA
// =====================================================
/**
 * Recupera y desencripta la API Key de Intervals de un atleta
 *
 * ⚠️ IMPORTANTE: Esta función retorna la clave en TEXTO PLANO
 * Solo úsala cuando necesites hacer una llamada a Intervals.icu
 * NUNCA guardes en logs o expongas al frontend
 *
 * @param {string} athleteId - UUID del atleta
 * @param {string} tenantId - UUID del tenant
 * @returns {Promise<string|null>} - API Key desencriptada, o null si error
 */
async function getAthletesIntervalsKey(athleteId, tenantId) {
  try {
    if (!athleteId || !tenantId) {
      throw new Error('Missing required parameters: athleteId, tenantId');
    }

    // Llamar la función RPC
    // get_intervals_key() desencripta desde Vault
    const { data, error } = await supabaseAdmin.rpc('get_intervals_key', {
      p_athlete_id: athleteId,
      p_tenant_id: tenantId
    });

    if (error) {
      console.error('[GetKey] Error:', error.message);
      return null;
    }

    if (!data) {
      console.warn('[GetKey] No API key found for athlete:', athleteId);
      return null;
    }

    // ⚠️ SEGURIDAD: Aquí tenemos la clave desencriptada
    // No la imprimas en logs públicos
    // Solo úsala para hacer la llamada a Intervals.icu
    console.log('[GetKey] Retrieved API key for athlete:', athleteId);

    return data; // Este es el texto plano de la API Key
  } catch (err) {
    console.error('[GetKey] Exception:', err.message);
    return null;
  }
}

// =====================================================
// FUNCIÓN 3: REVOCAR API KEY
// =====================================================
/**
 * Revoca y elimina la API Key de un atleta
 * Útil cuando un atleta deja el equipo o revoca acceso
 *
 * @param {string} athleteId - UUID del atleta
 * @param {string} tenantId - UUID del tenant
 * @returns {Promise<boolean>} - TRUE si éxito
 */
async function revokeAthletesIntervalsKey(athleteId, tenantId) {
  try {
    if (!athleteId || !tenantId) {
      throw new Error('Missing required parameters: athleteId, tenantId');
    }

    const { data, error } = await supabaseAdmin.rpc('revoke_intervals_key', {
      p_athlete_id: athleteId,
      p_tenant_id: tenantId
    });

    if (error) {
      console.error('[RevokeKey] Error:', error.message);
      return false;
    }

    console.log('[RevokeKey] API key revoked for athlete:', athleteId);
    return data === true;
  } catch (err) {
    console.error('[RevokeKey] Exception:', err.message);
    return false;
  }
}

// =====================================================
// CASO DE USO: CREAR WORKOUT EN INTERVALS.ICU
// =====================================================
/**
 * Ejemplo completo: Crear un workout en Intervals.icu usando API Key almacenada
 * Este es el flujo que AGENTE 5 debe implementar
 */
async function createWorkoutInIntervals(
  athleteId,
  tenantId,
  workoutData // { name, description, type, category }
) {
  try {
    // PASO 1: Recuperar API Key desencriptada desde Vault
    const apiKey = await getAthletesIntervalsKey(athleteId, tenantId);
    if (!apiKey) {
      throw new Error('Failed to retrieve API key from Vault');
    }

    // PASO 2: Preparar autorización HTTP Basic
    // Formato: Basic base64(username:password)
    // En Intervals: username = "API_KEY", password = la clave
    const credentials = Buffer.from(`API_KEY:${apiKey}`).toString('base64');

    // PASO 3: Llamar a Intervals.icu API
    const response = await fetch('https://intervals.icu/api/v1/athlete/0/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        category: workoutData.category || 'WORKOUT',
        type: workoutData.type || 'Run',
        name: workoutData.name,
        description: workoutData.description,
        start_date_local: new Date().toISOString().split('T')[0],
        notes: workoutData.notes || ''
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Intervals API error: ${response.status} - ${errorData.message}`);
    }

    const result = await response.json();
    console.log('[CreateWorkout] Workout created:', result);

    return {
      success: true,
      workoutId: result.id,
      data: result
    };
  } catch (err) {
    console.error('[CreateWorkout] Error:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

// =====================================================
// CASO DE USO: SYNC DE BIOMETRÍA DESDE GARMIN
// =====================================================
/**
 * Ejemplo: Sincronizar datos biométricos de Garmin para un atleta
 * (Bonificación para AGENTE 5)
 */
async function syncGarminBiometricsWithIntervals(
  athleteId,
  tenantId,
  garminData // { avgHR, maxHR, calories, ... }
) {
  try {
    const apiKey = await getAthletesIntervalsKey(athleteId, tenantId);
    if (!apiKey) {
      throw new Error('No API key found for this athlete');
    }

    const credentials = Buffer.from(`API_KEY:${apiKey}`).toString('base64');

    // Llamar endpoint de eventos de Intervals
    const response = await fetch('https://intervals.icu/api/v1/athlete/0/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${credentials}`
      },
      body: JSON.stringify({
        category: 'GARMIN_SYNC',
        type: 'Measurement',
        name: 'Garmin Biometrics Sync',
        description: `Heart Rate: ${garminData.avgHR}/${garminData.maxHR} bpm, Calories: ${garminData.calories}`,
        start_date_local: new Date().toISOString().split('T')[0],
        notes: 'Synced from Garmin'
      })
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    const result = await response.json();
    console.log('[SyncGarmin] Biometrics synced:', result);

    return {
      success: true,
      syncId: result.id
    };
  } catch (err) {
    console.error('[SyncGarmin] Error:', err.message);
    return {
      success: false,
      error: err.message
    };
  }
}

// =====================================================
// EXPORTAR FUNCIONES PARA USO EN OTRAS PARTES DEL BACKEND
// =====================================================
export {
  storeAthletesIntervalsKey,
  getAthletesIntervalsKey,
  revokeAthletesIntervalsKey,
  createWorkoutInIntervals,
  syncGarminBiometricsWithIntervals
};

// =====================================================
// SEGURIDAD: REGLAS IMPORTANTES
// =====================================================

/**
 * 1. NUNCA guardes la API Key en texto plano
 *    - Siempre encríptala con store_intervals_key()
 *    - Solo desencripta cuando necesites usarla
 *
 * 2. NO expongas apiKey al frontend
 *    - El frontend NUNCA debe recibir la clave
 *    - Las llamadas a Intervals siempre desde backend
 *
 * 3. Usa service_role en backend, anon en frontend
 *    - Backend: createClient(URL, SERVICE_ROLE_KEY)
 *    - Frontend: createClient(URL, ANON_KEY)
 *    - Las RPC están protegidas con SECURITY DEFINER
 *
 * 4. Valida multi-tenant siempre
 *    - Las funciones verifican que athlete ∈ tenant
 *    - Imposible acceder a datos de otro equipo
 *
 * 5. Maneja excepciones gracefully
 *    - Las funciones retornan boolean/null si error
 *    - Log para debugging, no expongas detalles al cliente
 *
 * 6. Auditoría y logging
 *    - Registra quién accede las keys (para compliance)
 *    - Temporal: Log cuando se llama get_intervals_key()
 *    - Permanente: Log cuando se revoca una key
 */

// =====================================================
// EJEMPLO DE USO EN UN ENDPOINT EXPRESS
// =====================================================

/**
 * Ejemplo: Endpoint que crea un workout para un atleta
 *
 * POST /api/athletes/:athleteId/workouts
 * Body: {
 *   "tenantId": "team-uuid",
 *   "workoutName": "10x400m Series",
 *   "workoutDescription": "Warmup...",
 *   "workoutType": "Run"
 * }
 *
 * Handler:
 */

/*
app.post('/api/athletes/:athleteId/workouts', async (req, res) => {
  try {
    const { athleteId } = req.params;
    const { tenantId, workoutName, workoutDescription, workoutType } = req.body;

    // Verificar que el usuario tiene acceso a este athlete
    // (Implementar autenticación/autorización aquí)

    // Crear workout en Intervals usando la API Key encriptada
    const result = await createWorkoutInIntervals(
      athleteId,
      tenantId,
      {
        name: workoutName,
        description: workoutDescription,
        type: workoutType,
        category: 'WORKOUT'
      }
    );

    if (!result.success) {
      return res.status(500).json({
        error: 'Failed to create workout',
        message: result.error
      });
    }

    res.json({
      success: true,
      workoutId: result.workoutId,
      message: 'Workout created successfully'
    });
  } catch (err) {
    console.error('Workout creation error:', err);
    res.status(500).json({
      error: 'Internal server error'
    });
  }
});
*/

// =====================================================
// FIN DEL EJEMPLO
// =====================================================
