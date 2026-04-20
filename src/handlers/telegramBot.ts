import { Telegraf, Context } from 'telegraf';
import { supabase } from '../lib/supabase';
import { pushWorkoutToIntervals } from '../lib/intervals-calendar';
import {
  logAction,
  logWorkoutPush,
  logCoachCommand,
  AuditAction
} from '../utils/auditLog';

/**
 * Extended Telegraf context with coach information
 */
interface CoachContext extends Context {
  coach?: {
    id: string;
    tenant_id: string;
    name: string;
    email: string;
    is_admin: boolean;
  };
  tenant_id?: string;
}

type WorkoutData = {
  target_audience: string;
  workout_markdown: string;
  friendly_description: string;
  workout_name: string;
  coach_notes: string;
  target_date: string;
};

// Memory sessions for the flow
const sessionState = new Map<number, {
  phase: 'waiting_audience' | 'waiting_date' | 'waiting_audience_group';
  text: string;
  workouts: WorkoutData[];
}>();

const pendingWorkouts = new Map<number, WorkoutData[]>();

/**
 * Call Groq AI to parse or process text
 */
async function callGroq(messages: any[]) {
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
        console.warn("⚠️ GROQ_API_KEY no encontrado.");
        return null;
    }
    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${groqApiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages,
                temperature: 0.1,
                response_format: { type: "json_object" }
            })
        });
        const data = await response.json();
        return JSON.parse(data.choices[0].message.content);
    } catch (e) {
        console.error("Groq Error:", e);
        return null;
    }
}

/**
 * Use AI to extract structured workout data from natural language
 */
async function analyzeWorkoutWithAI(text: string) {
    const systemPrompt = `You are the Workout Specialist for Running Team ERRT. You convert coach messages into a JSON containing both technical and human descriptions.

RULES:
1. "workout_markdown": STRICT technical format for Intervals.icu. Use Warmup, Run, Recover, Cooldown. Blank lines between blocks. Include intensity tags.
2. "friendly_description": Professional, coach-style human description (Colloquial-Technical). NO technical tags like intensity=warmup. Make it sound premium.
3. UNITS: Distances in 'km', times in 'm' or 's'.
4. PACES: Warmup (8:01-6:37), Cooldown (6:37-8:01), Intervals (5:00 unless specified).

FEW-SHOT EXAMPLE:
User: "6x600m Progresivos PARA: Daniel Perez FECHA: 17 de abril 🔥 WARMUP: 20m ⚡ 6x600m ⏱️ REC: 1:30m 🏁 COOLDOWN: 5m 📝 NOTAS: Controlar ritmo."
Output JSON:
{
  "workout_name": "6x600m Progresivos Controlados",
  "workout_markdown": "Warmup\\n- Warmup 20m 8:01-6:37 pace intensity=warmup\\n\\n6x\\n- Run 0.6km 5:00 pace intensity=interval\\n- Recover 90s intensity=recovery\\n\\nCooldown\\n- Cooldown 5m 6:37-8:01 pace intensity=cooldown",
  "friendly_description": "📋 DESCRIPCIÓN TÉCNICA:\\n\\nIniciaremos con una etapa de activación (Warmup) de 20 minutos rodando progresivo para preparar el sistema cardiovascular. El bloque central consiste en 6 intervalos de 600m progresivos; buscamos una zancada potente y eficiente. La recuperación será de 90 segundos a trote regenerativo. Finalizamos con 5 minutos de soltura total para la vuelta a la calma.",
  "coach_notes": "Controlar ritmo.",
  "target_audience": "ATHLETE: Daniel Perez",
  "target_date": "2026-04-17"
}

RESPONSE MUST BE JSON:
{
  "workout_name": "...",
  "workout_markdown": "...",
  "friendly_description": "...",
  "coach_notes": "...",
  "target_audience": "...", 
  "target_date": "..."
}`;

    return await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
    ]);
}

/**
 * Use AI to normalize date strings
 */
async function parseDateWithAI(text: string) {
    const systemPrompt = `Translate the relative date text into an ISO date string (YYYY-MM-DD). Today is ${new Date().toISOString()}.
    Example: "mañana" -> "2026-04-18". "el lunes" -> "2026-04-21". "17 de abril" -> "2026-04-17".
    Return JSON: { "date": "YYYY-MM-DD" }`;
    
    const result = await callGroq([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
    ]);
    return result?.date || null;
}

/**
 * Initialize Telegram Bot with validation middleware
 */
