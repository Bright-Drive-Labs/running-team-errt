/**
 * Shared TypeScript types and interfaces
 */

/**
 * Authenticated User (from JWT)
 */
export interface AuthUser {
  user_id: string;
  email: string;
  tenant_id: string;
  is_admin: boolean;
}

/**
 * Coach (from Telegram validation)
 */
export interface Coach {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  is_admin: boolean;
}

/**
 * Audit Log Action Types
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
  | 'USER_UPDATED'
  | 'ATHLETE_SETTINGS_UPDATED'
  | 'GARMIN_SYNC';

/**
 * Audit Log Status
 */
export type AuditStatus = 'SUCCESS' | 'FAILED' | 'DENIED';

/**
 * Actor Type
 */
export type ActorType = 'TELEGRAM_BOT' | 'FRONTEND' | 'SYSTEM' | 'API' | 'WEBHOOK';

/**
 * Workout Data
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
 * Athlete Profile
 */
export interface Athlete {
  id: string;
  tenant_id: string;
  email: string;
  name: string;
  is_admin: boolean;
  telegram_user_id?: string;
  bio?: string;
  instagram_handle?: string;
  website?: string;
  created_at: string;
  updated_at?: string;
}

/**
 * API Response format
 */
export interface ApiResponse<T> {
  success?: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: string;
  timestamp?: string;
}

/**
 * Pagination
 */
export interface Pagination {
  limit: number;
  offset: number;
  total: number;
}

/**
 * Error Response
 */
export interface ErrorResponse {
  error: string;
  code?: string;
  details?: string;
}
