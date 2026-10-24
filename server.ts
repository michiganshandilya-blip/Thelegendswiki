import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // AI Assistant Endpoints
  app.post('/api/ai/chat', async (req, res) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'local';
    const result = await handleAiChat(req.body, clientIp);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  app.post('/api/ai/writing-assist', async (req, res) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'local';
    const result = await handleAiWritingAssist(req.body, clientIp);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  app.post('/api/ai/search', async (req, res) => {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'local';
    const result = await handleAiSearch(req.body, clientIp);
    if (result.error) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  app.get('/api/ai/settings', (_req, res) => {
    res.json(getAiSettings());
  });

  app.post('/api/ai/settings', async (req, res) => {
    const authResult = await verifyCaller(req, req.body);
    if (!authResult.success || !authResult.user) {
      return res.status(authResult.status || 401).json({ success: false, error: authResult.error || 'Unauthorized' });
    }
    if (!authResult.user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Forbidden: Admin access required.' });
    }
    res.json(updateAiSettings(req.body));
  });

  // Cloudflare Turnstile Verification Endpoint
  app.post('/api/verify-turnstile', async (req, res) => {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'local';
    const result = await handleTurnstileVerification(req.body, clientIp);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Global System Governance Settings Endpoints
  app.get('/api/system-settings', async (_req, res) => {
    const settings = await handleGetSystemSettings();
    res.json({ success: true, settings });
  });

  app.post('/api/system-settings', async (req, res) => {
    const authResult = await verifyCaller(req, req.body);
    if (!authResult.success || !authResult.user) {
      return res.status(authResult.status || 401).json({ success: false, error: authResult.error || 'Unauthorized' });
    }
    const result = await handleUpdateSystemSettings(req.body, authResult.user, req.headers.authorization);
    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }
    res.json(result);
  });

  app.post('/api/articles/save', async (req, res) => {
    const authResult = await verifyCaller(req, req.body);
    if (!authResult.success || !authResult.user) {
      return res.status(authResult.status || 401).json({ success: false, error: authResult.error || 'Unauthorized' });
    }
    const result = await handleSaveArticle(req.body, authResult.user);
    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }
    res.json(result);
  });

  app.post('/api/articles/delete', async (req, res) => {
    const authResult = await verifyCaller(req, req.body);
    if (!authResult.success || !authResult.user) {
      return res.status(authResult.status || 401).json({ success: false, error: authResult.error || 'Unauthorized' });
    }
    const result = await handleDeleteArticle(req.body, authResult.user);
    if (!result.success) {
      return res.status(result.status || 400).json(result);
    }
    res.json(result);
  });

  // Contact & Errata Submission Notification Endpoint
  app.post('/api/contact/submit', async (req, res) => {
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
      req.socket.remoteAddress ||
      'local';
    const result = await handleContactSubmission(req.body, clientIp);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  });

  // Vite middleware for development / static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TheLegendsWiki server running on http://localhost:${PORT}`);
  });
}

startServer();
