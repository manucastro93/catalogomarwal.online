import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import './cronjobs/revertirEditando.js';
import './cronjobs/envarCatalogoClientesInactivos.js';
//import './cronjobs/syncProductosDux.js';
import sequelize from './config/database.js';
import errorHandler from './middlewares/errorHandler.js';
import rutas from './routes/index.js';
import { createServer } from 'http';
import { initSockets } from './sockets/index.js';
import webhookRoutes from './routes/webhook.routes.js';

dotenv.config();

const app = express();

app.set('trust proxy', true);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors({
  origin: (origin, callback) => {
    const allowlist = [
      'https://catalogomarwal.online',
      'https://www.catalogomarwal.online',
      'https://admin.catalogomarwal.online',
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
}));

app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  next();
});

app.use(express.static('public'));

app.use('/', webhookRoutes);

// 👇 Rutas centralizadas
app.use('/api', rutas);

// Manejo de errores
app.use(errorHandler);

// 🚀 INIT
const PORT = 3000;

async function init() {
  try {
    console.log('⏳ 1. Iniciando conexión a la base de datos...');
    await sequelize.authenticate();
    console.log('🟢 2. Conexión a la base de datos exitosa');

    console.log('⏳ 3. Creando servidor HTTP...');
    const httpServer = createServer(app);
    console.log('⏳ 4. Inicializando sockets...');
    initSockets(httpServer);

    console.log('⏳ 5. Escuchando puerto...');
    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 6. Servidor y WebSocket corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
  }
}


init();
