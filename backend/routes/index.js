// routes/index.js
import express from 'express';
import productoRoutes from './producto.routes.js';
import clienteRoutes from './cliente.routes.js';
import pedidoRoutes from './pedido.routes.js';
import publicRoutes from './public.routes.js';
import usuarioRoutes from './usuario.routes.js';
import paginaRoutes from './pagina.routes.js';
import categoriaRoutes from './categoria.routes.js';
import authRoutes from './auth.routes.js';
import estadisticasRoutes from './estadisticas.routes.js';
import logClienteRoutes from './logCliente.routes.js';
import notificacionRoutes from './notificacion.routes.js';
import reporteProduccionRoutes from "./reporteProduccion.routes.js";
import plantaRoutes from './planta.routes.js';

const router = express.Router();

router.use('/productos', productoRoutes);
router.use('/clientes', clienteRoutes);
router.use('/pedidos', pedidoRoutes);
router.use('/public', publicRoutes);
router.use('/usuarios', usuarioRoutes);
router.use('/pagina', paginaRoutes);
router.use('/categorias', categoriaRoutes);
router.use('/auth', authRoutes);
router.use('/estadisticas', estadisticasRoutes);
router.use('/logs-cliente', logClienteRoutes);
router.use('/notificaciones', notificacionRoutes);
router.use('/produccion-diaria', reporteProduccionRoutes);
router.use('/plantas', plantaRoutes);

export default router;
