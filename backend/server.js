import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import sequelize from './config/database.js';
import errorHandler from './middlewares/errorHandler.js';
import { createServer } from 'http';
import { initSockets } from './sockets/index.js';

dotenv.config();

const app = express();

// Rutas
import productoRoutes from './routes/producto.routes.js';
import clienteRoutes from './routes/cliente.routes.js';
import pedidoRoutes from './routes/pedido.routes.js';
import publicRoutes from './routes/public.routes.js';
import usuarioRoutes from './routes/usuario.routes.js';
import paginaRoutes from './routes/pagina.routes.js';
import categoriaRoutes from './routes/categoria.routes.js';
import authRoutes from './routes/auth.routes.js';
import estadisticasRoutes from './routes/estadisticas.routes.js';
import logClienteRoutes from './routes/logCliente.routes.js';

app.use(cors({
  origin: (origin, callback) => {
    const allowlist = [
      'https://catalogomarwal.online',
      'https://www.catalogomarwal.online',
      'https://admin.catalogomarwal.online'
    ];

    // Permití también localhost y sin origin (como en curl, healthchecks, etc.)
    if (!origin || allowlist.includes(origin)) {
      return callback(null, true);
    }

    console.warn(`⚠️ Bloqueado por CORS: ${origin}`);
    return callback(null, false); // NO tirar error, solo devolver false
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));


// Log de rutas para debug
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.path}`);
  next();
});

// Middlewares básicos
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Rutas
app.use('/api/productos', productoRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/pagina', paginaRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/estadisticas', estadisticasRoutes);
app.use('/api/logs-cliente', logClienteRoutes);

// Centralizado de errores
app.use(errorHandler);

// 🚀 INIT
const PORT = 3000;

async function init() {
  try {
    await sequelize.authenticate();
    console.log('🟢 Conexión a la base de datos exitosa');

    console.log('🗂️ Modelos sincronizados');

    const httpServer = createServer(app);
    initSockets(httpServer);

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor y WebSocket corriendo en puerto ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
  }
}

init();
