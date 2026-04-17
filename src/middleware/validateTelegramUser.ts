import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { supabase } from '../lib/supabase';

interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
}

export interface CoachRequest extends FastifyRequest {
  coach?: {
    id: string;
    tenant_id: string;
    name: string;
    email: string;
    is_admin: boolean;
  };
  coach_id?: string;
  tenant_id?: string;
}

/**
 * Validates incoming request has a valid Telegram user ID from an authorized coach
 * Attaches coach data to the request object
 */
export async function validateTelegramUser(
  request: FastifyRequest,
  reply: FastifyReply
) {
  try {
    // SECURITY: Require Telegram Bot Token
    const telegramBotToken = process.env.TELEGRAM_BOT_TOKEN;
    if (!telegramBotToken) {
      console.error('CRITICAL: TELEGRAM_BOT_TOKEN not set in environment');
      return reply.status(500).send({
        error: 'Server configuration error',
        code: 'MISSING_BOT_TOKEN'
      });
    }

    // Get Telegram ID from header
    const telegramUserId = request.headers['x-telegram-user-id'] as string;
    if (!telegramUserId) {
      return reply.status(401).send({
        error: 'Missing X-Telegram-User-Id header',
        code: 'NO_TELEGRAM_ID'
      });
    }

    // SECURITY: HMAC validation (required for Telegram Bot integration)
    const signature = request.headers['x-telegram-signature'] as string;
    if (!signature) {
      return reply.status(401).send({
        error: 'Missing X-Telegram-Signature header',
        code: 'NO_SIGNATURE'
      });
    }

    const body = request.body || '';
    const hash = crypto
      .createHmac('sha256', telegramBotToken)
      .update(JSON.stringify(body))
      .digest('hex');

    if (hash !== signature) {
      console.warn(`⚠️  Telegram signature mismatch for user ${telegramUserId}`);
      return reply.status(401).send({
        error: 'Invalid Telegram signature',
        code: 'INVALID_SIGNATURE'
      });
    }

    // Search for coach in athletes table
    const { data: coach, error } = await supabase
      .from('athletes')
      .select('id, tenant_id, name, email, is_admin')
      .eq('telegram_user_id', telegramUserId)
      .eq('is_admin', true)
      .single();

    if (error || !coach) {
      return reply.status(403).send({
        error: 'Telegram user not authorized. Only coaches can use this bot.',
        code: 'NOT_AUTHORIZED'
      });
    }

    // Attach coach info to request
    const coachRequest = request as unknown as CoachRequest;
    coachRequest.coach = coach;
    coachRequest.coach_id = coach.id;
    coachRequest.tenant_id = coach.tenant_id;

  } catch (err) {
    console.error('Telegram validation error:', err);
    return reply.status(500).send({
      error: 'Validation error',
      code: 'VALIDATION_ERROR',
      details: err instanceof Error ? err.message : 'Unknown error'
    });
  }
}

/**
 * Middleware factory for Fastify route protection
 * Usage: fastify.post('/api/telegram/test', { preHandler: requireTelegramAuth() }, handler)
 */
export function requireTelegramAuth() {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    await validateTelegramUser(request, reply);
  };
}
