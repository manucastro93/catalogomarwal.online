import { generarResumenEjecutivo,
         obtenerEvolucionLeadTime,
         obtenerEvolucionFillRate,
         obtenerOutliersFillRate,
         obtenerEvolucionEficienciaMensualGeneral,
         obtenerEficienciaPorCliente,
         obtenerDetallePorCliente,
         obtenerDetallePorPedido,
         obtenerEficienciaPorProducto,
         obtenerDetallePorProducto,
         obtenerEficienciaPorCategoria,
         obtenerEficienciaPorPedido,
         obtenerDetallePorCategoria } from '../services/eficiencia.service.js';

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

// --- Evolución del Lead Time (por fecha de factura) ---
export const obtenerEvolucionEficienciaController = async (req, res) => {
  try {
    const desde = req.query.desde;
    const hasta = req.query.hasta;
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }
    const resultado = await obtenerEvolucionLeadTime(desde, hasta);
    res.json(resultado);
  } catch (error) {
    handleError(res, error, "calcular evolución de lead time");
  }
};

// --- Evolución del Fill Rate (por fecha de factura) ---
export const obtenerEvolucionFillRateController = async (req, res) => {
  try {
    const desde = req.query.desde;
    const hasta = req.query.hasta;
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }
    const resultado = await obtenerEvolucionFillRate(desde, hasta);
    res.json(resultado);
  } catch (error) {
    handleError(res, error, "calcular evolución de fill rate");
  }
};

// --- Outliers de Fill Rate (Productos con bajo fill rate) ---
export const obtenerOutliersFillRateController = async (req, res) => {
  try {
    const { desde, hasta, producto } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }
    const resultado = await obtenerOutliersFillRate(desde, hasta, producto);
    res.json(resultado);
  } catch (error) {
    handleError(res, error, "obtener productos con bajo fill rate");
  }
};

// --- Evolución Eficiencia Mensual (General) ---
export const obtenerEvolucionEficienciaMensualController = async (req, res) => {
  try {
    const desde = req.query.desde || "2015-01-01"; // Default si no se pasa
    const hasta = req.query.hasta || new Date().toISOString().split('T')[0]; // Default a hoy
    const resultado = await obtenerEvolucionEficienciaMensualGeneral(desde, hasta);
    res.json(resultado);
  } catch (error) {
    handleError(res, error, "calcular evolución de eficiencia mensual general");
  }
};

// --- Eficiencia por Cliente ---
export const obtenerEficienciaPorClienteController = async (req, res) => {
  try {
    const { desde, hasta, cliente } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Faltan fechas de 'desde' o 'hasta'." });
    }
    const resultado = await obtenerEficienciaPorCliente(desde, hasta, cliente);
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
    const { desde, hasta } = req.query;
    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }
    const resultado = await obtenerDetallePorProducto(desde, hasta);
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
    const resultado = await obtenerEficienciaPorPedido(desde, hasta); // Llama al service
    res.json(resultado);
  } catch (error) {
    handleError(res, error, "calcular eficiencia por pedido");
  }
};
