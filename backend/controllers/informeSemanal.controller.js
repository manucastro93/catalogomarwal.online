import dayjs from 'dayjs';
import 'dayjs/locale/es.js';
dayjs.locale('es');

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ReporteProduccion, Producto, Categoria } from '../models/index.js';
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
          as: 'producto',
          attributes: ['id', 'nombre', 'sku', 'precioUnitario', 'costoDux'],
          include: {
            model: Categoria,
            as: 'Categoria',
            attributes: ['nombre'],
          },
        },
      ],
      raw: true,
      nest: true,
    });

    const produccionSemanaPasada = await ReporteProduccion.findAll({
      where: { fecha: { [Op.between]: [inicioSemanaPasada.toDate(), finHastaHoySemanaPasada.toDate()] } },
      raw: true,
    });

    const totalSemana = produccionSemana.reduce((acc, r) => acc + (r.cantidad || 0), 0);
    const totalSemanaPasada = produccionSemanaPasada.reduce((acc, r) => acc + (r.cantidad || 0), 0);
    const variacionGeneral = totalSemanaPasada > 0 ? ((totalSemana - totalSemanaPasada) / totalSemanaPasada) * 100 : 0;

    const produccionPorDia = {};
    for (const r of produccionSemana) {
      const dia = format(new Date(r.fecha), 'EEEE', { locale: es });
      produccionPorDia[dia] = (produccionPorDia[dia] || 0) + (r.cantidad || 0);
    }
    const diaTop = Object.entries(produccionPorDia).sort((a, b) => b[1] - a[1])[0];

    const produccionPorProducto = {};
    const resumenPorCategoria = {};
    for (const r of produccionSemana) {
      const prod = r.producto?.nombre || 'Sin nombre';
      const cat = r.producto?.Categoria?.nombre || 'Sin categoría';
      const cant = r.cantidad || 0;
      const venta = cant * (r.producto?.precioUnitario || 0);
      const costo = cant * (r.producto?.costoDux || 0);

      if (!produccionPorProducto[prod]) produccionPorProducto[prod] = { unidades: 0, venta: 0, costo: 0 };
      produccionPorProducto[prod].unidades += cant;
      produccionPorProducto[prod].venta += venta;
      produccionPorProducto[prod].costo += costo;

      if (!resumenPorCategoria[cat]) resumenPorCategoria[cat] = { unidades: 0, venta: 0, costo: 0 };
      resumenPorCategoria[cat].unidades += cant;
      resumenPorCategoria[cat].venta += venta;
      resumenPorCategoria[cat].costo += costo;
    }

    const topProductos = Object.entries(produccionPorProducto)
      .sort((a, b) => b[1].unidades - a[1].unidades)
      .slice(0, 10);

    const diasConProduccion = [...new Set(produccionSemana.map(p => format(new Date(p.fecha), 'EEEE', { locale: es })))];
    const feriados = await contarFeriadosEnRango(inicioSemana.toISOString(), hoyFecha.toISOString());
    const feriadoTexto = feriados.length > 0
      ? `📅 Durante el período analizado se identificaron ${feriados.length} día(s) no laborables: ${feriados.map(f => `${f.dia}/${f.mes} (${f.motivo})`).join(', ')}.`
      : null;

    const inicioMes = hoy.startOf('month');
    const diasDelMes = hoy.daysInMonth();
    const diasTranscurridosMes = hoy.diff(inicioMes, 'day') + 1;

    const produccionMesActual = await ReporteProduccion.sum('cantidad', {
      where: { fecha: { [Op.between]: [inicioMes.toDate(), hoy.toDate()] } },
    }) || 0;

    const promedioDiario = produccionMesActual / diasTranscurridosMes;
    const proyeccionFinMes = Math.round(promedioDiario * diasDelMes);

    const inicioMesAnterior = hoy.subtract(1, 'month').startOf('month');
    const finMesAnterior = inicioMesAnterior.endOf('month');
    const produccionMesAnterior = await ReporteProduccion.sum('cantidad', {
      where: { fecha: { [Op.between]: [inicioMesAnterior.toDate(), finMesAnterior.toDate()] } },
    }) || 0;

    const variacionMes = produccionMesAnterior > 0 ? ((produccionMesActual - produccionMesAnterior) / produccionMesAnterior) * 100 : 0;

    const ultimosTresMeses = await Promise.all([...Array(3)].map(async (_, i) => {
      const inicio = hoy.subtract(i + 1, 'month').startOf('month');
      const fin = inicio.endOf('month');
      const total = await ReporteProduccion.sum('cantidad', {
        where: { fecha: { [Op.between]: [inicio.toDate(), fin.toDate()] } },
      }) || 0;
      return { nombre: format(inicio.toDate(), 'MMMM', { locale: es }), total };
    }));

    const promedioTrimestre = ultimosTresMeses.reduce((acc, m) => acc + m.total, 0) / 3;
    const tendenciaGeneral = promedioTrimestre > 0 ? ((produccionMesActual - promedioTrimestre) / promedioTrimestre) * 100 : 0;

    const mesActualNombre = format(hoy.toDate(), 'MMMM', { locale: es });
    const fechaHoyFormateada = format(new Date(), 'dd/MM/yyyy');

    // ✅ REDACCIÓN FINAL FORMAL Y CLARA
    const resumen = `
Durante los últimos 7 días, la producción total fue de ${totalSemana.toLocaleString()} unidades. 
Este resultado representa una ${variacionGeneral >= 0 ? 'suba' : 'baja'} del ${Math.abs(variacionGeneral).toFixed(2)}% 
respecto a la semana previa (${totalSemanaPasada.toLocaleString()} unidades).

El día con mayor actividad fue el ${diaTop?.[0] || '-'}, con ${diaTop?.[1]?.toLocaleString() || 0} unidades fabricadas.

📦 Categorías más destacadas:
${Object.entries(resumenPorCategoria).map(([cat, val]) =>
  `• ${cat}: ${val.unidades.toLocaleString()} unidades, $${val.venta.toLocaleString()} venta, $${val.costo.toLocaleString()} costo.`).join('\n')}

🏷️ Top 10 productos fabricados:
${topProductos.map(([nombre, val], i) =>
  `${i + 1}. ${nombre}: ${val.unidades.toLocaleString()} unidades, $${val.venta.toLocaleString()} venta, $${val.costo.toLocaleString()} costo.`).join('\n')}

📈 Producción mensual acumulada (${mesActualNombre}): ${produccionMesActual.toLocaleString()} unidades 
(${variacionMes >= 0 ? '+' : '-'}${Math.abs(variacionMes).toFixed(2)}% vs mes anterior). 
Proyección de cierre: ${proyeccionFinMes.toLocaleString()} unidades.

📊 Tendencia trimestral: ${tendenciaGeneral >= 0 ? 'positiva' : 'negativa'} del ${Math.abs(tendenciaGeneral).toFixed(2)}%.

🕒 Informe actualizado al ${fechaHoyFormateada}.
${feriadoTexto ? '\n\n' + feriadoTexto : ''}
`.trim();

    res.json({
      resumen,
      variacion: variacionGeneral,
      feriados: feriados.length > 0
    });

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
