import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientDist = join(__dirname, '../../client/dist');
const serverPublic = join(__dirname, '../public');

if (!existsSync(clientDist)) {
  console.error('Client build not found. Run "pnpm --filter client build" first.');
  process.exit(1);
}

rmSync(serverPublic, { recursive: true, force: true });
mkdirSync(serverPublic, { recursive: true });
cpSync(clientDist, serverPublic, { recursive: true });

console.log('Copied client build to server/public');
