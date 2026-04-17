/**
 * Server Entry Point
 *
 * This file starts the Fastify server with all security middleware integrated
 *
 * Usage:
 * $ npm run server
 * $ NODE_ENV=production node --loader ts-node/esm src/server-entry.ts
 */

import { startServer } from './server';

const port = parseInt(process.env.PORT || '3000');
const env = process.env.NODE_ENV || 'development';

console.log(`
===============================================
Starting ERRT Backend Server
Environment: ${env}
Port: ${port}
===============================================
`);

startServer(port)
  .then(() => {
    console.log('Server started successfully');
  })
  .catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
