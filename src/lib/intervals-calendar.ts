import { supabase } from './supabase';
import { logAction } from '../utils/auditLog';

/**
 * Builds a standardized workout name for Intervals.icu
 */
function buildWorkoutName(targetAudience: string, workoutName: string): string {
  let prefix = 'ERRT';
  if (targetAudience === 'ALL') {
    prefix = 'ERRT_ALL';
  } else if (targetAudience.startsWith('GROUP:')) {
    const group = targetAudience.split('GROUP:')[1].trim();
    prefix = `ERRT_${group.substring(0, 3).toUpperCase()}`;
  } else if (targetAudience.startsWith('ATHLETE:')) {
    const name = targetAudience.split('ATHLETE:')[1].trim();
    const initials = name.split(' ').map((w: string) => w[0]).join('').toUpperCase();
    prefix = `ERRT_${initials}`;
  }
  return `${prefix} | ${workoutName}`;
}

/**
 * Pushes a workout to the athlete's Intervals.icu calendar
 */
export async function pushWorkoutToIntervals(
  targetAudience: string,
  markdownWorkout: string,
  targetDate: string,
  workoutName: string = 'Entrenamiento',
  coachNotes: string = '',
  tenantId: string
): Promise<string> {
  try {
    console.log(`[Intervals Calendar] Syncing for: ${targetAudience} | Date: ${targetDate}`);

    let athletesToSync: any[] = [];

    // 1. Identify targets
    if (targetAudience.startsWith("ATHLETE:")) {
      const athleteNameParts = targetAudience.split("ATHLETE:")[1].trim().split(/\s+/);
      const firstName = athleteNameParts[0];
      const lastName = athleteNameParts.slice(1).join(' ');

      let query = supabase
        .from('athletes')
        .select('id, tenant_id, intervals_athlete_id')
        .eq('tenant_id', tenantId)
        .ilike('first_name', firstName);

      if (lastName) {
        query = query.ilike('last_name', `%${lastName}%`);
      }

      const { data, error } = await query.limit(1);

      if (error) {
        console.error("Supabase Error:", error);
        return "❌ Error conectando con la Base de Datos.";
      }
      if (!data || data.length === 0) {
        return `❌ No encontré un atleta llamado "${targetAudience.split("ATHLETE:")[1].trim()}" en tu equipo.`;
      }
      athletesToSync.push(data[0]);
    }
    else if (targetAudience === "ALL") {
      const { data, error } = await supabase
        .from('athletes')
        .select('id, tenant_id, intervals_athlete_id')
        .eq('tenant_id', tenantId)
        .not('intervals_athlete_id', 'is', null);

      if (error) return "❌ Error leyendo equipo completo.";
      if (!data || data.length === 0) return "❌ El equipo no tiene atletas con Intervals configurado.";
      athletesToSync = data;
    }
    else if (targetAudience.startsWith("GROUP:")) {
      const groupTag = targetAudience.split("GROUP:")[1].trim();
      const { data, error } = await supabase
        .from('athletes')
        .select('id, tenant_id, intervals_athlete_id')
        .eq('tenant_id', tenantId)
        .eq('group_tag', groupTag)
        .not('intervals_athlete_id', 'is', null);
      
      if (error) return "❌ Error leyendo grupo.";
      if (!data || data.length === 0) return `❌ No hay atletas en el grupo "${groupTag}" con Intervals configurado.`;
      athletesToSync = data;
    }

    // 2. Sync to Intervals.icu
    let successCount = 0;
    const dateFormatted = targetDate.includes('T') ? targetDate : `${targetDate}T08:00:00`;

    for (const athlete of athletesToSync) {
      if (!athlete.intervals_athlete_id) continue;

      // Get API Key from Vault via RPC
      const { data: apiKey, error: vaultError } = await supabase.rpc('get_intervals_key', {
        p_athlete_id: athlete.id,
        p_tenant_id: athlete.tenant_id
      });

      if (vaultError || !apiKey) {
        console.error(`❌ Vault error for ${athlete.id}:`, vaultError?.message);
        continue;
      }

      const base64Auth = Buffer.from(`API_KEY:${apiKey}`).toString('base64');
      
      const name = buildWorkoutName(targetAudience, workoutName);
      const description = coachNotes
        ? `${markdownWorkout}\n\n---\n📝 NOTAS DEL COACH:\n${coachNotes}`
        : markdownWorkout;

      const payload = {
        category: "WORKOUT",
        start_date_local: dateFormatted,
        type: "Run",
        name,
        description
      };

      try {
        const response = await fetch(`https://intervals.icu/api/v1/athlete/${athlete.intervals_athlete_id}/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${base64Auth}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (response.ok) {
          successCount++;
        } else {
          const errBody = await response.json().catch(() => ({}));
          console.error(`❌ Intervals.icu error for ${athlete.intervals_athlete_id}:`, errBody);
        }
      } catch (err) {
        console.error(`❌ Fetch error for ${athlete.intervals_athlete_id}:`, err);
      }
    }

    if (successCount > 0) {
      return `✅ Sincronizado en el calendario de **${successCount}** atleta(s).`;
    } else {
      return `❌ No se pudo sincronizar con Intervals.icu. Verifica las API Keys.`;
    }
    
  } catch (err) {
    console.error('pushWorkoutToIntervals error:', err);
    return "❌ Error en el motor de sincronización.";
  }
}
