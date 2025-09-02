import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import './cronjobs/revertirEditando.js';
import './cronjobs/envarCatalogoClientesInactivos.js';
import sequelize from './config/database.js';
import errorHandler from './middlewares/errorHandler.js';
import rutas from './routes/index.js';
import { createServer } from 'http';
import { initSockets } from './sockets/index.js';
import webhookRoutes from './routes/webhook.routes.js';

if (process.env.NODE_ENV !== 'production') {
  dotenv.config();
}

const app = express();

app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: (origin, callback) => {
      const allowlist = [
        'https://catalogomarwal.online',
        'https://www.catalogomarwal.online',
        'https://admin.catalogomarwal.online',
        'https://marwal.online',
        'http://localhost:3001',
        'http://localhost:3002',
      ];
      if (!origin || allowlist.includes(origin)) return callback(null, true);
      console.warn(`⚠️ Bloqueado por CORS: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// log simple
app.use((req, _res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  next();
});

app.use(express.static('public'));
app.use('/', webhookRoutes);
app.use('/api', rutas);
app.use(errorHandler);

// healthcheck
app.get('/health', (_req, res) => res.status(200).send('ok'));

const PORT = Number(process.env.PORT ?? 3000);

// --- bootstrap + graceful shutdown ---
let httpServer = null;
let shuttingDown = false;

function startServer() {
  return new Promise((resolve, reject) => {
    try {
      httpServer = createServer(app);
      initSockets(httpServer); // si tu initSockets devuelve instancia, guardala adentro

      httpServer.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Servidor y WebSocket en puerto ${PORT}`);
        resolve();
      });

      httpServer.on('request', (_req, res) => {
        if (shuttingDown) {
          res.setHeader('Connection', 'close');
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

async function init() {
  try {
    console.log('⏳ Conectando a la base...');
    await sequelize.authenticate();
    console.log('🟢 DB OK');
    await startServer();
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exitCode = 1;
  }
}

async function gracefulExit(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`🛑 Recibido ${signal}. Cerrando limpio...`);

  const closeHttp = new Promise((resolve) => {
    if (!httpServer) return resolve();
    httpServer.close(() => {
      console.log('🔒 HTTP cerrado');
      resolve();
    });
    // por si quedan sockets colgados, forzar luego de 10s
    setTimeout(() => {
      try {
        console.warn('⚠️ Forzando cierre HTTP');
      } catch {}
      resolve();
    }, 10000);
  });

  // ⚠️ si tenés instancia de sockets para cerrar, hacelo acá (io.close())

  const closeDb = sequelize
    .close()
    .then(() => console.log('🗄️ DB cerrada'))
    .catch((e) => console.error('❌ Error al cerrar DB:', e));

  await Promise.allSettled([closeHttp, closeDb]);

  console.log('✅ Cierre limpio. Saliendo...');
  process.exit(0);
}

process.on('SIGINT', () => gracefulExit('SIGINT'));
process.on('SIGTERM', () => gracefulExit('SIGTERM'));

process.on('unhandledRejection', (r) => {
  console.error('🚨 UnhandledRejection:', r);
});
process.on('uncaughtException', (e) => {
  console.error('🚨 UncaughtException:', e);
});

init();
