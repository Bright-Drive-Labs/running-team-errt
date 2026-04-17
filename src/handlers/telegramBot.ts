import { Telegraf, Context } from 'telegraf';
import { supabase } from '../lib/supabase';
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

      if (!telegramUserId) {
        await ctx.reply('❌ No se pudo obtener tu ID de Telegram.');
        return;
      }

      console.log(`[TELEGRAM AUTH] Attempting to authorize user ID: ${telegramUserId}`);

      // Search for authorized coaches in database
      // Note: There may be multiple coaches with the same telegram_user_id
      const { data: coaches, error } = await supabase
        .from('athletes')
        .select('id, tenant_id, name, email, is_admin')
        .eq('telegram_user_id', telegramUserId)
        .eq('is_admin', true);

      if (error) {
        console.error('[TELEGRAM AUTH] Database error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
      }

      console.log('[TELEGRAM AUTH] Query result:', {
        found: (coaches?.length || 0) > 0,
        matches: coaches?.length || 0,
        coaches: coaches?.map(c => ({ id: c.id, name: c.name, email: c.email })),
        error: error?.message
      });

      // Use the first matching coach (in case multiple exist with same telegram_user_id)
      const coach = coaches && coaches.length > 0 ? coaches[0] : null;

      if (error || !coach) {
        await ctx.reply(
          '❌ No autorizado. Solo coaches pueden usar este bot.\n\nPor favor, contacta al administrador para configurar tu ID de Telegram.'
        );

        // Log failed authorization attempt (fire-and-forget, non-blocking)
        logAction({
          tenant_id: 'unknown',
          action: 'COACH_COMMAND',
          entity_type: 'telegram_command',
          entity_id: ctx.message?.text || 'unknown',
          actor_id: telegramUserId,
          actor_type: 'TELEGRAM_BOT',
          actor_name: ctx.from?.username || ctx.from?.first_name || 'unknown',
          status: 'DENIED',
          error_message: `Unauthorized: ${error?.message || 'No coach found with is_admin=true'}`
        }).catch(err => console.error('Audit log error (non-blocking):', err.message));
        return;
      }

      // Attach coach information to context
      ctx.coach = coach;
      ctx.tenant_id = coach.tenant_id;

      console.log(`[TELEGRAM AUTH] ✅ Authorized: ${coach.name} (${coach.id})`);

      // Continue to next middleware/handler
      await next();

    } catch (err) {
      console.error('Telegram auth middleware error:', err);
      await ctx.reply('❌ Error en la validación de acceso.');
    }
  });

  /**
   * Command: /start
   */
  bot.command('start', async (ctx: CoachContext) => {
    if (!ctx.coach) {
      await ctx.reply('❌ Error: Coach data not available');
      return;
    }

    logCoachCommand({
      tenant_id: ctx.tenant_id!,
      coach_id: ctx.coach.id,
      coach_name: ctx.coach.name,
      command: 'start',
      status: 'SUCCESS'
    });

    await ctx.reply(
      `¡Hola ${ctx.coach.name}! 👋\n\n` +
      'Soy tu asistente de entrenamientos ERRT.\n\n' +
      'Comandos disponibles:\n' +
      '• /workout - Crear nuevo entrenamiento\n' +
      '• /list - Ver entrenamientos recientes\n' +
      '• /help - Ver ayuda\n' +
      '• /stats - Ver estadísticas del equipo'
    );
  });

  /**
   * Command: /help
   */
  bot.command('help', async (ctx: CoachContext) => {
    if (!ctx.coach) {
      await ctx.reply('❌ Error: Coach data not available');
      return;
    }

    logCoachCommand({
      tenant_id: ctx.tenant_id!,
      coach_id: ctx.coach.id,
      coach_name: ctx.coach.name,
      command: 'help',
      status: 'SUCCESS'
    });

    await ctx.reply(
      '📚 *Guía de Comandos*\n\n' +
      '*Entrenamientos:*\n' +
      '`/workout 5x1km @ 3:45/km` - Crear entrenamiento\n' +
      '`/list` - Listar entrenamientos recientes\n\n' +
      '*Información:*\n' +
      '`/stats` - Estadísticas del equipo\n' +
      '`/athletes` - Listar atletas\n\n' +
      'Ejemplo:\n' +
      '`/workout 10x400m @ 60s + 90s recovery`',
      { parse_mode: 'Markdown' }
    );
  });

  /**
   * Command: /workout
   * Format: /workout [workout description]
   * Example: /workout 5x1km @ 3:45/km
   */
  bot.command('workout', async (ctx: CoachContext) => {
    try {
      if (!ctx.coach || !ctx.tenant_id) {
        await ctx.reply('❌ Error: Coach data not available');
        return;
      }

      const message = ctx.message?.text || '';
      const workoutString = message.replace('/workout', '').trim();

      if (!workoutString) {
        await ctx.reply(
          '❌ Formato incorrecto.\n\n' +
          'Uso: `/workout descripción del entrenamiento`\n' +
          'Ejemplo: `/workout 5x1km @ 3:45/km`',
          { parse_mode: 'Markdown' }
        );

        logCoachCommand({
          tenant_id: ctx.tenant_id,
          coach_id: ctx.coach.id,
          coach_name: ctx.coach.name,
          command: 'workout',
          status: 'FAILED',
          error: 'Invalid format - missing workout description'
        });
        return;
      }

      // Create workout in database
      const { data: workout, error: workoutError } = await supabase
        .from('workouts')
        .insert({
          tenant_id: ctx.tenant_id,
          name: workoutString,
          description: `Created via Telegram by ${ctx.coach.name}`,
          created_by: ctx.coach.id,
          status: 'published',
          created_at: new Date().toISOString()
        })
        .select('id, name')
        .single();

      if (workoutError || !workout) {
        console.error('Workout creation error:', workoutError);

        logWorkoutPush({
          tenant_id: ctx.tenant_id,
          actor_id: ctx.coach.id,
          actor_name: ctx.coach.name,
          workout_id: 'unknown',
          workout_name: workoutString,
          status: 'FAILED',
          error: workoutError?.message || 'Unknown database error'
        });

        await ctx.reply('❌ Error al crear el entrenamiento. Por favor, intenta de nuevo.');
        return;
      }

      // Log successful workout creation
      await logWorkoutPush({
        tenant_id: ctx.tenant_id,
        actor_id: ctx.coach.id,
        actor_name: ctx.coach.name,
        workout_id: workout.id,
        workout_name: workoutString,
        status: 'SUCCESS'
      });

      await ctx.reply(
        `✅ *Entrenamiento creado*\n\n` +
        `📝 Nombre: ${workoutString}\n` +
        `🆔 ID: \`${workout.id}\`\n\n` +
        'El entrenamiento está listo para ser asignado a los atletas.',
        { parse_mode: 'Markdown' }
      );

    } catch (err) {
      console.error('Workout command error:', err);

      if (ctx.coach && ctx.tenant_id) {
        logCoachCommand({
          tenant_id: ctx.tenant_id,
          coach_id: ctx.coach.id,
          coach_name: ctx.coach.name,
          command: 'workout',
          status: 'FAILED',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      await ctx.reply('❌ Error procesando el comando. Por favor, intenta de nuevo.');
    }
  });

  /**
   * Command: /list
   */
  bot.command('list', async (ctx: CoachContext) => {
    try {
      if (!ctx.coach || !ctx.tenant_id) {
        await ctx.reply('❌ Error: Coach data not available');
        return;
      }

      const { data: workouts, error } = await supabase
        .from('workouts')
        .select('id, name, created_at')
        .eq('tenant_id', ctx.tenant_id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error || !workouts || workouts.length === 0) {
        await ctx.reply('❌ No hay entrenamientos para mostrar.');

        logCoachCommand({
          tenant_id: ctx.tenant_id,
          coach_id: ctx.coach.id,
          coach_name: ctx.coach.name,
          command: 'list',
          status: 'SUCCESS'
        });
        return;
      }

      const workoutList = workouts
        .map((w, idx) => `${idx + 1}. ${w.name}`)
        .join('\n');

      await ctx.reply(
        `📋 *Últimos 10 Entrenamientos*\n\n${workoutList}`,
        { parse_mode: 'Markdown' }
      );

      logCoachCommand({
        tenant_id: ctx.tenant_id,
        coach_id: ctx.coach.id,
        coach_name: ctx.coach.name,
        command: 'list',
        status: 'SUCCESS'
      });

    } catch (err) {
      console.error('List command error:', err);

      if (ctx.coach && ctx.tenant_id) {
        logCoachCommand({
          tenant_id: ctx.tenant_id,
          coach_id: ctx.coach.id,
          coach_name: ctx.coach.name,
          command: 'list',
          status: 'FAILED',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      await ctx.reply('❌ Error al obtener la lista de entrenamientos.');
    }
  });

  /**
   * Command: /stats
   */
  bot.command('stats', async (ctx: CoachContext) => {
    try {
      if (!ctx.coach || !ctx.tenant_id) {
        await ctx.reply('❌ Error: Coach data not available');
        return;
      }

      const { data: athletes, error: athletesError } = await supabase
        .from('athletes')
        .select('id')
        .eq('tenant_id', ctx.tenant_id)
        .eq('is_admin', false);

      const { data: workouts, error: workoutsError } = await supabase
        .from('workouts')
        .select('id')
        .eq('tenant_id', ctx.tenant_id);

      const athleteCount = athletes?.length || 0;
      const workoutCount = workouts?.length || 0;

      await ctx.reply(
        `📊 *Estadísticas del Equipo*\n\n` +
        `👥 Atletas: ${athleteCount}\n` +
        `📝 Entrenamientos: ${workoutCount}`,
        { parse_mode: 'Markdown' }
      );

      logCoachCommand({
        tenant_id: ctx.tenant_id,
        coach_id: ctx.coach.id,
        coach_name: ctx.coach.name,
        command: 'stats',
        status: 'SUCCESS'
      });

    } catch (err) {
      console.error('Stats command error:', err);

      if (ctx.coach && ctx.tenant_id) {
        logCoachCommand({
          tenant_id: ctx.tenant_id,
          coach_id: ctx.coach.id,
          coach_name: ctx.coach.name,
          command: 'stats',
          status: 'FAILED',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      await ctx.reply('❌ Error al obtener estadísticas.');
    }
  });

  /**
   * Command: /athletes
   */
  bot.command('athletes', async (ctx: CoachContext) => {
    try {
      if (!ctx.coach || !ctx.tenant_id) {
        await ctx.reply('❌ Error: Coach data not available');
        return;
      }

      const { data: athletes, error } = await supabase
        .from('athletes')
        .select('id, name, email')
        .eq('tenant_id', ctx.tenant_id)
        .eq('is_admin', false)
        .limit(15);

      if (error || !athletes || athletes.length === 0) {
        await ctx.reply('❌ No hay atletas para mostrar.');

        logCoachCommand({
          tenant_id: ctx.tenant_id,
          coach_id: ctx.coach.id,
          coach_name: ctx.coach.name,
          command: 'athletes',
          status: 'SUCCESS'
        });
        return;
      }

      const athleteList = athletes
        .map((a, idx) => `${idx + 1}. ${a.name} (${a.email})`)
        .join('\n');

      await ctx.reply(
        `👥 *Atletas del Equipo*\n\n${athleteList}`,
        { parse_mode: 'Markdown' }
      );

      logCoachCommand({
        tenant_id: ctx.tenant_id,
        coach_id: ctx.coach.id,
        coach_name: ctx.coach.name,
        command: 'athletes',
        status: 'SUCCESS'
      });

    } catch (err) {
      console.error('Athletes command error:', err);

      if (ctx.coach && ctx.tenant_id) {
        logCoachCommand({
          tenant_id: ctx.tenant_id,
          coach_id: ctx.coach.id,
          coach_name: ctx.coach.name,
          command: 'athletes',
          status: 'FAILED',
          error: err instanceof Error ? err.message : 'Unknown error'
        });
      }

      await ctx.reply('❌ Error al obtener la lista de atletas.');
    }
  });

  /**
   * Error handler
   */
  bot.catch(async (err, ctx) => {
    console.error('Telegram bot error:', err);

    if (ctx.coach && ctx.tenant_id) {
      logAction({
        tenant_id: ctx.tenant_id,
        action: 'COACH_COMMAND',
        entity_type: 'telegram_error',
        actor_id: ctx.coach.id,
        actor_type: 'TELEGRAM_BOT',
        actor_name: ctx.coach.name,
        status: 'FAILED',
        error_message: err instanceof Error ? err.message : 'Unknown error'
      });
    }

    try {
      await ctx.reply('❌ Error inesperado. Por favor, intenta de nuevo.');
    } catch (e) {
      console.error('Error sending error message:', e);
    }
  });

  return bot;
}

/**
 * Launch the bot in webhook mode (no polling conflicts)
 *
 * Webhook mode: Updates are delivered via HTTP POST to /api/telegram/webhook
 * This avoids conflicts with multiple bot instances
 */
export async function launchTelegramBot(bot: Telegraf<CoachContext>) {
  try {
    console.log('🚀 Iniciando Telegram Bot en WEBHOOK mode...');

    // Remove webhook to reset state (optional, for testing)
    // await bot.telegram.deleteWebhook();

    // Set webhook URL (update this to match your deployment URL)
    const webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || 'http://localhost:3002/api/telegram/webhook';

    try {
      await bot.telegram.setWebhook(webhookUrl, {
        secret_token: process.env.TELEGRAM_SECRET_TOKEN || 'errt-secret-token-12345'
      });
      console.log(`✅ Telegram Webhook configurado: ${webhookUrl}`);
    } catch (webhookErr) {
      console.warn(`⚠️ Webhook setup warning:`, webhookErr);
      console.log('   Bot continuará funcionando con endpoints REST');
    }

    // Graceful shutdown
    process.once('SIGINT', () => {
      console.log('Stopping Telegram Bot...');
      bot.stop('SIGINT');
    });
    process.once('SIGTERM', () => {
      console.log('Stopping Telegram Bot...');
      bot.stop('SIGTERM');
    });

    console.log('✅ Telegram Bot webhook mode activo');
  } catch (err) {
    console.error('❌ Error al iniciar el bot:', err);
    throw err;
  }
}

/**
 * Register webhook endpoint for Telegram updates
 * This is where Telegram sends user messages when using webhook mode
 */
export function getTelegramWebhookHandler(bot: Telegraf<CoachContext>) {
  return async (ctx: any, reply: any) => {
    try {
      // Verify secret token if configured
      const secretToken = ctx.request.headers['x-telegram-bot-api-secret-token'];
      if (process.env.TELEGRAM_SECRET_TOKEN && secretToken !== process.env.TELEGRAM_SECRET_TOKEN) {
        console.warn('Invalid secret token received');
        return reply.status(401).send({ error: 'Unauthorized' });
      }

      // Process the update
      await bot.handleUpdate(ctx.request.body, reply);
      return reply.status(200).send({ ok: true });
    } catch (err) {
      console.error('Webhook handler error:', err);
      return reply.status(500).send({ error: 'Internal server error' });
    }
  };
}

export { Telegraf, Context };
