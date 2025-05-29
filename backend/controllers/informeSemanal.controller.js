import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
dayjs.locale('es');

import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { ReporteProduccion, Producto, Categoria, InformeSemanal } from '../models/index.js';
import { contarFeriadosEnRango } from '../helpers/feriados.js';
import { Op } from 'sequelize';

export async function obtenerInformeSemanalEnVivo(req, res, next) {
  try {
    const hoy = dayjs();
    const inicioSemana = hoy.startOf('week').add(1, 'day');
    const hoyFecha = hoy.endOf('day');
    const diasTranscurridos = hoy.diff(inicioSemana, 'day') + 1;
    const inicioSemanaPasada = inicioSemana.subtract(7, 'days');
    const finHastaHoySemanaPasada = inicioSemanaPasada.add(diasTranscurridos - 1, 'day').endOf('day');

    const produccionSemana = await ReporteProduccion.findAll({
      where: { fecha: { [Op.between]: [inicioSemana.toDate(), hoyFecha.toDate()] } },
      include: [
        {
          model: Producto,
          as: "producto",
          attributes: ["id", "nombre", "sku"],
          include: {
            model: Categoria,
            as: "Categoria",
            attributes: ["nombre"],
          },
        },
      ],
      raw: true,
      nest: true,
    });

    const produccionSemanaPasada = await ReporteProduccion.findAll({
      where: { fecha: { [Op.between]: [inicioSemanaPasada.toDate(), finHastaHoySemanaPasada.toDate()] } },
      include: [
        {
          model: Producto,
          as: "producto",
          attributes: ["id", "nombre", "sku"],
          include: {
            model: Categoria,
            as: "Categoria",
            attributes: ["nombre"],
          },
        },
      ],
      raw: true,
      nest: true,
    });

    const totalSemana = produccionSemana.reduce((acc, r) => acc + (r.cantidad || 0), 0);
    const totalSemanaPasada = produccionSemanaPasada.reduce((acc, r) => acc + (r.cantidad || 0), 0);
    const variacionGeneral = totalSemanaPasada > 0
      ? ((totalSemana - totalSemanaPasada) / totalSemanaPasada) * 100
      : 0;

    const produccionPorDia = produccionSemana.reduce((acc, r) => {
      const dia = format(new Date(r.fecha), "EEEE", { locale: es });
      acc[dia] = (acc[dia] || 0) + (r.cantidad || 0);
      return acc;
    }, {});
    const diaTop = Object.entries(produccionPorDia).sort((a, b) => b[1] - a[1])[0];

    const produccionPorProducto = produccionSemana.reduce((acc, r) => {
      const clave = r.producto?.nombre || "Sin nombre";
      acc[clave] = (acc[clave] || 0) + (r.cantidad || 0);
      return acc;
    }, {});
    const productoTop = Object.entries(produccionPorProducto).sort((a, b) => b[1] - a[1])[0];

    const diasConProduccion = [...new Set(produccionSemana.map(p =>
      format(new Date(p.fecha), "EEEE", { locale: es })
    ))];

    let emojiVariacion = "⚖️";
    if (variacionGeneral > 10) emojiVariacion = "📈";
    else if (variacionGeneral < -10) emojiVariacion = "📉";

    const feriados = await contarFeriadosEnRango(inicioSemana.toISOString(), hoyFecha.toISOString());
    const feriadoTexto = feriados.length > 0
      ? `⚠️ Esta semana tuvo ${feriados.length} día(s) no laborable(s): ${feriados.map(f => `${f.dia}/${f.mes} - ${f.motivo}`).join(", ")}.<br><strong>Aclaración:</strong> El análisis considera los días no laborables.`
      : "";

    const hoyFormateado = format(new Date(), "EEEE dd/MM", { locale: es });

    const html = `
      <div style="font-family: sans-serif; line-height: 1.6; font-size: 15px;">
        <h2 style="color: #3b82f6;">📊 Informe Semanal de Producción</h2>
        
        <p>Durante esta semana se registró una producción total de <strong>${totalSemana.toLocaleString()}</strong> unidades, 
        mientras que en el mismo período de la semana pasada se habían producido 
        <strong>${totalSemanaPasada.toLocaleString()}</strong> unidades. 
        Esto representa una <strong>variación ${emojiVariacion} del ${variacionGeneral.toFixed(2)}%</strong> en relación con la semana anterior.</p>
        
        <p>El día más productivo hasta el momento fue <strong>${diaTop?.[0] || "-"}</strong>, 
        con <strong>${diaTop?.[1]?.toLocaleString() || 0}</strong> unidades generadas en total. 
        Por otro lado, el producto con mayor volumen de producción ha sido 
        <strong>${productoTop?.[0] || "-"}</strong>, acumulando 
        <strong>${productoTop?.[1]?.toLocaleString() || 0}</strong> unidades.</p>

        <p>Se registró actividad en <strong>${diasConProduccion.length}</strong> día(s) distintos a lo largo de esta semana.</p>

        ${feriadoTexto ? `
          <div style="background: #fff8db; padding: 10px; margin-top: 10px; border-radius: 6px; border: 1px solid #facc15;">
            ${feriadoTexto}
          </div>` : ""}

        <p style="margin-top: 16px; color: #6b7280;">🕒 Informe actualizado al <strong>${hoyFormateado}</strong>.</p>
      </div>
    `;

    res.json({ html });

  } catch (error) {
    console.error(error);
    next(error);
  }
}

