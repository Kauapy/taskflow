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
import { errorHandler } from './middleware/error';

const app = express();

app.use(
  cors({
    origin: config.frontendOrigin,
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

// Recursos principais (todos exigem auth — middleware no próprio router)
app.use('/tasks', tasksRouter);
app.use('/progress', progressRouter);
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
