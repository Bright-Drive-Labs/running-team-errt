/**
 * Type definitions for Telegram Bot and Fastify integration
 */

import { FastifyRequest } from 'fastify';
import { Context } from 'telegraf';

/**
 * Extended Fastify Request with coach information
 * Used by middleware to attach coach data
 */
export interface CoachRequest extends FastifyRequest {
  coach?: CoachData;
  coach_id?: string;
  tenant_id?: string;
}

/**
 * Coach data extracted from athletes table
 */
export interface CoachData {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  is_admin: boolean;
}

/**
 * Extended Telegraf Context with coach information
 * Used by bot commands to access coach data
 */
export interface CoachContext extends Context {
  coach?: CoachData;
  tenant_id?: string;
}

/**
 * Telegram user information from Telegram API
 */
export interface TelegramUser {
  id: number;
  first_name: string;
  username?: string;
  is_bot?: boolean;
  language_code?: string;
}

/**
 * Audit log action types
 */
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

/**
 * Actor types for audit logs
 */
export type ActorType = 'TELEGRAM_BOT' | 'FRONTEND' | 'SYSTEM' | 'API' | 'WEBHOOK';

/**
 * Audit log status
 */
export type AuditStatus = 'SUCCESS' | 'FAILED' | 'DENIED';

/**
 * Parameters for logAction() function
 */
export interface LogActionParams {
  tenant_id: string;
  action: AuditAction;
  entity_type: string;
  entity_id?: string;
  actor_id: string;
  actor_type: ActorType;
  actor_name: string;
  before_values?: Record<string, any>;
  after_values?: Record<string, any>;
  status: AuditStatus;
  error_message?: string;
  ip_address?: string;
  user_agent?: string;
}

/**
 * Workout data from workouts table
 */
export interface Workout {
  id: string;
  tenant_id: string;
  name: string;
  description?: string;
  created_by: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at?: string;
}

/**
 * Athlete data from athletes table
 */
export interface Athlete {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  is_admin: boolean;
  telegram_user_id?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * API Response wrapper for success responses
 */
export interface ApiSuccessResponse<T = any> {
  success: true;
  message?: string;
  data?: T;
  [key: string]: any;
}

/**
 * API Response wrapper for error responses
 */
export interface ApiErrorResponse {
  success?: false;
  error: string;
  code?: string;
  details?: string;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit: number;
  offset: number;
  total?: number;
}

/**
 * Pagination metadata for list responses
 */
export interface PaginationMeta {
  limit: number;
  offset: number;
  total?: number;
}
