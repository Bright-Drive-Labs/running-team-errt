import { supabase } from '../lib/supabase';

export type AuditAction =
  | 'WORKOUT_PUSHED'
  | 'API_KEY_STORED'
  | 'API_KEY_ACCESSED'
  | 'ATHLETE_LOGIN'
  | 'COACH_COMMAND'
  | 'ATHLETE_SUBSCRIPTION'
  | 'ATHLETE_DATA_SYNC'
  | 'WEBHOOK_RECEIVED'
  | 'USER_CREATED'
  | 'USER_UPDATED';

export type ActorType = 'TELEGRAM_BOT' | 'FRONTEND' | 'SYSTEM' | 'API' | 'WEBHOOK';

export interface LogActionParams {
  tenant_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  actor_id: string;
  actor_type: ActorType;
  actor_name: string;
  before_values?: any;
  after_values?: any;
  status: 'SUCCESS' | 'FAILED' | 'DENIED';
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Helper to insert audit logs
 * Validates tenant and handles errors gracefully
 * Logging failures should not break the application
 */
export async function logAction(params: LogActionParams): Promise<string | null> {
  try {
    const {
      tenant_id,
      action,
      entity_type,
      entity_id,
      actor_id,
      actor_type,
      actor_name,
      before_values,
      after_values,
      status,
      error_message,
      ip_address,
      user_agent
    } = params;

    // Validate required fields
    if (!tenant_id || !action || !actor_id) {
      console.warn('logAction: Missing required fields', { tenant_id, action, actor_id });
      return null;
    }

    // Call RPC log_action() (created by AGENT 2)
    const { data, error } = await supabase.rpc('log_action', {
      p_tenant_id: tenant_id,
      p_action: action,
      p_entity_type: entity_type,
      p_entity_id: entity_id,
      p_actor_id: actor_id,
      p_actor_type: actor_type,
      p_actor_name: actor_name,
      p_before_values: before_values ? JSON.stringify(before_values) : null,
      p_after_values: after_values ? JSON.stringify(after_values) : null,
      p_status: status,
      p_error_message: error_message || null,
      p_ip_address: ip_address || null,
      p_user_agent: user_agent || null
    });

    if (error) {
      console.error('Audit log insertion failed:', error);
      return null;
    }

    return data;

  } catch (err) {
    console.error('logAction error:', err);
    // Don't throw - logging failures shouldn't break app
    return null;
  }
}

/**
 * Specialized logging helper for workout pushes
 */
export async function logWorkoutPush(params: {
  tenant_id: string;
  actor_id: string;
  actor_name: string;
  workout_id: string;
  workout_name: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}) {
  return logAction({
    tenant_id: params.tenant_id,
    action: 'WORKOUT_PUSHED',
    entity_type: 'workout',
    entity_id: params.workout_id,
    actor_id: params.actor_id,
    actor_type: 'TELEGRAM_BOT',
    actor_name: params.actor_name,
    after_values: { name: params.workout_name },
    status: params.status,
    error_message: params.error
  });
}

/**
 * Specialized logging helper for API key access
 */
export async function logApiKeyAccessed(params: {
  tenant_id: string;
  actor_id: string;
  actor_name: string;
  athlete_id: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}) {
  return logAction({
    tenant_id: params.tenant_id,
    action: 'API_KEY_ACCESSED',
    entity_type: 'api_key',
    entity_id: params.athlete_id,
    actor_id: params.actor_id,
    actor_type: 'SYSTEM',
    actor_name: params.actor_name,
    status: params.status,
    error_message: params.error
  });
}

/**
 * Specialized logging helper for athlete login
 */
export async function logAthleteLogin(params: {
  tenant_id: string;
  athlete_id: string;
  email: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
  ip_address?: string;
}) {
  return logAction({
    tenant_id: params.tenant_id,
    action: 'ATHLETE_LOGIN',
    entity_type: 'athlete',
    entity_id: params.athlete_id,
    actor_id: params.email,
    actor_type: 'FRONTEND',
    actor_name: params.email,
    status: params.status,
    error_message: params.error,
    ip_address: params.ip_address
  });
}

/**
 * Specialized logging helper for coach commands
 */
export async function logCoachCommand(params: {
  tenant_id: string;
  coach_id: string;
  coach_name: string;
  command: string;
  status: 'SUCCESS' | 'FAILED' | 'DENIED';
  error?: string;
}) {
  return logAction({
    tenant_id: params.tenant_id,
    action: 'COACH_COMMAND',
    entity_type: 'telegram_command',
    entity_id: params.command,
    actor_id: params.coach_id,
    actor_type: 'TELEGRAM_BOT',
    actor_name: params.coach_name,
    status: params.status,
    error_message: params.error
  });
}

/**
 * Specialized logging helper for athlete subscription events
 */
export async function logAthleteSubscription(params: {
  tenant_id: string;
  athlete_id: string;
  athlete_email: string;
  subscription_type: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}) {
  return logAction({
    tenant_id: params.tenant_id,
    action: 'ATHLETE_SUBSCRIPTION',
    entity_type: 'subscription',
    entity_id: params.athlete_id,
    actor_id: params.athlete_email,
    actor_type: 'SYSTEM',
    actor_name: params.athlete_email,
    after_values: { type: params.subscription_type },
    status: params.status,
    error_message: params.error
  });
}

/**
 * Specialized logging helper for athlete data sync
 */
export async function logAthleteDataSync(params: {
  tenant_id: string;
  athlete_id: string;
  data_type: string;
  record_count: number;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
}) {
  return logAction({
    tenant_id: params.tenant_id,
    action: 'ATHLETE_DATA_SYNC',
    entity_type: 'data_sync',
    entity_id: params.athlete_id,
    actor_id: 'system',
    actor_type: 'SYSTEM',
    actor_name: 'Garmin Sync System',
    after_values: { data_type: params.data_type, record_count: params.record_count },
    status: params.status,
    error_message: params.error
  });
}

/**
 * Specialized logging helper for webhook events
 */
export async function logWebhookReceived(params: {
  tenant_id: string;
  webhook_type: string;
  athlete_id?: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
  payload_size?: number;
}) {
  return logAction({
    tenant_id: params.tenant_id,
    action: 'WEBHOOK_RECEIVED',
    entity_type: 'webhook',
    entity_id: params.athlete_id,
    actor_id: 'webhook_system',
    actor_type: 'WEBHOOK',
    actor_name: params.webhook_type,
    after_values: { type: params.webhook_type, payload_size: params.payload_size },
    status: params.status,
    error_message: params.error
  });
}
