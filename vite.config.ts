import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';
import { analyzeTransformationWithVision, executeAiSmartTransform } from './server/geminiService';
import {
  getServerDbHistory,
  addServerDbHistory,
  getServerDbTemplates,
  saveServerDbTemplate,
  getServerDbStats,
} from './server/localDb';

function setupApiMiddlewares(middlewares: any) {
  middlewares.use(async (req: any, res: any, next: any) => {
    // 1. Analyze Vision
    if (req.url === '/api/analyze-vision' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const data = JSON.parse(body || '{}');
          const result = await analyzeTransformationWithVision(data);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, message: err.message }));
        }
      });
      return;
    }

    // 2. AI Transform
    if (req.url === '/api/ai-transform' && req.method === 'POST') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', async () => {
        try {
          const { headers, rows, prompt } = JSON.parse(body || '{}');
          const result = await executeAiSmartTransform(headers || [], rows || [], prompt || '');
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify(result));
        } catch (err: any) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, message: err.message }));
        }
      });
      return;
    }

    // 3. Local DB Stats
    if (req.url === '/api/db/stats' && req.method === 'GET') {
      const stats = getServerDbStats();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(stats));
      return;
    }

    // 4. Local DB History (GET & POST)
    if (req.url === '/api/db/history') {
      if (req.method === 'GET') {
        const history = getServerDbHistory();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(history));
        return;
      }
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const item = JSON.parse(body || '{}');
            const saved = addServerDbHistory(item);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, item: saved }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
        });
        return;
      }
    }

    // 5. Local DB Templates (GET & POST)
    if (req.url === '/api/db/templates') {
      if (req.method === 'GET') {
        const templates = getServerDbTemplates();
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(templates));
        return;
      }
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', () => {
          try {
            const template = JSON.parse(body || '{}');
            const saved = saveServerDbTemplate(template);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, item: saved }));
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: false, message: err.message }));
          }
        });
        return;
      }
    }

    next();
  });
}

function apiPlugin(): Plugin {
  return {
    name: 'api-endpoints',
    configureServer(server) {
      setupApiMiddlewares(server.middlewares);
    },
    configurePreviewServer(server) {
      setupApiMiddlewares(server.middlewares);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

