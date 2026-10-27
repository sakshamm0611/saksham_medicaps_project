import http from 'http';
import express, { Request, Response } from 'express';
import path from 'path';
import { Server as SocketIOServer } from 'socket.io';
import { apiRouter } from './server/api';
import { initSeatSocket } from './server/socket';

const app = express();
const server = http.createServer(app);

const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

initSeatSocket(io);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Mount API routes
app.use('/api', apiRouter);

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';

async function bootstrap() {
  if (!isProd) {
    // Development mode: mount Vite middlewares
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {}
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // Production mode: serve built client assets
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[IMovies] Full-Stack Server active on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

bootstrap().catch((err) => {
  console.error('[IMovies] Fatal startup error:', err);
  process.exit(1);
});
