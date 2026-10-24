import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import {
  handleAiChat,
  handleAiWritingAssist,
  handleAiSearch,
  getAiSettings,
  updateAiSettings,
} from './src/server/aiRouter';
import { handleTurnstileVerification } from './src/server/turnstileRouter';
import {
  handleGetSystemSettings,
  handleUpdateSystemSettings,
} from './src/server/systemSettingsRouter';
import { handleDeleteArticle, handleSaveArticle } from './src/server/articleRouter';
import { handleContactSubmission } from './src/server/contactRouter';
import { verifyCaller } from './src/server/authHelper';

function aiApiPlugin(): Plugin {
  return {
    name: 'ai-api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) {
          return next();
        }

        const clientIp =
          (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
          req.socket.remoteAddress ||
          'local';

        // Helper to parse JSON body
        const parseBody = (): Promise<any> => {
          return new Promise((resolve) => {
            let data = '';
            req.on('data', (chunk) => {
              data += chunk;
            });
            req.on('end', () => {
              try {
                resolve(data ? JSON.parse(data) : {});
              } catch {
                resolve({});
              }
            });
          });
        };

        const sendJson = (statusCode: number, payload: any) => {
          res.statusCode = statusCode;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(payload));
        };

        const urlPath = req.url ? req.url.split('?')[0].replace(/\/+$/, '') : '';

        try {
          if (urlPath === '/api/ai/chat' && req.method === 'POST') {
            const body = await parseBody();
            const result = await handleAiChat(body, clientIp);
            if (result.error) {
              return sendJson(400, result);
            }
            return sendJson(200, result);
          }

          if (urlPath === '/api/ai/writing-assist' && req.method === 'POST') {
            const body = await parseBody();
            const result = await handleAiWritingAssist(body, clientIp);
            if (result.error) {
              return sendJson(400, result);
            }
            return sendJson(200, result);
          }

          if (urlPath === '/api/ai/search' && req.method === 'POST') {
            const body = await parseBody();
            const result = await handleAiSearch(body, clientIp);
            if (result.error) {
              return sendJson(400, result);
            }
            return sendJson(200, result);
          }

          if (urlPath === '/api/ai/settings' && req.method === 'GET') {
            const result = getAiSettings();
            return sendJson(200, result);
          }

          if (urlPath === '/api/ai/settings' && req.method === 'POST') {
            const body = await parseBody();
            const authResult = await verifyCaller(req, body);
            if (!authResult.success || !authResult.user) {
              return sendJson(authResult.status || 401, { success: false, error: authResult.error || 'Unauthorized' });
            }
            if (!authResult.user.isAdmin) {
              return sendJson(403, { success: false, error: 'Forbidden: Admin access required.' });
            }
            const result = updateAiSettings(body);
            return sendJson(200, result);
          }

          if (urlPath === '/api/verify-turnstile' && req.method === 'POST') {
            const body = await parseBody();
            const result = await handleTurnstileVerification(body, clientIp);
            if (!result.success) {
              return sendJson(400, result);
            }
            return sendJson(200, result);
          }

          if (urlPath === '/api/system-settings' && req.method === 'GET') {
            const settings = await handleGetSystemSettings();
            return sendJson(200, { success: true, settings });
          }

          if (urlPath === '/api/system-settings' && req.method === 'POST') {
            const body = await parseBody();
            const authResult = await verifyCaller(req, body);
            if (!authResult.success || !authResult.user) {
              return sendJson(authResult.status || 401, { success: false, error: authResult.error || 'Unauthorized' });
            }
            const result = await handleUpdateSystemSettings(body, authResult.user, req.headers.authorization);
            if (!result.success) {
              return sendJson(result.status || 400, result);
            }
            return sendJson(200, result);
          }

          if (urlPath === '/api/articles/save' && req.method === 'POST') {
            const body = await parseBody();
            const authResult = await verifyCaller(req, body);
            if (!authResult.success || !authResult.user) {
              return sendJson(authResult.status || 401, { success: false, error: authResult.error || 'Unauthorized' });
            }
            const result = await handleSaveArticle(body, authResult.user);
            if (!result.success) {
              return sendJson(result.status || 400, result);
            }
            return sendJson(200, result);
          }

          if (urlPath === '/api/articles/delete' && req.method === 'POST') {
            const body = await parseBody();
            const authResult = await verifyCaller(req, body);
            if (!authResult.success || !authResult.user) {
              return sendJson(authResult.status || 401, { success: false, error: authResult.error || 'Unauthorized' });
            }
            const result = await handleDeleteArticle(body, authResult.user);
            if (!result.success) {
              return sendJson(result.status || 400, result);
            }
            return sendJson(200, result);
          }

          if (urlPath === '/api/contact/submit' && req.method === 'POST') {
            const body = await parseBody();
            const result = await handleContactSubmission(body, clientIp);
            if (!result.success) {
              return sendJson(400, result);
            }
            return sendJson(200, result);
          }

          return sendJson(404, { error: 'Unknown API endpoint' });
        } catch (err: any) {
          return sendJson(500, { error: err?.message || 'Internal Server Error' });
        }
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), aiApiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      chunkSizeWarningLimit: 2000,
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom'],
            'vendor-icons': ['lucide-react'],
            'vendor-firebase': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
          },
        },
      },
    },
  };
});
