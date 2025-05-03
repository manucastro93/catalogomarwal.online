import { InformeSemanal } from "../models/index.js";
import { ReporteProduccion, Producto, Categoria } from "../models/index.js";
import { contarFeriadosEnRango } from "../helpers/feriados.js";
import { Op } from "sequelize";
import dayjs from "dayjs";

export async function obtenerInformeSemanalEnVivo(req, res, next) {
    try {
      const hoy = dayjs();
      const inicioSemana = hoy.startOf('week').add(1, 'day'); // lunes
      const hoyFecha = hoy.endOf('day'); // hoy
  
      const inicioSemanaPasada = inicioSemana.subtract(7, 'days');
      const finSemanaPasada = inicioSemana.subtract(1, 'day').endOf('day');
  
      // Traer producción de esta semana hasta hoy
      const produccionSemana = await ReporteProduccion.findAll({
        where: {
          fecha: { [Op.between]: [inicioSemana.toDate(), hoyFecha.toDate()] },
        },
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
  
      // Traer producción de la semana pasada (misma cantidad de días)
      const diasTranscurridos = hoy.diff(inicioSemana, 'day') + 1;
      const produccionSemanaPasada = await ReporteProduccion.findAll({
        where: {
          fecha: { [Op.between]: [inicioSemanaPasada.toDate(), inicioSemanaPasada.add(diasTranscurridos - 1, 'day').endOf('day').toDate()] },
        },
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
  
      // Totales generales
      const totalSemana = produccionSemana.reduce((acc, r) => acc + (r.cantidad || 0), 0);
      const totalSemanaPasada = produccionSemanaPasada.reduce((acc, r) => acc + (r.cantidad || 0), 0);
  
      const variacionGeneral = totalSemanaPasada > 0
        ? ((totalSemana - totalSemanaPasada) / totalSemanaPasada) * 100
        : 0;
  
      // Feriados de la semana
      const feriados = await contarFeriadosEnRango(inicioSemana.toISOString(), hoyFecha.toISOString());
      const feriadoTexto = feriados.length > 0
        ? `⚠️ Esta semana tuvo ${feriados.length} día(s) no laborable(s): ${feriados.map(f => `${f.dia}/${f.mes} - ${f.motivo}`).join(", ")}.\n**Aclaración:** El análisis considera los días no laborables.`
        : "";
  
      // Armado del Informe dinámico
      let texto = `📅 Informe en Vivo\n\n`;
      texto += `En lo que va de esta semana se produjeron **${totalSemana.toLocaleString()} unidades**.\n`;
      texto += `Comparado con el mismo período de la semana pasada (**${totalSemanaPasada.toLocaleString()} unidades**), representa una variación del **${variacionGeneral.toFixed(2)}%**.\n\n`;
  
      if (feriadoTexto) {
        texto += `${feriadoTexto}\n`;
      }
  
      res.json({ informe: texto });
  
    } catch (error) {
      console.error(error);
      next(error);
    }
  }

export async function generarInformeSemanalFinalizado(req, res, next) {
  try {
    const inicioSemana = dayjs().startOf('week').add(1, 'day').subtract(7, 'days'); // lunes anterior
    const finSemana = inicioSemana.add(6, 'days'); // domingo

    // Buscamos datos de la semana completa
    const reportes = await ReporteProduccion.findAll({
      where: {
        fecha: { [Op.between]: [inicioSemana.toDate(), finSemana.toDate()] },
      },
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

    // Resumen por categoría
    const categoriasResumen = {};
    for (const r of reportes) {
      const cat = r.producto?.Categoria?.nombre || "Sin Categoría";
      if (!categoriasResumen[cat]) categoriasResumen[cat] = 0;
      categoriasResumen[cat] += r.cantidad || 0;
    }

    // Top 10 productos más variación
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

    // Texto Final
    let resumen = `✅ Informe Semanal (${inicioSemana.format("DD/MM/YYYY")} al ${finSemana.format("DD/MM/YYYY")})\n\n`;
    resumen += `Se produjeron **${total.toLocaleString()} unidades** en total.\n\n`;
    resumen += `**Detalle por Categoría:**\n`;
    for (const [cat, cantidad] of Object.entries(categoriasResumen)) {
      resumen += `- ${cat}: ${cantidad.toLocaleString()} unidades.\n`;
    }
    resumen += `\n**Top 10 Productos más producidos:**\n`;
    for (const [prod, cantidad] of topProductos) {
      resumen += `- ${prod}: ${cantidad.toLocaleString()} unidades.\n`;
    }
    resumen += `\n${feriadoTexto}`;

    // Guardar en la BD
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
