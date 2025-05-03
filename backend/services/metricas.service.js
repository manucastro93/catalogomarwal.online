import { Op, fn, col } from "sequelize";
import { startOfWeek, startOfMonth } from "date-fns";
import {
  Pedido,
  ReporteProduccion,
  EstadoPedido,
  Planta,
  Producto as ProductoModel,
} from "../models/index.js";

// 🔹 Ventas totales de la semana
export const consultarVentasSemana = async () => {
  const inicioSemana = startOfWeek(new Date(), { weekStartsOn: 1 });

  const pedidos = await Pedido.findAll({
    where: {
      createdAt: { [Op.gte]: inicioSemana },
      estadoPedidoId: { [Op.ne]: null },
    },
  });

  const total = pedidos.reduce((sum, p) => sum + (p.total || 0), 0);
  return `Ventas esta semana: $${total.toLocaleString("es-AR")}`;
};

// 🔹 Producción total hoy
export const consultarProduccionActual = async () => {
  const hoy = new Date();
  const inicio = new Date(hoy.setHours(0, 0, 0, 0));
  const fin = new Date(hoy.setHours(23, 59, 59, 999));

  const reportes = await ReporteProduccion.findAll({
    where: { fecha: { [Op.between]: [inicio, fin] } },
  });

  const total = reportes.reduce((sum, r) => sum + (r.cantidad || 0), 0);
  return `Producción de hoy: ${total} unidades`;
};

// 🔹 Producción desglosada por turno
export const consultarProduccionPorTurno = async () => {
  const hoy = new Date();
  const inicio = new Date(hoy.setHours(0, 0, 0, 0));
  const fin = new Date(hoy.setHours(23, 59, 59, 999));

  const resultados = await ReporteProduccion.findAll({
    where: { fecha: { [Op.between]: [inicio, fin] } },
    attributes: ["turno", [fn("SUM", col("cantidad")), "total"]],
    group: ["turno"],
    raw: true,
  });

  const resumen = resultados.map(r => `${r.turno}: ${r.total} unidades`).join(" · ");
  return `Producción por turno: ${resumen}`;
};

// 🔹 Producción por planta
export const consultarProduccionPorPlanta = async () => {
  const hoy = new Date();
  const inicio = new Date(hoy.setHours(0, 0, 0, 0));
  const fin = new Date(hoy.setHours(23, 59, 59, 999));

  const resultados = await ReporteProduccion.findAll({
    where: { fecha: { [Op.between]: [inicio, fin] } },
    attributes: ["plantaId", [fn("SUM", col("cantidad")), "total"]],
    group: ["plantaId"],
    include: [{ model: Planta, as: "planta", attributes: ["nombre"] }],
    raw: true,
  });

  const resumen = resultados.map(r => `${r["planta.nombre"]}: ${r.total} unidades`).join(" · ");
  return `Producción por planta: ${resumen}`;
};

// 🔹 Pedidos pendientes
export const consultarPedidosPendientes = async () => {
  const estadoPendiente = await EstadoPedido.findOne({
    where: { nombre: { [Op.like]: "%pendiente%" } },
  });

  if (!estadoPendiente) return "No hay estado 'pendiente' configurado";

  const cantidad = await Pedido.count({
    where: { estadoPedidoId: estadoPendiente.id },
  });

  return `Pedidos pendientes: ${cantidad}`;
};

// 🔹 Pedidos totales del mes
export const consultarPedidosMes = async () => {
  const inicioMes = startOfMonth(new Date());

  const total = await Pedido.count({
    where: {
      createdAt: { [Op.gte]: inicioMes },
      estadoPedidoId: { [Op.ne]: null },
    },
  });

  return `Pedidos generados este mes: ${total}`;
};

// 🔹 Productos activos totales
export const consultarProductosActivos = async () => {
  const total = await ProductoModel.count({ where: { activo: true } });
  return `Productos activos en catálogo: ${total}`;
};
