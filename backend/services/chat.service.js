import OpenAI from "openai";
import {
  consultarVentasSemana,
  consultarProduccionActual,
  consultarProduccionPorTurno,
  consultarProduccionPorPlanta,
  consultarPedidosPendientes,
  consultarPedidosMes,
  consultarProductosActivos,
} from "./metricas.service.js";
import { formatearFechaLarga } from "../utils/fecha.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export const responderDesdeOpenAI = async (pregunta) => {
  const [
    ventas,
    produccion,
    porTurno,
    porPlanta,
    pendientes,
    pedidosMes,
    stockBajo,
    productosActivos,
  ] = await Promise.all([
    consultarVentasSemana(),
    consultarProduccionActual(),
    consultarProduccionPorTurno(),
    consultarProduccionPorPlanta(),
    consultarPedidosPendientes(),
    consultarPedidosMes(),
    consultarProductosActivos(),
  ]);

  const hoyFormateado = formatearFechaLarga(new Date());

  const contexto = [
    `Hoy es ${hoyFormateado}`,
    ventas,
    produccion,
    porTurno,
    porPlanta,
    pendientes,
    pedidosMes,
    productosActivos,
  ].join(". ");

  const completion = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
      { role: "system", content: "Sos un asistente de gestión. Respondé preguntas claras y concisas en base a estos datos de producción, ventas, stock y pedidos." },
      { role: "user", content: pregunta },
      { role: "system", content: `Datos actuales: ${contexto}` }
    ]
  });

  const respuesta = completion.choices[0].message.content;

  const acciones = [
    { texto: "Ver pedidos pendientes", url: "/admin/pedidos?estado=pendiente" },
    { texto: "Ver resumen de ventas", url: "/admin/ventas" },
    { texto: "Ver producción diaria", url: "/admin/produccion" }
  ];

  return { respuesta, acciones };
};
