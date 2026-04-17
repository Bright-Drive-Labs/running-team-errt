import { FastifyRequest, FastifyReply } from 'fastify';
import jwt from '@fastify/jwt';

/**
 * Extended FastifyRequest with JWT user data
 */
export interface AuthRequest extends FastifyRequest {
  user?: {
    user_id: string;
    email: string;
    tenant_id: string;
    is_admin: boolean;
  };
}

/**
 * Fastify JWT plugin decorator for type safety
 *
 * Usage in server:
 * await fastify.register(jwt, {
 *   secret: process.env.JWT_SECRET!
 * });
 */
export async function registerJwtPlugin(fastify: any) {
  try {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.warn('Warning: JWT_SECRET not set. Using default for development only.');
    }

    await fastify.register(jwt, {
      secret: secret || 'dev-secret-key-change-in-production'
    });

    console.log('JWT plugin registered');
  } catch (err) {
    console.error('Failed to register JWT plugin:', err);
    throw err;
  }
}

/**
 * Middleware: Require valid JWT token in Authorization header
 * Attaches decoded user to request.user
 *
 * Usage:
 * fastify.post('/api/protected', { preHandler: requireAuth() }, handler)
 */
export function requireAuth() {
  return async (request: AuthRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      // Extract JWT payload
      const decoded = request.user as any;

      if (!decoded || !decoded.user_id) {
        return reply.status(401).send({
          error: 'Invalid JWT token',
          code: 'INVALID_TOKEN'
        });
      }

      // Attach user data to request
      request.user = {
        user_id: decoded.user_id,
        email: decoded.email,
        tenant_id: decoded.tenant_id,
        is_admin: decoded.is_admin || false
      };

    } catch (err) {
      return reply.status(401).send({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
        details: err instanceof Error ? err.message : 'Invalid token'
      });
    }
  };
}

/**
 * Middleware: Require JWT and admin privileges
 */
export function requireAdminAuth() {
  return async (request: AuthRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();

      const decoded = request.user as any;

      if (!decoded || !decoded.user_id) {
        return reply.status(401).send({
          error: 'Invalid JWT token',
          code: 'INVALID_TOKEN'
        });
      }

      if (!decoded.is_admin) {
        return reply.status(403).send({
          error: 'Forbidden - Admin access required',
          code: 'FORBIDDEN'
        });
      }

      request.user = {
        user_id: decoded.user_id,
        email: decoded.email,
        tenant_id: decoded.tenant_id,
        is_admin: decoded.is_admin
      };

    } catch (err) {
      return reply.status(401).send({
        error: 'Unauthorized',
        code: 'UNAUTHORIZED'
      });
    }
  };
}

/**
 * Extract IP address from request (behind proxy)
 */
export function getClientIp(request: FastifyRequest): string {
  const forwarded = request.headers['x-forwarded-for'];

  if (forwarded) {
    const ips = typeof forwarded === 'string' ? forwarded.split(',') : forwarded;
    return (ips[0] || '').trim();
  }

  return request.ip || 'unknown';
}
