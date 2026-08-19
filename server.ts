import express from 'express';
import path from 'path';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';
import { apiRouter } from './server/routes/api.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic security and parsing middlewares
  app.use(helmet({
    contentSecurityPolicy: false, // Avoid blocking Vite client bundles in dev/preview
    crossOriginEmbedderPolicy: false,
  }));
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  app.use(express.json());
  app.use(cookieParser());

  // Mount authorative PostgreSQL API endpoints
  app.use('/api', apiRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      engine: 'AL BARAKAH 2.0 (PostgreSQL + Drizzle + Express)',
      timestamp: new Date().toISOString(),
    });
  });

  // Vite middleware for development & static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AL BARAKAH 2.0 Server running on port ${PORT}`);
  });
}

startServer();