export function initTelegramBot(token: string): Telegraf<CoachContext> {
  const bot = new Telegraf<CoachContext>(token);

  /**
   * Middleware: Validate coach authorization
   */
  bot.use(async (ctx: CoachContext, next) => {
    try {
      const telegramUserId = ctx.from?.id.toString();
      if (!telegramUserId) return;

      const { data: coaches, error } = await supabase
        .from('athletes')
        .select('id, tenant_id, name, email, is_admin')
        .eq('telegram_user_id', telegramUserId)
        .eq('is_admin', true);

      const coach = coaches && coaches.length > 0 ? coaches[0] : null;

      if (error || !coach) {
        if (ctx.message && 'text' in ctx.message && ctx.message.text.startsWith('/')) {
            await ctx.reply('❌ No autorizado. Tu ID de Telegram no está registrado como Coach.');
        }
        return;
      }

      ctx.coach = coach;
      ctx.tenant_id = coach.tenant_id;
      await next();
    } catch (err) {
      console.error('Telegram auth middleware error:', err);
    }
  });

  bot.start(async (ctx) => {
    await ctx.reply(
      `¡Hola Coach ${ctx.coach?.name}! 👋\n\n` +
      'Estoy listo para procesar tus entrenamientos. Solo envíame el entrenamiento como siempre y yo me encargaré de todo.\n\n' +
      'Puedes usar /cancel si necesitas reiniciar un proceso.'
    );
  });

  bot.command('cancel', async (ctx) => {
    sessionState.delete(ctx.from.id);
    await ctx.reply('🔄 Proceso cancelado. Listo para un nuevo entrenamiento.');
  });

  bot.command('list', async (ctx) => {
      const { data: workouts } = await supabase
        .from('workout_assignments')
        .select('workout_name, target_date, status')
        .eq('tenant_id', ctx.tenant_id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!workouts || workouts.length === 0) return ctx.reply("No hay asignaciones recientes.");
      
      const list = workouts.map(w => `• ${w.workout_name} (${w.target_date}) - ${w.status}`).join('\n');
      await ctx.reply(`📋 **Últimas asignaciones:**\n\n${list}`, { parse_mode: 'Markdown' });
  });

  bot.on('text', async (ctx) => {
    const userText = ctx.message.text;
    const userId = ctx.from.id;
    if (userText.startsWith('/')) return;

    const session = sessionState.get(userId);

    if (!session) {
        const loading = await ctx.reply("🧠 Analizando entrenamiento con IA...");
        const aiData = await analyzeWorkoutWithAI(userText);
        await ctx.telegram.deleteMessage(ctx.chat.id, loading.message_id);

        if (!aiData) return ctx.reply("❌ No pude entender el entrenamiento. ¿Podrías intentar enviarlo de nuevo con más detalle?");

        const workout: WorkoutData = {
            target_audience: aiData.target_audience || '',
            workout_markdown: aiData.workout_markdown,
            workout_name: aiData.workout_name || 'Nuevo Entrenamiento',
            coach_notes: aiData.coach_notes || '',
            target_date: aiData.target_date || ''
        };

        const workouts = [workout];

        if (!workout.target_audience || workout.target_audience.toLowerCase() === 'unknown') {
            sessionState.set(userId, { phase: 'waiting_audience', text: userText, workouts });
            return ctx.reply(`🎯 **${workout.workout_name}**\n\n¿A quién quieres asignar este entrenamiento?`, {
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '🌍 TODOS LOS ATLETAS', callback_data: 'target_all' }],
                        [{ text: '👥 POR GRUPO', callback_data: 'target_group' }],
                        [{ text: '👤 UN ATLETA ESPECÍFICO', callback_data: 'target_athlete' }]
                    ]
                }
            });
        }

        if (!workout.target_date) {
            sessionState.set(userId, { phase: 'waiting_date', text: userText, workouts });
            return ctx.reply("📅 ¿Para qué fecha lo agendamos? (Ej: mañana, lunes, 25 de abril)");
        }

        return await showConfirmation(ctx, workouts);
    }

    // Conversational flow
    if (session.phase === 'waiting_audience_group') {
        session.workouts[0].target_audience = `GROUP: ${userText.toUpperCase()}`;
        session.phase = 'waiting_date';
        return ctx.reply("📅 Entendido. ¿Para qué fecha lo agendamos?");
    } 
    else if (session.phase === 'waiting_date') {
        const dateISO = await parseDateWithAI(userText);
        if (!dateISO) return ctx.reply("❌ No pude procesar la fecha. Prueba con algo simple como 'mañana' o una fecha específica.");
        
        session.workouts[0].target_date = dateISO;
        await showConfirmation(ctx, session.workouts);
        sessionState.delete(userId);
    }
    else if (session.phase === 'waiting_audience') {
        session.workouts[0].target_audience = `ATHLETE: ${userText}`;
        session.phase = 'waiting_date';
        return ctx.reply("📅 ¿Para qué fecha lo agendamos?");
    }
  });

  // Inline Actions
  bot.action('target_all', async (ctx) => {
    const userId = ctx.from!.id;
    const session = sessionState.get(userId);
    if (!session) return ctx.answerCbQuery();
    session.workouts[0].target_audience = 'ALL';
    session.phase = 'waiting_date';
    await ctx.reply("📅 ¿Para qué fecha lo agendamos?");
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  });

  bot.action('target_athlete', async (ctx) => {
    const userId = ctx.from!.id;
    const session = sessionState.get(userId);
    if (!session) return ctx.answerCbQuery();
    session.phase = 'waiting_audience';
    await ctx.reply("👤 Escribe el nombre del atleta:");
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  });

  bot.action('target_group', async (ctx) => {
    const userId = ctx.from!.id;
    const session = sessionState.get(userId);
    if (!session) return ctx.answerCbQuery();
    session.phase = 'waiting_audience_group';
    await ctx.reply("👥 Escribe el nombre del grupo (ej: AVANZADO, INTERMEDIO):");
    await ctx.answerCbQuery();
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
  });

  bot.action('push_yes', async (ctx) => {
    try {
        const userId = ctx.from!.id;
        const msgId = ctx.callbackQuery!.message!.message_id;
        const workouts = pendingWorkouts.get(msgId);
        
        if (!workouts || !ctx.coach) {
            return ctx.reply("❌ Error: Sesión perdida.");
        }

        await ctx.answerCbQuery("🚀 Procesando...");
        await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
        const statusMsg = await ctx.reply("⏳ Guardando en el Portal del Atleta...");

        let totalAssigned = 0;
        for (const w of workouts) {
            // Fetch target athlete IDs for Supabase
            let targets: { id: string }[] = [];
            if (w.target_audience.startsWith("ATHLETE:")) {
                const name = w.target_audience.split(":")[1].trim();
                const { data } = await supabase.from('athletes').select('id').eq('tenant_id', ctx.tenant_id).ilike('name', `%${name}%`).limit(1);
                if (data) targets = data;
            } else if (w.target_audience.startsWith("GROUP:")) {
                const group = w.target_audience.split(":")[1].trim();
                const { data } = await supabase.from('athletes').select('id').eq('tenant_id', ctx.tenant_id).eq('group_tag', group);
                if (data) targets = data;
            } else {
                const { data } = await supabase.from('athletes').select('id').eq('tenant_id', ctx.tenant_id).eq('is_admin', false);
                if (data) targets = data;
            }

            // Insert into workout_assignments
            if (targets.length > 0) {
                const assignments = targets.map(t => ({
                    tenant_id: ctx.tenant_id,
                    athlete_id: t.id,
                    coach_id: ctx.coach!.id,
                    workout_name: w.workout_name,
                    target_date: w.target_date,
                    markdown_payload: w.workout_markdown,
                    friendly_description: w.friendly_description,
                    coach_notes: w.coach_notes,
                    status: 'PENDING'
                }));
                const { error } = await supabase.from('workout_assignments').insert(assignments);
                if (!error) totalAssigned += targets.length;
            }
            
            await ctx.telegram.editMessageText(ctx.chat!.id, statusMsg.message_id, undefined, 
              `✅ **¡Entrenamiento Cargado!**\n\n` +
              `📋 Se asignó a **${totalAssigned}** atletas.\n` +
              `📱 Ya está disponible en la sección VIP del portal.\n\n` +
              `*Nota: La sincronización con Garmin se realizará cuando el atleta presione el botón en su portal.*`
            , { parse_mode: 'Markdown' });
        }

        pendingWorkouts.delete(msgId);
    } catch (err) {
        console.error("Push Error:", err);
        await ctx.reply("❌ Error crítico en el proceso.");
    }
  });

  bot.action('push_no', async (ctx) => {
    await ctx.editMessageReplyMarkup({ inline_keyboard: [] });
    await ctx.reply("🛑 Operación cancelada.");
    await ctx.answerCbQuery();
  });

  return bot;
}

