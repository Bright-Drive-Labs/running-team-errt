/**
 * Load environment variables from .env file
 * Must be imported before any other modules that use process.env
 */
import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

try {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const envPath = resolve(__dirname, '..', '.env');
  const result = dotenv.config({ path: envPath });

  if (result.error) {
    console.warn(`⚠️  Warning loading .env: ${result.error.message}`);
  } else {
    console.log(`✓ Loaded .env from ${envPath}`);
  }
} catch (err) {
  console.error('Error in load-env:', err);
}
