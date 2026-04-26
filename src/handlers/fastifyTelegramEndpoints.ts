import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { requireTelegramAuth, CoachRequest } from '../middleware/validateTelegramUser';
import { logAction, logWorkoutPush, logCoachCommand } from '../utils/auditLog';
import { supabase } from '../lib/supabase';

/**
 * Register Telegram-related Fastify endpoints
 * These are used for testing and webhook validation
 *
 * Usage in main server file:
 * ```
 * import registerTelegramEndpoints from './handlers/fastifyTelegramEndpoints';
 * registerTelegramEndpoints(fastifyInstance, botInstance);
 * ```
 */
export async function registerTelegramEndpoints(fastify: FastifyInstance, bot?: any) {

  /**
   * POST /api/telegram/test
   * Test endpoint to validate Telegram user authorization
   *
   * Headers:
   * - X-Telegram-User-Id: The Telegram user ID to validate
   *
   * Response: 200 with coach data, 401/403 with error
   */
  fastify.post<{ Reply: any }>(
    '/api/telegram/test',
    {
      preHandler: requireTelegramAuth()
    },
    async (request: CoachRequest, reply: FastifyReply) => {
      try {
        if (!request.coach || !request.tenant_id) {
          return reply.status(500).send({
            error: 'Coach data not attached to request'
          });
        }

        // Log successful validation
        await logAction({
          tenant_id: request.tenant_id,
          action: 'COACH_COMMAND',
          entity_type: 'telegram_validation_test',
          actor_id: request.coach.id,
          actor_type: 'API',
          actor_name: request.coach.name,
          status: 'SUCCESS'
        });

        return reply.status(200).send({
          success: true,
          message: 'Authorization successful',
          coach: {
            id: request.coach.id,
            name: request.coach.name,
            email: request.coach.email,
            is_admin: request.coach.is_admin
          },
          tenant_id: request.tenant_id
        });

      } catch (err) {
        console.error('Telegram test endpoint error:', err);
        return reply.status(500).send({
          error: 'Internal server error',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/telegram/workout
   * Create a workout via REST API (alternative to bot command)
   *
   * Headers:
   * - X-Telegram-User-Id: Coach's Telegram ID
   *
   * Body:
   * {
   *   "name": "5x1km @ 3:45/km",
   *   "description": "Optional description"
   * }
   */
  fastify.post<{ Body: { name: string; description?: string }; Reply: any }>(
    '/api/telegram/workout',
    {
      preHandler: requireTelegramAuth()
    },
    async (request: FastifyRequest & CoachRequest, reply: FastifyReply) => {
      try {
        if (!request.coach || !request.tenant_id) {
          return reply.status(500).send({ error: 'Coach data not available' });
        }

        const { name, description } = request.body;

        if (!name || name.trim().length === 0) {
          await logCoachCommand({
            tenant_id: request.tenant_id,
            coach_id: request.coach.id,
            coach_name: request.coach.name,
            command: 'create_workout',
            status: 'FAILED',
            error: 'Missing workout name'
          });

          return reply.status(400).send({
            error: 'Missing required field: name'
          });
        }

        // Create workout
        const { data: workout, error } = await supabase
          .from('workouts')
          .insert({
            tenant_id: request.tenant_id,
            name: name.trim(),
            description: description || null,
            created_by: request.coach.id,
            status: 'published',
            created_at: new Date().toISOString()
          })
          .select('id, name')
          .single();

        if (error || !workout) {
          console.error('Workout creation error:', error);

          await logWorkoutPush({
            tenant_id: request.tenant_id,
            actor_id: request.coach.id,
            actor_name: request.coach.name,
            workout_id: 'unknown',
            workout_name: name,
            status: 'FAILED',
            error: error?.message || 'Database error'
          });

          return reply.status(500).send({
            error: 'Failed to create workout',
            details: error?.message
          });
        }

        // Log success
        await logWorkoutPush({
          tenant_id: request.tenant_id,
          actor_id: request.coach.id,
          actor_name: request.coach.name,
          workout_id: workout.id,
          workout_name: name,
          status: 'SUCCESS'
        });

        return reply.status(201).send({
          success: true,
          message: 'Workout created successfully',
          workout: {
            id: workout.id,
            name: workout.name
          }
        });

      } catch (err) {
        console.error('Create workout endpoint error:', err);

        if (request.coach && request.tenant_id) {
          await logCoachCommand({
            tenant_id: request.tenant_id,
            coach_id: request.coach.id,
            coach_name: request.coach.name,
            command: 'create_workout',
            status: 'FAILED',
            error: err instanceof Error ? err.message : 'Unknown error'
          });
        }

        return reply.status(500).send({
          error: 'Internal server error',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/telegram/notify-coach
   * Notifies all coaches (is_admin=true) for a tenant via Telegram.
   * 
   * Body:
   * {
   *   "tenant_id": "...",
   *   "message": "..."
   * }
   */
  fastify.post<{ Body: { tenant_id: string; message: string }; Reply: any }>(
    '/api/telegram/notify-coach',
    async (request, reply) => {
      try {
        if (!bot) return reply.status(503).send({ error: 'Bot not configured' });
        const { tenant_id, message } = request.body;
        if (!tenant_id || !message) return reply.status(400).send({ error: 'Missing parameters' });

        const { data: coaches } = await supabase
          .from('athletes')
          .select('telegram_user_id')
          .eq('tenant_id', tenant_id)
          .eq('is_admin', true)
          .not('telegram_user_id', 'is', null);

        if (coaches && coaches.length > 0) {
          let notified = 0;
          for (const coach of coaches) {
            try {
              await bot.telegram.sendMessage(coach.telegram_user_id, message, { parse_mode: 'Markdown' });
              notified++;
            } catch(e) { console.error('Failed to notify coach', e) }
          }
          return reply.status(200).send({ success: true, notified });
        }
        return reply.status(200).send({ success: true, notified: 0 });
      } catch (err) {
        console.error('Notify coach endpoint error:', err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );

  /**
   * GET /api/telegram/workouts
   * List workouts for the coach's team
   *
   * Headers:
   * - X-Telegram-User-Id: Coach's Telegram ID
   *
   * Query params:
   * - limit: Number of workouts to return (default: 10, max: 100)
   * - offset: Pagination offset (default: 0)
   */
  fastify.get<{ Querystring: { limit?: string; offset?: string }; Reply: any }>(
    '/api/telegram/workouts',
    {
      preHandler: requireTelegramAuth()
    },
    async (request: FastifyRequest & CoachRequest, reply: FastifyReply) => {
      try {
        if (!request.coach || !request.tenant_id) {
          return reply.status(500).send({ error: 'Coach data not available' });
        }

        const limit = Math.min(parseInt(request.query.limit || '10'), 100);
        const offset = parseInt(request.query.offset || '0');

        const { data: workouts, error } = await supabase
          .from('workouts')
          .select('id, name, description, created_at, status')
          .eq('tenant_id', request.tenant_id)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          console.error('Workouts fetch error:', error);
          return reply.status(500).send({
            error: 'Failed to fetch workouts',
            details: error.message
          });
        }

        await logCoachCommand({
          tenant_id: request.tenant_id,
          coach_id: request.coach.id,
          coach_name: request.coach.name,
          command: 'list_workouts',
          status: 'SUCCESS'
        });

        return reply.status(200).send({
          success: true,
          workouts: workouts || [],
          pagination: {
            limit,
            offset,
            total: (workouts || []).length
          }
        });

      } catch (err) {
        console.error('List workouts endpoint error:', err);
        return reply.status(500).send({
          error: 'Internal server error',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/telegram/stats
   * Get team statistics
   *
   * Headers:
   * - X-Telegram-User-Id: Coach's Telegram ID
   *
   * Returns: Athlete count, workout count, etc.
   */
  fastify.get<{ Reply: any }>(
    '/api/telegram/stats',
    {
      preHandler: requireTelegramAuth()
    },
    async (request: FastifyRequest & CoachRequest, reply: FastifyReply) => {
      try {
        if (!request.coach || !request.tenant_id) {
          return reply.status(500).send({ error: 'Coach data not available' });
        }

        const [athletesData, workoutsData] = await Promise.all([
          supabase
            .from('athletes')
            .select('id', { count: 'exact' })
            .eq('tenant_id', request.tenant_id)
            .eq('is_admin', false),
          supabase
            .from('workouts')
            .select('id', { count: 'exact' })
            .eq('tenant_id', request.tenant_id)
        ]);

        await logCoachCommand({
          tenant_id: request.tenant_id,
          coach_id: request.coach.id,
          coach_name: request.coach.name,
          command: 'get_stats',
          status: 'SUCCESS'
        });

        return reply.status(200).send({
          success: true,
          stats: {
            athletes: athletesData.count || 0,
            workouts: workoutsData.count || 0,
            timestamp: new Date().toISOString()
          }
        });

      } catch (err) {
        console.error('Stats endpoint error:', err);
        return reply.status(500).send({
          error: 'Internal server error',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/telegram/debug-auth
   * Diagnostic endpoint - Check current authentication status
   *
   * Headers:
   * - X-Telegram-User-Id: The Telegram user ID to check
   *
   * Returns: Detailed info about what's in the DB for this user
   */
  fastify.get<{ Querystring: { telegram_id?: string }; Reply: any }>(
    '/api/telegram/debug-auth',
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const telegramId = request.query.telegram_id || request.headers['x-telegram-user-id'];

        if (!telegramId) {
          return reply.status(400).send({
            error: 'Missing telegram_id query param or X-Telegram-User-Id header'
          });
        }

        console.log(`[DEBUG AUTH] Checking Telegram ID: ${telegramId}`);

        // Check if user exists in athletes table
        const { data: allMatches, error: error1 } = await supabase
          .from('athletes')
          .select('id, name, email, is_admin, telegram_user_id')
          .eq('telegram_user_id', telegramId);

        console.log('[DEBUG AUTH] All matches with this telegram_user_id:', {
          count: allMatches?.length || 0,
          data: allMatches,
          error: error1?.message
        });

        // Check specifically for coaches (is_admin=true)
        const { data: coachMatches, error: error2 } = await supabase
          .from('athletes')
          .select('id, tenant_id, name, email, is_admin')
          .eq('telegram_user_id', telegramId)
          .eq('is_admin', true);

        console.log('[DEBUG AUTH] Coach query result:', {
          found: (coachMatches?.length || 0) > 0,
          count: coachMatches?.length || 0,
          data: coachMatches,
          error: error2?.message
        });

        // Check all coaches (is_admin=true) to see sample data
        const { data: allCoaches, error: error3 } = await supabase
          .from('athletes')
          .select('id, name, email, telegram_user_id, is_admin')
          .eq('is_admin', true)
          .limit(5);

        return reply.status(200).send({
          query_telegram_id: telegramId,
          all_matches_with_id: {
            count: allMatches?.length || 0,
            data: allMatches,
            error: error1?.message
          },
          coach_matches: {
            count: coachMatches?.length || 0,
            found: (coachMatches?.length || 0) > 0,
            data: coachMatches,
            note: coachMatches && coachMatches.length > 1 ? '⚠️ Multiple coaches found - bot will use the first one' : coachMatches && coachMatches.length === 1 ? '✅ Single coach found' : '❌ No coaches found',
            error: error2?.message
          },
          sample_all_coaches: {
            count: allCoaches?.length || 0,
            data: allCoaches,
            error: error3?.message
          }
        });

      } catch (err) {
        console.error('Debug auth endpoint error:', err);
        return reply.status(500).send({
          error: 'Internal server error',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * GET /api/telegram/athletes
   * List team athletes
   *
   * Headers:
   * - X-Telegram-User-Id: Coach's Telegram ID
   *
   * Query params:
   * - limit: Number of athletes to return (default: 20, max: 100)
   * - offset: Pagination offset (default: 0)
   */
  fastify.get<{ Querystring: { limit?: string; offset?: string }; Reply: any }>(
    '/api/telegram/athletes',
    {
      preHandler: requireTelegramAuth()
    },
    async (request: FastifyRequest & CoachRequest, reply: FastifyReply) => {
      try {
        if (!request.coach || !request.tenant_id) {
          return reply.status(500).send({ error: 'Coach data not available' });
        }

        const limit = Math.min(parseInt(request.query.limit || '20'), 100);
        const offset = parseInt(request.query.offset || '0');

        const { data: athletes, error } = await supabase
          .from('athletes')
          .select('id, name, email, created_at')
          .eq('tenant_id', request.tenant_id)
          .eq('is_admin', false)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          console.error('Athletes fetch error:', error);
          return reply.status(500).send({
            error: 'Failed to fetch athletes',
            details: error.message
          });
        }

        await logCoachCommand({
          tenant_id: request.tenant_id,
          coach_id: request.coach.id,
          coach_name: request.coach.name,
          command: 'list_athletes',
          status: 'SUCCESS'
        });

        return reply.status(200).send({
          success: true,
          athletes: athletes || [],
          pagination: {
            limit,
            offset,
            total: (athletes || []).length
          }
        });

      } catch (err) {
        console.error('List athletes endpoint error:', err);
        return reply.status(500).send({
          error: 'Internal server error',
          details: err instanceof Error ? err.message : 'Unknown error'
        });
      }
    }
  );

  /**
   * POST /api/telegram/webhook
   * Webhook endpoint for Telegram updates (used in webhook mode, not polling)
   *
   * Headers:
   * - X-Telegram-Bot-Api-Secret-Token: Secret token for verification
   *
   * Body: Telegram update object
   */
  fastify.post<{ Body: any; Reply: any }>(
    '/api/telegram/webhook',
    async (request, reply) => {
      try {
        // Verify secret token if configured
        const secretToken = request.headers['x-telegram-bot-api-secret-token'];
        const expectedToken = process.env.TELEGRAM_SECRET_TOKEN || 'errt-secret-token-12345';

        if (secretToken !== expectedToken) {
          console.warn('[TELEGRAM WEBHOOK] Invalid secret token received');
          return reply.status(401).send({ error: 'Unauthorized' });
        }

        // Log webhook received
        console.log('[TELEGRAM WEBHOOK] Update received:', {
          update_id: request.body.update_id,
          message: request.body.message?.text?.substring(0, 50),
          timestamp: new Date().toISOString()
        });

        // Process the update with the bot if available
        if (bot && request.body) {
          try {
            await bot.handleUpdate(request.body);
            console.log('[TELEGRAM WEBHOOK] Update processed successfully');
          } catch (err) {
            console.error('[TELEGRAM WEBHOOK] Error processing update:', err);
          }
        } else {
          console.warn('[TELEGRAM WEBHOOK] Bot not available, update not processed');
        }

        return reply.status(200).send({ ok: true });

      } catch (err) {
        console.error('[TELEGRAM WEBHOOK] Error:', err);
        return reply.status(500).send({ error: 'Internal server error' });
      }
    }
  );
}

export default registerTelegramEndpoints;