export async function generarInformeSemanalFinalizado(req, res, next) {
  try {
    const inicioSemana = dayjs().startOf('week').add(1, 'day').subtract(7, 'days');
    const finSemana = inicioSemana.add(6, 'days');

    const reportes = await ReporteProduccion.findAll({
      where: { fecha: { [Op.between]: [inicioSemana.toDate(), finSemana.toDate()] } },
      include: [
        {
          model: Producto,
          as: "producto",
          attributes: ["nombre", "sku"],
          include: {
            model: Categoria,
            as: "Categoria",
            attributes: ["nombre"],
          },
        },
      ],
      raw: true,
      nest: true,
    });

    const total = reportes.reduce((acc, r) => acc + (r.cantidad || 0), 0);

    const categoriasResumen = {};
    for (const r of reportes) {
      const cat = r.producto?.Categoria?.nombre || "Sin Categoría";
      if (!categoriasResumen[cat]) categoriasResumen[cat] = 0;
      categoriasResumen[cat] += r.cantidad || 0;
    }

    const productosResumen = {};
    for (const r of reportes) {
      const key = `${r.producto?.sku} - ${r.producto?.nombre}`;
      if (!productosResumen[key]) productosResumen[key] = 0;
      productosResumen[key] += r.cantidad || 0;
    }

    const topProductos = Object.entries(productosResumen)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const feriados = await contarFeriadosEnRango(inicioSemana.toISOString(), finSemana.toISOString());
    const feriadoTexto = feriados.length > 0
      ? `Hubo ${feriados.length} día(s) no laborable(s) (${feriados.map(f => `${f.dia}/${f.mes}`).join(", ")}).`
      : "No hubo feriados esta semana.";

    const fechaInicioTexto = format(inicioSemana.toDate(), "dd/MM/yyyy", { locale: es });
    const fechaFinTexto = format(finSemana.toDate(), "dd/MM/yyyy", { locale: es });

    let resumen = `✅ Informe Semanal (${fechaInicioTexto} al ${fechaFinTexto})\n\n`;
    resumen += `Se produjeron **${total.toLocaleString()} unidades** en total.\n\n`;
    resumen += `**Detalle por Categoría:**\n`;
    for (const [cat, cantidad] of Object.entries(categoriasResumen)) {
      resumen += `- ${cat}: ${cantidad.toLocaleString()} unidades.\n`;
    }
    resumen += `\n**Top 10 Productos más producidos:**\n`;
    for (const [prod, cantidad] of Object.entries(topProductos)) {
      resumen += `- ${prod[0]}: ${prod[1].toLocaleString()} unidades.\n`;
    }
    resumen += `\n${feriadoTexto}`;

    await InformeSemanal.create({
      fechaInicio: inicioSemana.toDate(),
      fechaFin: finSemana.toDate(),
      resumen,
    });

    res.json({ mensaje: "Informe semanal generado y guardado exitosamente." });

  } catch (error) {
    console.error(error);
    next(error);
  }
}
