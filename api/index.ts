import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { apiRouter } from '../server/routes/api.ts';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Mount the API router on both /api and / to handle all Vercel Serverless rewrite patterns
app.use('/api', apiRouter);
app.use('/', apiRouter);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    serverless: true,
    engine: 'AL BARAKAH 2.0 (Vercel Serverless + Express)',
    timestamp: new Date().toISOString(),
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    serverless: true,
    engine: 'AL BARAKAH 2.0 (Vercel Serverless + Express)',
    timestamp: new Date().toISOString(),
  });
});

export default app;
