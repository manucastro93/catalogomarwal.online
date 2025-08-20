import { generarResumenEjecutivo,
         obtenerEvolucionEficienciaMensualGeneral,
         obtenerEficienciaPorCliente,
         obtenerDetallePorCliente,
         obtenerDetallePorPedido,
         obtenerEficienciaPorProducto,
         obtenerDetallePorProducto,
         obtenerEficienciaPorCategoria,
         obtenerEficienciaPorPedido,
         obtenerDetallePorCategoria,
         buscarClientesDesdeFacturas,
       } from '../services/eficiencia.service.js';
import { resolverIdVendedor } from '../helpers/resolverIdVendedor.js';

// ✅ Helper para manejar errores de forma consistente
const handleError = (res, error, message) => {
  console.error(`❌ Error en ${message}:`, error);
  res.status(500).json({ error: `Error al ${message.toLowerCase()}` });
};

// --- Resumen Ejecutivo ---
export const obtenerResumenEficienciaController = async (req, res) => {
  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Faltan parámetros 'desde' y 'hasta'" });
    }
    const resumen = await generarResumenEjecutivo(desde, hasta);
    res.json(resumen);
  } catch (err) {
    handleError(res, err, "calcular resumen ejecutivo");
  }
};

// --- Evolución Eficiencia Mensual (General) ---
export const obtenerEvolucionEficienciaMensualController = async (req, res) => {
  try {
    const desde = req.query.desde || "2015-01-01";
    const hasta = req.query.hasta || new Date().toISOString().split('T')[0];
    const cliente = req.query.cliente || null;
    const resultado = await obtenerEvolucionEficienciaMensualGeneral(desde, hasta, cliente);
    res.json(resultado);
  } catch (error) {
    handleError(res, error, "calcular evolución de eficiencia mensual general");
  }
};

// --- Eficiencia por Cliente ---
export const obtenerEficienciaPorClienteController = async (req, res) => {
  try {
    let { desde, hasta, cliente } = req.query;
    const vendedorId = await resolverIdVendedor(req);

    const hoy = new Date();
    const primerDiaMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    if (!desde) desde = primerDiaMes.toISOString().split("T")[0];
    if (!hasta) hasta = hoy.toISOString().split("T")[0];

    const resultado = await obtenerEficienciaPorCliente(desde, hasta, cliente, vendedorId);

    res.json(resultado);
  } catch (error) {
    handleError(res, error, "calcular eficiencia por cliente");
  }
};

// --- Detalle por Cliente ---
export const obtenerDetallePorClienteController = async (req, res) => {
  try {
    const { desde, hasta, cliente } = req.query;
    if (!desde || !hasta || !cliente) {
      return res.status(400).json({ error: "Faltan parámetros requeridos: 'desde', 'hasta' o 'cliente'." });
    }
    const resultado = await obtenerDetallePorCliente(desde, hasta, cliente);
    res.json(resultado);
  } catch (error) {
    handleError(res, error, "obtener detalle del cliente");
  }
};

// --- Detalle por Pedido (obtener un pedido específico) ---
export const obtenerDetallePorPedidoController = async (req, res) => {
  try {
    const { pedidoId } = req.query;
    if (!pedidoId) return res.status(400).json({ error: "Falta el parámetro 'pedidoId'" });
    const detalle = await obtenerDetallePorPedido(pedidoId);
    if (!detalle) return res.status(404).json({ error: "Pedido no encontrado" });
    res.json(detalle);
  } catch (error) {
    handleError(res, error, "obtener detalle del pedido");
  }
};

// --- Eficiencia por Producto ---
export const obtenerEficienciaPorProductoController = async (req, res) => {
  try {
    const { desde, hasta, producto } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }
    const resultado = await obtenerEficienciaPorProducto(desde, hasta, producto);
    res.json(resultado);
  } catch (err) {
    handleError(res, err, "calcular eficiencia por producto");
  }
};

// --- Detalle por Producto ---
export const obtenerDetallePorProductoController = async (req, res) => {
  try {
    const { desde, hasta, producto } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }
    if (!producto) {
      return res.status(400).json({ error: "Parámetro 'producto' es requerido" });
    }
    const resultado = await obtenerDetallePorProducto(desde, hasta, producto);
    res.json(resultado);
  } catch (err) {
    handleError(res, err, "generar detalle por producto");
  }
};

// --- Eficiencia por Categoría ---
export const obtenerEficienciaPorCategoriaController = async (req, res) => {
  try {
    const { desde, hasta, categoriaId } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }
    const resultado = await obtenerEficienciaPorCategoria(desde, hasta, categoriaId);
    res.json(resultado);
  } catch (err) {
    handleError(res, err, "calcular eficiencia por categoría");
  }
};

// --- Detalle por Categoría ---
export const obtenerDetallePorCategoriaController = async (req, res) => {
  try {
    const { desde, hasta, categoriaId } = req.query;
    if (!desde || !hasta || !categoriaId) {
      return res.status(400).json({ error: "Parámetros 'desde', 'hasta' y 'categoriaId' son requeridos" });
    }
    const resultado = await obtenerDetallePorCategoria(desde, hasta, categoriaId);
    res.json(resultado);
  } catch (err) {
    handleError(res, err, "generar detalle por categoría");
  }
};

// --- Eficiencia por Pedido ---
export const obtenerEficienciaPorPedidoController = async (req, res) => {

  try {
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }
    const resultado = await obtenerEficienciaPorPedido(desde, hasta);

    res.json(resultado);
  } catch (error) {
    handleError(res, error, "calcular eficiencia por pedido");
  }
};

export const buscarClientesFacturasController = async (req, res) => {
  try {
    const texto = req.query.buscar || "";
    const resultado = await buscarClientesDesdeFacturas(texto);
    res.json({ data: resultado });
  } catch (error) {
    handleError(res, error, "buscar clientes desde facturas");
  }
};