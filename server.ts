import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  handleAiChat,
  handleAiWritingAssist,
  handleAiSearch,
  getAiSettings,
  updateAiSettings,
} from './src/server/aiRouter.js';
import { handleTurnstileVerification } from './src/server/turnstileRouter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

app.post('/api/ai/settings', (req, res) => {
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

// Serve static assets in production
app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`TheLegendsWiki server running on port ${PORT}`);
});
