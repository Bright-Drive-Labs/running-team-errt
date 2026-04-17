// CRITICAL: Load environment variables FIRST
import './load-env';

import { startServer } from './server.js';

const port = parseInt(process.env.PORT || '3000');
startServer(port).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
