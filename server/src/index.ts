/**
 * Entry point do backend Taskflow.
 *
 * Sobe um Express com:
 * - CORS configurado pra origem do frontend
 * - JSON body parser
 * - Rota /health
 * - Error handler central
 *
 * Próximas fases adicionarão /auth, /tasks, /progress, /shares, /uploads.
 */
import express from 'express';
import cors from 'cors';
import { config } from './config';
import { healthRouter } from './routes/health';
import { authRouter } from './routes/auth';
import { tasksRouter } from './routes/tasks';
import { progressRouter } from './routes/progress';
import { sharesRouter } from './routes/shares';
import { publicRouter } from './routes/public';
import { uploadsRouter } from './routes/uploads';
import { errorHandler } from './middleware/error';

const app = express();

// CORS: em produção, restringe à origem configurada (FRONTEND_ORIGIN).
// Em dev, aceita qualquer localhost/127.0.0.1 — o Vite pode subir em 5173,
// 5174… conforme a porta livre, e não queremos quebrar por causa disso.
app.use(
  cors({
    origin: (origin, callback) => {
      // Requests sem Origin (curl, mesmo host) são permitidos.
      if (!origin) return callback(null, true);
      const isLocalhost = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (origin === config.frontendOrigin || (config.isDev && isLocalhost)) {
        return callback(null, true);
      }
      return callback(new Error(`Origem não permitida pelo CORS: ${origin}`));
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '1mb' }));

// Healthcheck
app.use('/health', healthRouter);

// Autenticação
app.use('/auth', authRouter);

// Rotas públicas (sem auth) — links compartilhados.
// IMPORTANTE: registrar ANTES do sharesRouter. Como o sharesRouter é montado
// em '/' e aplica requireAuth a tudo que passa por ele, se viesse antes ele
// interceptaria /public/* e exigiria token (401). A ordem garante que /public
// case primeiro e responda sem auth.
app.use('/public', publicRouter);

// Arquivos enviados (driver=disk): servidos estaticamente, leitura pública
// (alinhado ao modelo de compartilhamento por link). Em produção com
// driver=s3, os arquivos são servidos pelo próprio bucket/CDN e esta linha
// fica inócua (a pasta local não é usada).
if (config.storage.driver === 'disk') {
  app.use(
    '/static/uploads',
    express.static(config.storage.diskDir, {
      // fallthrough:false → arquivo inexistente responde 404 aqui mesmo,
      // sem cair nas rotas de API (que dariam 401 pelo catch-all).
      fallthrough: false,
      // Força download seguro: nada de execução inline de HTML/JS.
      setHeaders: (res) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Disposition', 'inline');
      },
    })
  );
}

// Recursos principais (todos exigem auth — middleware no próprio router)
app.use('/tasks', tasksRouter);
app.use('/progress', progressRouter);
app.use('/uploads', uploadsRouter);
// sharesRouter define os prefixos /shares e /share-links internamente
app.use('/', sharesRouter);

// 404 padrão (qualquer rota não matched)
app.use((_req, res) => {
  res.status(404).json({
    error: { code: 'not_found', message: 'Rota não encontrada.' },
  });
});

// Error handler central (precisa ficar por último)
app.use(errorHandler);

const server = app.listen(config.port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `🚀 Taskflow API rodando em http://localhost:${config.port} ` +
      `(env=${config.env}, frontend=${config.frontendOrigin})`
  );
});

// Graceful shutdown — fecha conexões abertas antes de matar o processo
for (const signal of ['SIGTERM', 'SIGINT'] as const) {
  process.on(signal, () => {
    // eslint-disable-next-line no-console
    console.log(`\n${signal} recebido, fechando…`);
    server.close(() => process.exit(0));
  });
}
