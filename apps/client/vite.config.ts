import { cpSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = dirname(fileURLToPath(import.meta.url));
const serverPublic = join(rootDir, '../server/public');

/**
 * Vite plugin that mirrors the client build into the Nest static directory.
 * Nest serves `apps/server/public` in production; this hook keeps it in sync after each Vite build or watch cycle.
 * @returns {Plugin} Vite plugin with a `closeBundle` hook.
 */
function copyClientBuildToServerPublic(): Plugin {
  return {
    name: 'copy-to-server-public',
    /**
     * Deletes the previous server public folder and copies `client/dist` wholesale.
     * Runs on every bundle close so `pnpm dev:static` updates the API server's static assets automatically.
     * @returns {void}
     */
    closeBundle() {
      const clientDist = join(rootDir, 'dist');
      rmSync(serverPublic, { recursive: true, force: true });
      mkdirSync(serverPublic, { recursive: true });
      cpSync(clientDist, serverPublic, { recursive: true });
      console.log('Synced client build to server/public');
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyClientBuildToServerPublic()],
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