async function showConfirmation(ctx: any, workouts: WorkoutData[]) {
  const summary = workouts.map(w => `• 📅 \`${w.target_date}\`: ${w.workout_name} (${w.target_audience})`).join('\n');
  const sentMsg = await ctx.reply(
    `💪 **Resumen del Entrenamiento:**\n\n${summary}\n\n¿Confirmas el encolado y sincronización con Intervals.icu?`,
    {
        parse_mode: 'Markdown',
        reply_markup: {
            inline_keyboard: [
                [{ text: '✅ SÍ, PROCEDER', callback_data: 'push_yes' }],
                [{ text: '❌ CANCELAR', callback_data: 'push_no' }]
            ]
        }
    }
  );
  pendingWorkouts.set(sentMsg.message_id, workouts);
}

/**
 * Launch the bot in webhook mode
 */
export async function launchTelegramBot(bot: Telegraf<CoachContext>) {
  try {
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL;
    if (webhookUrl) {
      await bot.telegram.setWebhook(webhookUrl, {
        secret_token: process.env.TELEGRAM_SECRET_TOKEN
      });
      console.log(`✅ Webhook configurado: ${webhookUrl}`);
    } else {
        bot.launch();
        console.log('✅ Bot iniciado en modo POLLING');
    }
  } catch (err) {
    console.error('❌ Error al iniciar el bot:', err);
  }
}

export function getTelegramWebhookHandler(bot: Telegraf<CoachContext>) {
  return async (ctx: any, reply: any) => {
    try {
      const secretToken = ctx.request.headers['x-telegram-bot-api-secret-token'];
      if (process.env.TELEGRAM_SECRET_TOKEN && secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      await bot.handleUpdate(ctx.request.body);
      return reply.status(200).send({ ok: true });
    } catch (err) {
      console.error('Webhook handler error:', err);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  };
}

export { Telegraf, Context };
