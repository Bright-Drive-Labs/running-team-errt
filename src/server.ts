// CRITICAL: Load environment variables FIRST
import './load-env';

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import bcrypt from 'bcrypt';
import { supabase } from './lib/supabase';
import { AuthRequest, requireAuth, requireAdminAuth, getClientIp, registerJwtPlugin } from './middleware/authMiddleware';
import { requireTelegramAuth, CoachRequest } from './middleware/validateTelegramUser';
import { logAction, logWorkoutPush, logAthleteLogin, logAthleteDataSync } from './utils/auditLog';
import { createIntervalsWorkout } from './lib/intervals-api';
import registerTelegramEndpoints from './handlers/fastifyTelegramEndpoints';
import { initTelegramBot, launchTelegramBot, getTelegramWebhookHandler } from './handlers/telegramBot';
import { isRateLimited, getRemaining, getResetTime } from './middleware/rateLimiter';
import { validateGarminWorkout, generateValidationReport } from './utils/garminValidator';

/**
 * Payload types
 */
interface WorkoutPayload {
  workout_name: string;
  athlete_ids?: string[];
  description?: string;
}

interface SettingsPayload {
  [key: string]: any;
}

/**
 * Initialize Fastify server with security middleware
 */
export async function createServer(): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: {
      level: process.env.LOG_LEVEL || 'info'
    }
  });

  try {
    // SECURITY: Require JWT_SECRET in environment
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('CRITICAL: JWT_SECRET must be defined in environment variables. Never use default keys in production.');
    }

    // Register JWT plugin
    await fastify.register(fastifyJwt, {
      secret: jwtSecret
    });

    // SECURITY: Restrict CORS - never use wildcard in production
    const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
    if (corsOrigin === '*') {
      console.warn('⚠️  WARNING: CORS_ORIGIN is set to wildcard. This is only safe in development.');
    }

    // Register CORS
    await fastify.register(fastifyCors, {
      origin: corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    });

    console.log('Middleware registered: JWT, CORS');

    // ============================================
    // PUBLIC ROUTES (no auth required)
    // ============================================

    fastify.get('/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    fastify.get('/api/health', async (request, reply) => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // ============================================
    // AUTH ROUTES
    // ============================================

    /**
     * POST /auth/login
     * Login with email and password
     * Returns JWT token
     */
    fastify.post<{ Body: { email: string; password: string }; Reply: any }>(
      '/auth/login',
      async (request, reply) => {
        try {
          const { email, password } = request.body;
          const clientIp = getClientIp(request);

          // SECURITY: Rate limiting to prevent brute force attacks
          if (isRateLimited(clientIp)) {
            const resetTime = getResetTime(clientIp);
            const remaining = getRemaining(clientIp);
            console.warn(`⚠️  Rate limit exceeded for IP: ${clientIp}`);
            return reply.status(429).header('Retry-After', Math.ceil((resetTime - Date.now()) / 1000)).send({
              error: 'Too many login attempts. Please try again later.',
              code: 'RATE_LIMITED',
              remainingAttempts: remaining,
              resetTime: new Date(resetTime).toISOString()
            });
          }

          if (!email || !password) {
            return reply.status(400).send({
              error: 'Missing email or password'
            });
          }

          // Find user in database
          const { data: user, error: userError } = await supabase
            .from('athletes')
            .select('id, email, tenant_id, is_admin, password_hash')
            .eq('email', email)
            .single();

          if (userError || !user) {
            // Log failed login
            await logAthleteLogin({
              tenant_id: 'unknown',
              athlete_id: 'unknown',
              email,
              status: 'FAILED',
              error: 'User not found',
              ip_address: clientIp
            });

            return reply.status(401).send({
              error: 'Invalid credentials'
            });
          }

          // SECURITY: Use bcrypt to verify password
          const passwordMatch = await bcrypt.compare(password, user.password_hash);
          if (!passwordMatch) {
            await logAthleteLogin({
              tenant_id: user.tenant_id,
              athlete_id: user.id,
              email,
              status: 'FAILED',
              error: 'Invalid password',
              ip_address: clientIp
            });

            return reply.status(401).send({
              error: 'Invalid credentials'
            });
          }

          // Create JWT token
          const token = fastify.jwt.sign(
            {
              user_id: user.id,
              email: user.email,
              tenant_id: user.tenant_id,
              is_admin: user.is_admin
            },
            { expiresIn: '24h' }
          );

          // Log successful login
          await logAthleteLogin({
            tenant_id: user.tenant_id,
            athlete_id: user.id,
            email,
            status: 'SUCCESS',
            ip_address: clientIp
          });

          return reply.status(200).send({
            access_token: token,
            user: {
              id: user.id,
              email: user.email,
              tenant_id: user.tenant_id,
              is_admin: user.is_admin
            }
          });

        } catch (err) {
          console.error('Login error:', err);
          return reply.status(500).send({
            error: 'Internal server error'
          });
        }
      }
    );

    /**
     * POST /auth/refresh
     * Refresh JWT token
     */
    fastify.post<{ Reply: any }>(
      '/auth/refresh',
      { preHandler: requireAuth() },
      async (request: AuthRequest, reply) => {
        try {
          if (!request.user) {
            return reply.status(401).send({ error: 'Unauthorized' });
          }

          const newToken = fastify.jwt.sign(
            {
              user_id: request.user.user_id,
              email: request.user.email,
              tenant_id: request.user.tenant_id,
              is_admin: request.user.is_admin
            },
            { expiresIn: '24h' }
          );

          return reply.status(200).send({
            access_token: newToken
          });

        } catch (err) {
          console.error('Refresh error:', err);
          return reply.status(500).send({ error: 'Internal server error' });
        }
      }
    );

    // ============================================
    // PROTECTED ROUTES (JWT required)
    // ============================================

    /**
     * POST /api/workouts/push
     * Create and push workout to athletes
     *
     * Headers:
     * - Authorization: Bearer <JWT>
     *
     * Body:
     * {
     *   "workout_name": "5x1km @ 3:45/km",
     *   "athlete_ids": ["uuid1", "uuid2"],
     *   "description": "Optional description"
     * }
     */
    fastify.post<{ Body: WorkoutPayload; Reply: any }>(
      '/api/workouts/push',
      { preHandler: requireAuth() },
      async (request: AuthRequest, reply) => {
        try {
          const { workout_name, athlete_ids = [], description } = request.body;
          const user = request.user!;
          const clientIp = getClientIp(request);

          if (!workout_name || workout_name.trim().length === 0) {
            await logAction({
              tenant_id: user.tenant_id,
              action: 'WORKOUT_PUSHED',
              entity_type: 'workout',
              entity_id: 'unknown',
              actor_id: user.user_id,
              actor_type: 'FRONTEND',
              actor_name: user.email,
              status: 'FAILED',
              error_message: 'Missing workout_name',
              ip_address: clientIp
            });

            return reply.status(400).send({
              error: 'workout_name is required'
            });
          }

          // Create workout in database
          const { data: workout, error: workoutError } = await supabase
            .from('workouts')
            .insert({
              tenant_id: user.tenant_id,
              name: workout_name.trim(),
              description: description || null,
              created_by: user.user_id,
              status: 'published',
              created_at: new Date().toISOString()
            })
            .select('id, name')
            .single();

          if (workoutError || !workout) {
            console.error('Workout creation error:', workoutError);

            await logWorkoutPush({
              tenant_id: user.tenant_id,
              actor_id: user.user_id,
              actor_name: user.email,
              workout_id: 'unknown',
              workout_name,
              status: 'FAILED',
              error: workoutError?.message || 'Database error'
            });

            return reply.status(500).send({
              error: 'Failed to create workout',
              details: workoutError?.message
            });
          }

          // Push to Intervals.icu for each athlete
          const pushResults = [];

          for (const athleteId of athlete_ids) {
            try {
              const success = await createIntervalsWorkout(
                athleteId,
                user.tenant_id,
                user.email,
                {
                  name: workout_name,
                  description: description || undefined,
                  coach_notes: `Created by ${user.email}`
                }
              );

              pushResults.push({
                athlete_id: athleteId,
                success
              });
            } catch (err) {
              console.error(`Error pushing to athlete ${athleteId}:`, err);
              pushResults.push({
                athlete_id: athleteId,
                success: false,
                error: err instanceof Error ? err.message : 'Unknown error'
              });
            }
          }

          // Log successful workout creation
          await logWorkoutPush({
            tenant_id: user.tenant_id,
            actor_id: user.user_id,
            actor_name: user.email,
            workout_id: workout.id,
            workout_name,
            status: 'SUCCESS'
          });

          return reply.status(201).send({
            success: true,
            workout: {
              id: workout.id,
              name: workout.name
            },
            pushed_to_athletes: pushResults,
            timestamp: new Date().toISOString()
          });

        } catch (err) {
          console.error('POST /api/workouts/push error:', err);

          if ((request as AuthRequest).user) {
            const user = (request as AuthRequest).user!;
            await logAction({
              tenant_id: user.tenant_id,
              action: 'WORKOUT_PUSHED',
              entity_type: 'workout',
              actor_id: user.user_id,
              actor_type: 'FRONTEND',
              actor_name: user.email,
              status: 'FAILED',
              error_message: err instanceof Error ? err.message : 'Unknown error'
            });
          }

          return reply.status(500).send({
            error: 'Internal server error'
          });
        }
      }
    );

    /**
     * PUT /api/athlete/settings
     * Update athlete profile settings
     */
    fastify.put<{ Body: SettingsPayload; Reply: any }>(
      '/api/athlete/settings',
      { preHandler: requireAuth() },
      async (request: AuthRequest, reply) => {
        try {
          const user = request.user!;
          const settingsUpdate = request.body;

          if (!settingsUpdate || Object.keys(settingsUpdate).length === 0) {
            return reply.status(400).send({
              error: 'No settings to update'
            });
          }

          // Get current settings
          const { data: currentAthlete, error: fetchError } = await supabase
            .from('athletes')
            .select('id, name, bio, instagram_handle, website')
            .eq('id', user.user_id)
            .single();

          if (fetchError || !currentAthlete) {
            return reply.status(404).send({
              error: 'Athlete not found'
            });
          }

          // Update athlete
          const { data: updated, error: updateError } = await supabase
            .from('athletes')
            .update(settingsUpdate)
            .eq('id', user.user_id)
            .select()
            .single();

          if (updateError) {
            console.error('Settings update error:', updateError);

            await logAction({
              tenant_id: user.tenant_id,
              action: 'ATHLETE_SETTINGS_UPDATED',
              entity_type: 'athlete',
              entity_id: user.user_id,
              actor_id: user.user_id,
              actor_type: 'FRONTEND',
              actor_name: user.email,
              status: 'FAILED',
              error_message: updateError.message
            });

            return reply.status(500).send({
              error: 'Failed to update settings'
            });
          }

          // Log successful update
          await logAction({
            tenant_id: user.tenant_id,
            action: 'ATHLETE_SETTINGS_UPDATED',
            entity_type: 'athlete',
            entity_id: user.user_id,
            actor_id: user.user_id,
            actor_type: 'FRONTEND',
            actor_name: user.email,
            before_values: currentAthlete,
            after_values: updated,
            status: 'SUCCESS'
          });

          return reply.status(200).send({
            success: true,
            athlete: updated
          });

        } catch (err) {
          console.error('PUT /api/athlete/settings error:', err);
          return reply.status(500).send({
            error: 'Internal server error'
          });
        }
      }
    );

    /**
     * GET /api/audit-logs
     * Get audit logs for the tenant (admin only)
     */
    fastify.get<{ Querystring: { limit?: string; offset?: string }; Reply: any }>(
      '/api/audit-logs',
      { preHandler: requireAdminAuth() },
      async (request: AuthRequest, reply) => {
        try {
          const user = request.user!;
          const limit = Math.min(parseInt(request.query.limit || '50'), 500);
          const offset = parseInt(request.query.offset || '0');

          const { data: logs, error, count } = await supabase
            .from('audit_logs')
            .select('*', { count: 'exact' })
            .eq('tenant_id', user.tenant_id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

          if (error) {
            console.error('Audit logs fetch error:', error);
            return reply.status(500).send({
              error: 'Failed to fetch audit logs'
            });
          }

          return reply.status(200).send({
            logs: logs || [],
            pagination: {
              limit,
              offset,
              total: count || 0
            }
          });

        } catch (err) {
          console.error('GET /api/audit-logs error:', err);
          return reply.status(500).send({
            error: 'Internal server error'
          });
        }
      }
    );

    /**
     * GET /api/athlete/profile
     * Get authenticated user's profile
     */
    fastify.get<{ Reply: any }>(
      '/api/athlete/profile',
      { preHandler: requireAuth() },
      async (request: AuthRequest, reply) => {
        try {
          const user = request.user!;

          const { data: athlete, error } = await supabase
            .from('athletes')
            .select('*')
            .eq('id', user.user_id)
            .single();

          if (error || !athlete) {
            return reply.status(404).send({
              error: 'Athlete not found'
            });
          }

          return reply.status(200).send({
            athlete: {
              ...athlete,
              // Never return password_hash or sensitive data
              password_hash: undefined
            }
          });

        } catch (err) {
          console.error('GET /api/athlete/profile error:', err);
          return reply.status(500).send({
            error: 'Internal server error'
          });
        }
      }
    );

    // ============================================
    // INTERVALS API — Autenticado por Supabase JWT (Google OAuth)
    // ============================================

    /**
     * POST /api/intervals/check-completion
     * Verifica si un atleta completó un workout en una fecha dada.
     * Llamado por el AthletePortal (VIP). Auth: Supabase session token.
     */
    fastify.post<{ Body: { athlete_id: string; date: string }; Reply: any }>(
      '/api/intervals/check-completion',
      async (request, reply) => {
        try {
          const authHeader = request.headers.authorization;
          if (!authHeader?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Unauthorized' });
          const token = authHeader.replace('Bearer ', '');

          // Validar sesión Supabase
          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          if (authError || !user) return reply.status(401).send({ error: 'Invalid session' });

          const { athlete_id, date } = request.body;
          if (!athlete_id || !date) return reply.status(400).send({ error: 'athlete_id and date required' });

          // Obtener atleta y verificar que pertenece al usuario
          const { data: athlete } = await supabase
            .from('athletes')
            .select('id, tenant_id, intervals_athlete_id')
            .eq('id', athlete_id)
            .eq('email', user.email)
            .single();

          if (!athlete?.intervals_athlete_id) return reply.status(200).send({ completed: false });

          // Obtener API key desde Vault
          const { data: apiKey } = await supabase.rpc('get_intervals_key', {
            p_athlete_id: athlete.id,
            p_tenant_id: athlete.tenant_id
          });
          if (!apiKey) return reply.status(200).send({ completed: false });

          const auth = Buffer.from(`API_KEY:${apiKey}`).toString('base64');
          const res = await fetch(
            `https://intervals.icu/api/v1/athlete/${athlete.intervals_athlete_id}/activities?oldest=${date}&newest=${date}`,
            { headers: { 'Authorization': `Basic ${auth}` } }
          );
          if (!res.ok) return reply.status(200).send({ completed: false });
          const activities = await res.json();
          return reply.status(200).send({ completed: activities.length > 0 });

        } catch (err) {
          console.error('POST /api/intervals/check-completion error:', err);
          return reply.status(500).send({ error: 'Internal server error' });
        }
      }
    );

    /**
     * POST /api/intervals/sync-workout
     * Sincroniza un workout al calendario Intervals del atleta (VIP).
     * Auth: Supabase session token.
     *
     * VALIDACIÓN: Verifica que markdown_payload cumple Garmin Workout Rules
     */
    fastify.post<{ Body: { workout_id: string }; Reply: any }>(
      '/api/intervals/sync-workout',
      async (request, reply) => {
        try {
          const authHeader = request.headers.authorization;
          if (!authHeader?.startsWith('Bearer ')) return reply.status(401).send({ error: 'Unauthorized' });
          const token = authHeader.replace('Bearer ', '');

          const { data: { user }, error: authError } = await supabase.auth.getUser(token);
          if (authError || !user) return reply.status(401).send({ error: 'Invalid session' });

          const { workout_id } = request.body;
          if (!workout_id) return reply.status(400).send({ error: 'workout_id required' });

          // Obtener workout
          const { data: workout } = await supabase
            .from('workout_assignments')
            .select('*')
            .eq('id', workout_id)
            .single();
          if (!workout) return reply.status(404).send({ error: 'Workout not found' });

          // Obtener atleta (verificar que el usuario es dueño del workout)
          const { data: athlete } = await supabase
            .from('athletes')
            .select('id, tenant_id, intervals_athlete_id, is_vip')
            .eq('id', workout.athlete_id)
            .eq('email', user.email)
            .single();

          if (!athlete) return reply.status(403).send({ error: 'Forbidden' });
          if (!athlete.is_vip) return reply.status(403).send({ error: 'VIP access required' });
          if (!athlete.intervals_athlete_id) return reply.status(400).send({ error: 'Intervals ID not configured' });

          // 🔍 VALIDACIÓN: Verificar que markdown_payload cumple Garmin Workout Rules
          const validationResult = validateGarminWorkout(workout.markdown_payload);

          if (!validationResult.valid) {
            const report = generateValidationReport(validationResult);
            console.error(`[GARMIN VALIDATION] Workout ${workout_id} FAILED:${report}`);

            return reply.status(400).send({
              error: 'Workout format invalid',
              details: 'El markdown_payload no cumple con Garmin Workout Rules',
              validation_errors: validationResult.errors.map(e => ({
                line: e.line,
                message: e.message,
                severity: e.severity
              })),
              summary: validationResult.summary
            });
          }

          // 📝 LOG: Workout validado correctamente
          console.log(`[GARMIN VALIDATION] ✅ Workout ${workout_id} válido`);
          console.log(`[WORKOUT PAYLOAD] Enviando a Intervals.icu:`);
          console.log(`  Nombre: ${workout.workout_name}`);
          console.log(`  Atleta Intervals ID: ${athlete.intervals_athlete_id}`);
          console.log(`  Markdown payload: ${workout.markdown_payload.substring(0, 100)}...`);

          // Obtener API key desde Vault
          const { data: apiKey } = await supabase.rpc('get_intervals_key', {
            p_athlete_id: athlete.id,
            p_tenant_id: athlete.tenant_id
          });
          if (!apiKey) return reply.status(500).send({ error: 'Could not retrieve API key' });

          const auth = Buffer.from(`API_KEY:${apiKey}`).toString('base64');
          const payload = {
            category: 'WORKOUT',
            start_date_local: `${workout.target_date}T08:00:00`,
            type: 'Run',
            name: workout.workout_name,
            description: workout.coach_notes
              ? `${workout.markdown_payload}\n\n---\n📝 NOTAS DEL COACH:\n${workout.coach_notes}`
              : workout.markdown_payload
          };

          // 🚀 Enviar a Intervals.icu
          const response = await fetch(
            `https://intervals.icu/api/v1/athlete/${athlete.intervals_athlete_id}/events`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(payload)
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[INTERVALS ERROR] Status ${response.status}: ${errorText}`);

            return reply.status(500).send({
              error: 'Intervals sync failed',
              details: `Intervals.icu responded with ${response.status}`,
              intervals_response: errorText.substring(0, 500)
            });
          }

          const result = await response.json();
          console.log(`[INTERVALS SUCCESS] Workout synced. ID: ${result.id || 'unknown'}`);

          return reply.status(200).send({
            success: true,
            intervals_event_id: result.id,
            message: 'Workout successfully synced to Intervals.icu'
          });

        } catch (err) {
          console.error('POST /api/intervals/sync-workout error:', err);
          return reply.status(500).send({ error: 'Internal server error' });
        }
      }
    );

    // ============================================
    // TELEGRAM-PROTECTED ROUTES
    // ============================================

    // Initialize Telegram Bot (will be launched in startServer)
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
    let bot = null;
    if (telegramToken) {
      bot = initTelegramBot(telegramToken);
      console.log('🤖 Telegram Bot initialized (will launch after server starts)');
    }

    // Register Telegram endpoints with bot instance
    await registerTelegramEndpoints(fastify, bot);

    // ============================================
    // Error handling
    // ============================================

    fastify.setErrorHandler((error, request, reply) => {
      console.error('Unhandled error:', error);

      return reply.status(500).send({
        error: 'Internal server error',
        message: error.message
      });
    });

    console.log('Server initialized successfully');

    // Attach bot to fastify instance so it can be accessed in startServer
    (fastify as any).telegramBot = bot;

    return fastify;

  } catch (err) {
    console.error('Server initialization error:', err);
    throw err;
  }
}

/**
 * Start the server
 */
export async function startServer(port: number = 3000) {
  try {
    const fastify = await createServer();

    await fastify.listen({ port, host: '0.0.0.0' });

    console.log(`
    ====================================
    Server listening on port ${port}
    Environment: ${process.env.NODE_ENV || 'development'}
    ====================================

    Available endpoints:
    - GET  /health
    - POST /auth/login
    - POST /auth/refresh
    - POST /api/workouts/push (protected)
    - PUT  /api/athlete/settings (protected)
    - GET  /api/athlete/profile (protected)
    - GET  /api/audit-logs (admin only)
    - GET  /api/telegram/* (telegram protected)
    - POST /api/telegram/* (telegram protected)
    `);

    // ============================================
    // LAUNCH TELEGRAM BOT
    // ============================================
    const bot = (fastify as any).telegramBot;
    if (bot) {
      try {
        console.log('🤖 Launching Telegram Bot...');

        // Launch bot (webhook mode)
        await launchTelegramBot(bot);

        console.log('✅ Telegram Bot online and listening for messages');
      } catch (botErr) {
        console.error('⚠️ Telegram Bot launch failed:', botErr);
        console.error('Continuing without Telegram bot...');
      }
    } else {
      console.warn('⚠️ TELEGRAM_BOT_TOKEN not set, bot disabled');
    }

    return fastify;

  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// Start server if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const port = parseInt(process.env.PORT || '3000');
  startServer(port);
}
