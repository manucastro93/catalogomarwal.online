import { Op, fn, col, where } from 'sequelize';
import dayjs from 'dayjs';
import { Factura, PedidoDux, DetalleFactura, DetallePedidoDux, Producto, Categoria } from "../models/index.js";

export const obtenerResumenEficiencia = async (req, res) => {
  try {
    const desde = req.query.desde ? new Date(req.query.desde) : null;
    const hasta = req.query.hasta ? new Date(req.query.hasta) : null;

    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }

    // 1. Buscar pedidos y facturas dentro del rango
    const pedidos = await PedidoDux.findAll({
      where: {
        fecha: { [Op.between]: [desde, hasta] },
      }
    });

    const nroPedidos = pedidos.map(p => p.nro_pedido);
    const pedidosMap = new Map(pedidos.map(p => [p.nro_pedido, p]));

    const facturas = await Factura.findAll({
      where: {
        fecha_comp: { [Op.between]: [desde, hasta] },
        anulada_boolean: false,
        nro_pedido: { [Op.in]: nroPedidos }
      }
    });

    // 2. Calcular Lead Time promedio
    let totalLeadTime = 0;
    let conteoLeadTime = 0;

    for (const factura of facturas) {
      const pedido = pedidosMap.get(factura.nro_pedido);
      if (pedido) {
        const dias = Math.round((new Date(factura.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24));
        if (dias >= 0) {
          totalLeadTime += dias;
          conteoLeadTime++;
        }
      }
    }

    const leadTimePromedioDias = conteoLeadTime > 0 ? +(totalLeadTime / conteoLeadTime).toFixed(2) : null;

    // 3. Calcular Fill Rate
    const detallesPedidos = await DetallePedidoDux.findAll({
      include: {
        model: PedidoDux,
        as: "pedidoDux",
        where: {
          fecha: { [Op.between]: [desde, hasta] },
        },
        attributes: [] // solo se usa para filtro
      }
    });

    const detallesFacturas = await DetalleFactura.findAll({
      include: {
        model: Factura,
        as: "factura",
        where: {
          fecha_comp: { [Op.between]: [desde, hasta] },
          anulada_boolean: false
        },
        attributes: []
      }
    });

    let totalPedidas = 0;
    let totalFacturadas = 0;

    const pedidosPorItem = {};
    const facturasPorItem = {};

    for (const d of detallesPedidos) {
      const key = d.codItem;
      pedidosPorItem[key] = (pedidosPorItem[key] || 0) + parseFloat(d.cantidad || 0);
    }

    for (const d of detallesFacturas) {
      const key = d.codItem;
      facturasPorItem[key] = (facturasPorItem[key] || 0) + parseFloat(d.cantidad || 0);
    }

    for (const key in pedidosPorItem) {
      const pedida = pedidosPorItem[key];
      const facturada = facturasPorItem[key] || 0;

      totalPedidas += pedida;
      totalFacturadas += Math.min(facturada, pedida); // evitar sobrefacturación
    }

    const fillRateGeneral = totalPedidas > 0
      ? +((totalFacturadas / totalPedidas) * 100).toFixed(2)
      : null;

    return res.json({
      leadTimePromedioDias,
      fillRateGeneral,
      totalPedidos: pedidos.length,
      totalFacturas: facturas.length
    });
  } catch (error) {
    console.error("Error en obtenerResumenEficiencia:", error);
    res.status(500).json({ error: "Error al calcular métricas de eficiencia" });
  }
};

export const obtenerEvolucionEficiencia = async (req, res) => {
  try {
    const desde = req.query.desde ? new Date(req.query.desde) : null;
    const hasta = req.query.hasta ? new Date(req.query.hasta) : null;

    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }

    const pedidos = await PedidoDux.findAll({
      where: {
        fecha: { [Op.between]: [desde, hasta] },
      }
    });

    const facturas = await Factura.findAll({
      where: {
        fecha_comp: { [Op.between]: [desde, hasta] },
        anulada_boolean: false
      }
    });

    const pedidosMap = new Map(pedidos.map(p => [p.nro_pedido, p]));

    const porFecha = {};

    for (const factura of facturas) {
      const fechaStr = dayjs(factura.fecha_comp).format("YYYY-MM-DD");
      const pedido = pedidosMap.get(factura.nro_pedido);

      if (!pedido) continue;

      const dias = Math.round((new Date(factura.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24));

      if (!porFecha[fechaStr]) {
        porFecha[fechaStr] = { totalLeadTime: 0, count: 0 };
      }

      porFecha[fechaStr].totalLeadTime += dias;
      porFecha[fechaStr].count += 1;
    }

    const resultado = Object.entries(porFecha).map(([fecha, valores]) => ({
      fecha,
      leadTime: +(valores.totalLeadTime / valores.count).toFixed(2)
    }));

    res.json(resultado);
  } catch (error) {
    console.error("Error en obtenerEvolucionEficiencia:", error);
    res.status(500).json({ error: "Error al calcular evolución" });
  }
};

export const obtenerEvolucionFillRate = async (req, res) => {
  try {
    const desde = req.query.desde ? new Date(req.query.desde) : null;
    const hasta = req.query.hasta ? new Date(req.query.hasta) : null;

    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }

    const detallesPedidos = await DetallePedidoDux.findAll({
      include: {
        model: PedidoDux,
        as: "pedidoDux",
        where: {
          fecha: { [Op.between]: [desde, hasta] },
        },
        attributes: ["fecha"],
      },
    });

    const detallesFacturas = await DetalleFactura.findAll({
      include: {
        model: Factura,
        as: "factura",
        where: {
          fecha_comp: { [Op.between]: [desde, hasta] },
          anulada_boolean: false,
        },
        attributes: ["fecha_comp"],
      },
    });

    const pedidosPorFecha = {};
    const facturasPorFecha = {};

    for (const d of detallesPedidos) {
      const fechaStr = dayjs(d.pedidoDux.fecha).format("YYYY-MM-DD");
      if (!pedidosPorFecha[fechaStr]) pedidosPorFecha[fechaStr] = 0;
      pedidosPorFecha[fechaStr] += parseFloat(d.cantidad || 0);
    }

    for (const d of detallesFacturas) {
      const fechaStr = dayjs(d.factura.fecha_comp).format("YYYY-MM-DD");
      if (!facturasPorFecha[fechaStr]) facturasPorFecha[fechaStr] = 0;
      facturasPorFecha[fechaStr] += parseFloat(d.cantidad || 0);
    }

    const fechas = Array.from(new Set([...Object.keys(pedidosPorFecha), ...Object.keys(facturasPorFecha)])).sort();

    const resultado = fechas.map((fecha) => {
      const pedida = pedidosPorFecha[fecha] || 0;
      const facturada = facturasPorFecha[fecha] || 0;
      const porcentaje = pedida > 0 ? +(Math.min(facturada / pedida, 1) * 100).toFixed(2) : 0;
      return { fecha, fillRate: porcentaje };
    });

    res.json(resultado);
  } catch (error) {
    console.error("Error en obtenerEvolucionFillRate:", error);
    res.status(500).json({ error: "Error al calcular evolución de fill rate" });
  }
};

export const obtenerOutliersFillRate = async (req, res) => {
  try {
    const desde = req.query.desde ? new Date(req.query.desde) : null;
    const hasta = req.query.hasta ? new Date(req.query.hasta) : null;

    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }

    const detallesPedidos = await DetallePedidoDux.findAll({
      include: {
        model: PedidoDux,
        as: "pedidoDux",
        where: {
          fecha: { [Op.between]: [desde, hasta] },
        },
        attributes: []
      }
    });

    const detallesFacturas = await DetalleFactura.findAll({
      include: {
        model: Factura,
        as: "factura",
        where: {
          fecha_comp: { [Op.between]: [desde, hasta] },
          anulada_boolean: false
        },
        attributes: []
      }
    });

    const pedidosPorItem = {};
    const nombresPorItem = {};
    const facturasPorItem = {};

    for (const d of detallesPedidos) {
      const key = d.codItem;
      pedidosPorItem[key] = (pedidosPorItem[key] || 0) + parseFloat(d.cantidad || 0);
      nombresPorItem[key] = d.descripcion || key;
    }

    for (const d of detallesFacturas) {
      const key = d.codItem;
      facturasPorItem[key] = (facturasPorItem[key] || 0) + parseFloat(d.cantidad || 0);
    }

    const outliers = [];

    for (const key in pedidosPorItem) {
      const pedidas = pedidosPorItem[key];
      const facturadas = facturasPorItem[key] || 0;
      const porcentaje = pedidas > 0 ? (facturadas / pedidas) * 100 : 0;
      outliers.push({
        codItem: key,
        descripcion: nombresPorItem[key],
        pedidas: Math.round(pedidas),
        facturadas: Math.round(facturadas),
        fillRate: +porcentaje.toFixed(2)
      });
    }

    outliers.sort((a, b) => a.fillRate - b.fillRate); // peor primero
    res.json(outliers.slice(0, 20)); // top 20 peores
  } catch (error) {
    console.error("Error en obtenerOutliersFillRate:", error);
    res.status(500).json({ error: "Error al obtener productos con bajo fill rate" });
  }
};

export const obtenerEficienciaPorPedido = async (req, res) => {
  try {
    const desde = req.query.desde ? new Date(req.query.desde) : null;
    const hasta = req.query.hasta ? new Date(req.query.hasta) : null;

    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }

    const pedidos = await PedidoDux.findAll({
      where: {
        fecha: { [Op.between]: [desde, hasta] }
      },
      attributes: ['id', 'nro_pedido', 'fecha']
    });

    const nroPedidos = pedidos.map(p => p.nro_pedido);

    const facturas = await Factura.findAll({
      where: {
        nro_pedido: { [Op.in]: nroPedidos },
        anulada_boolean: false
      },
      attributes: ['nro_pedido', 'fecha_comp']
    });

    const detallesPedidos = await DetallePedidoDux.findAll({
  where: {
    pedidoDuxId: { [Op.in]: pedidos.map(p => p.id) }
  }
});


    const detallesFacturas = await DetalleFactura.findAll({
      include: [{
        model: Factura,
        as: 'factura',
        where: {
          nro_pedido: { [Op.in]: nroPedidos },
          anulada_boolean: false
        },
        attributes: ['nro_pedido']
      }]
    });

    const facturasMap = new Map(facturas.map(f => [f.nro_pedido, f]));

    const resultado = pedidos.map(pedido => {
      const facturasDelPedido = facturas.filter(f => f.nro_pedido === pedido.nro_pedido);

      const detallesP = detallesPedidos.filter(d => d.pedidoDuxId === pedido.id);
      const cantidadPedida = detallesP.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);

      const detallesF = detallesFacturas.filter(d => d.factura?.nro_pedido === pedido.nro_pedido);
      const cantidadFacturada = detallesF.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);

      const fillRate = cantidadPedida > 0 ? Math.min((cantidadFacturada / cantidadPedida) * 100, 100) : null;

     const leadTime = facturasDelPedido.length
  ? Math.max(0, Math.round((new Date(facturasDelPedido[0].fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)))
  : null;

      return {
        pedidoId: pedido.id,
        nroPedido: pedido.nro_pedido,
        fecha: pedido.fecha,
        leadTimeDias: leadTime,
        fillRate: fillRate !== null ? +fillRate.toFixed(2) : null,
        cantidadPedida,
        cantidadFacturada
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error('Error en obtenerEficienciaPorPedido:', error);
    res.status(500).json({ error: 'Error al calcular eficiencia por pedido' });
  }
};

export const obtenerDetallePorPedido = async (req, res) => {
  try {
    const { pedidoId } = req.query;
    if (!pedidoId) return res.status(400).json({ error: "Falta el parámetro 'pedidoId'" });

    const pedido = await PedidoDux.findByPk(pedidoId);
    if (!pedido) return res.status(404).json({ error: "Pedido no encontrado" });

    const detallesPedido = await DetallePedidoDux.findAll({
      where: { pedidoDuxId: pedidoId },
      attributes: ['codItem', 'descripcion', 'cantidad']
    });

    const facturas = await Factura.findAll({
      where: {
        nro_pedido: pedido.nro_pedido,
        anulada_boolean: false,
      },
      attributes: ['fecha_comp'],
      include: [{
        model: DetalleFactura,
        as: "detalles",
        attributes: ['codItem', 'cantidad']
      }],
    });

    const mapFacturadas = {};
    for (const factura of facturas) {
      for (const det of factura.detalles || []) {
        const cod = det.codItem;
        const cant = parseFloat(det.cantidad || 0);
        if (!mapFacturadas[cod]) mapFacturadas[cod] = 0;
        mapFacturadas[cod] += cant;
      }
    }

    let leadTimePedido = null;
    let fechasFacturas = [];

    if (facturas.length) {
      const fechas = facturas.map(f => new Date(f.fecha_comp)).sort((a, b) => a - b);
      const fechaFacturaMasTemprana = fechas[0];

      leadTimePedido = Math.max(
        0,
        Math.round((fechaFacturaMasTemprana - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24))
      );

      fechasFacturas = fechas.map(f => f.toISOString().split("T")[0]);
    }

    const resultado = detallesPedido.map(p => {
      const cantidadPedida = parseFloat(p.cantidad || 0);
      const cantidadFacturada = mapFacturadas[p.codItem] || 0;
      const fillRate = cantidadPedida > 0
        ? Math.min((cantidadFacturada / cantidadPedida) * 100, 100)
        : 0;

      return {
        codItem: p.codItem,
        descripcion: p.descripcion || "Sin descripción",
        pedida: cantidadPedida,
        facturada: cantidadFacturada,
        fillRate: +fillRate.toFixed(2),
        leadTimeDias: leadTimePedido
      };
    });

    res.json({
      leadTimePedido,
      fechasFacturas,
      productos: resultado
    });
  } catch (error) {
    console.error("Error en obtenerDetallePorPedido:", error);
    res.status(500).json({ error: "Error al obtener detalle del pedido" });
  }
};

export const obtenerEficienciaPorProducto = async (req, res) => {
  try {
    const desde = req.query.desde ? new Date(req.query.desde) : null;
    const hasta = req.query.hasta ? new Date(req.query.hasta) : null;
    const filtro = req.query.producto?.toLowerCase() || "";

    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }

    const detallesPedidos = await DetallePedidoDux.findAll({
      include: {
        model: PedidoDux,
        as: "pedidoDux",
        where: {
          fecha: { [Op.between]: [desde, hasta] },
        },
        attributes: []
      }
    });

    const detallesFacturas = await DetalleFactura.findAll({
      include: {
        model: Factura,
        as: "factura",
        where: {
          fecha_comp: { [Op.between]: [desde, hasta] },
          anulada_boolean: false
        },
        attributes: ['id', 'fecha_comp', 'nro_pedido'] // necesario para lead time
      }
    });

    const pedidasPorProducto = {};
    const facturadasPorProducto = {};

    for (const d of detallesPedidos) {
      const key = d.codItem;
      const descripcion = d.descripcion || "";
      if (!filtro || key.toLowerCase().includes(filtro) || descripcion.toLowerCase().includes(filtro)) {
        pedidasPorProducto[key] = pedidasPorProducto[key] || { producto: descripcion, pedida: 0 };
        pedidasPorProducto[key].pedida += parseFloat(d.cantidad || 0);
      }
    }

    for (const d of detallesFacturas) {
      const key = d.codItem;
      const descripcion = d.descripcion || "";
      if (!filtro || key.toLowerCase().includes(filtro) || descripcion.toLowerCase().includes(filtro)) {
        facturadasPorProducto[key] = facturadasPorProducto[key] || { producto: descripcion, facturada: 0, leadTimes: [] };
        facturadasPorProducto[key].facturada += parseFloat(d.cantidad || 0);

        // ✅ calcular lead time solo si hay nro_pedido
        const nroPedido = d.factura?.nro_pedido;
        if (nroPedido) {
          const pedido = await PedidoDux.findOne({
            where: { nro_pedido: nroPedido },
            attributes: ['fecha']
          });

          if (pedido?.fecha) {
            const diff = Math.round(
              (new Date(d.factura.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)
            );
            if (diff >= 0) facturadasPorProducto[key].leadTimes.push(diff);
          }
        } else {
          console.warn(`⚠️ Factura sin nro_pedido (id: ${d.factura?.id})`);
        }
      }
    }

    const resultado = Object.keys(pedidasPorProducto).map(key => {
      const pedida = pedidasPorProducto[key].pedida || 0;
      const facturada = facturadasPorProducto[key]?.facturada || 0;
      const leadTimes = facturadasPorProducto[key]?.leadTimes || [];

      const fillRate = pedida > 0 ? Math.min((facturada / pedida) * 100, 100) : null;
      const leadTimePromedio = leadTimes.length > 0
        ? +(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length).toFixed(2)
        : null;

      return {
        producto: pedidasPorProducto[key].producto || key,
        cantidadPedida: pedida,
        cantidadFacturada: facturada,
        fillRate: fillRate !== null ? +fillRate.toFixed(2) : null,
        leadTimePromedio
      };
    });

    res.json(resultado);
  } catch (err) {
    console.error("Error en obtenerEficienciaPorProducto:", err);
    res.status(500).json({ error: "Error al calcular eficiencia por producto" });
  }
};

export const obtenerDetallePorProducto = async (req, res) => {
  try {
    const desde = req.query.desde ? new Date(req.query.desde) : null;
    const hasta = req.query.hasta ? new Date(req.query.hasta) : null;

    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }

    const detallesPedidos = await DetallePedidoDux.findAll({
      include: {
        model: PedidoDux,
        as: "pedidoDux",
        where: { fecha: { [Op.between]: [desde, hasta] } },
        attributes: []
      }
    });

    const detallesFacturas = await DetalleFactura.findAll({
      include: {
        model: Factura,
        as: "factura",
        where: {
          fecha_comp: { [Op.between]: [desde, hasta] },
          anulada_boolean: false
        },
        attributes: []
      }
    });

    const map = new Map();

    for (const d of detallesPedidos) {
      const key = d.codItem;
      const desc = d.descripcion || key;
      if (!map.has(key)) {
        map.set(key, { codItem: key, descripcion: desc, pedida: 0, facturada: 0 });
      }
      const item = map.get(key);
      item.pedida += parseFloat(d.cantidad || 0);
    }

    for (const d of detallesFacturas) {
      const key = d.codItem;
      const desc = d.descripcion || key;
      if (!map.has(key)) {
        map.set(key, { codItem: key, descripcion: desc, pedida: 0, facturada: 0 });
      }
      const item = map.get(key);
      item.facturada += parseFloat(d.cantidad || 0);
    }

    const resultado = Array.from(map.values()).map((item) => ({
      ...item,
      diferencia: +(item.facturada - item.pedida).toFixed(2)
    }));

    res.json(resultado);
  } catch (err) {
    console.error("Error en obtenerDetallePorProducto:", err);
    res.status(500).json({ error: "Error al generar detalle por producto" });
  }
};

export const obtenerEficienciaPorCategoria = async (req, res) => {
  try {
    const desde = req.query.desde ? new Date(req.query.desde) : null;
    const hasta = req.query.hasta ? new Date(req.query.hasta) : null;
    const categoriaId = req.query.categoriaId || null;

    if (!desde || !hasta) {
      return res.status(400).json({ error: "Parámetros 'desde' y 'hasta' son requeridos" });
    }

    // ✅ Categorías válidas (excluye las que contienen "producción")
    const categorias = await Categoria.findAll({
      where: where(fn('LOWER', col('nombre')), {
        [Op.notLike]: '%producción%'
      }),
      attributes: ['id', 'nombre']
    });
    const categoriasValidas = new Set(categorias.map(c => c.id));
    const categoriaNombreMap = new Map(categorias.map(c => [c.id, c.nombre]));

    // ✅ Productos que pertenecen solo a categorías válidas
    const productos = await Producto.findAll({
      where: { categoriaId: { [Op.in]: Array.from(categoriasValidas) } },
      attributes: ['sku', 'categoriaId']
    });
    const productoCategoriaMap = new Map(productos.map(p => [p.sku, p.categoriaId]));

    // ✅ Pedidos válidos
    const pedidos = await PedidoDux.findAll({
      attributes: ['nro_pedido', 'fecha']
    });
    const pedidoFechaMap = new Map(pedidos.map(p => [p.nro_pedido, p.fecha]));

    const resumenPorCategoria = {};
    const codItemsPedidos = new Set();

    // 🧾 Detalles de pedidos (filtrados por fecha)
    const detallesPedidos = await DetallePedidoDux.findAll({
      include: {
        model: PedidoDux,
        as: "pedidoDux",
        where: { fecha: { [Op.between]: [desde, hasta] } },
        attributes: ['id', 'fecha'],
      }
    });

    for (const d of detallesPedidos) {
      const codItem = d.codItem;
      const catId = productoCategoriaMap.get(codItem);
      if (!catId || (categoriaId && catId != categoriaId)) continue;

      codItemsPedidos.add(codItem); // ✅ registrar que este item fue pedido

      if (!resumenPorCategoria[catId]) {
        resumenPorCategoria[catId] = {
          nombre: categoriaNombreMap.get(catId) || 'Sin categoría',
          cantidadPedida: 0,
          cantidadFacturada: 0,
          leadTimes: [],
        };
      }

      resumenPorCategoria[catId].cantidadPedida += parseFloat(d.cantidad || 0);
    }

    // 🧾 Detalles de facturas (no anuladas y con pedido válido)
    const detallesFacturas = await DetalleFactura.findAll({
      include: {
        model: Factura,
        as: "factura",
        where: {
          fecha_comp: { [Op.between]: [desde, hasta] },
          anulada_boolean: false,
        },
        attributes: ['fecha_comp', 'nro_pedido'],
      }
    });

    for (const d of detallesFacturas) {
      const codItem = d.codItem;
      const catId = productoCategoriaMap.get(codItem);
      if (!catId || (categoriaId && catId != categoriaId)) continue;

      if (!codItemsPedidos.has(codItem)) continue; // ❌ ignorar si no fue pedido

      const cantidadFacturada = parseFloat(d.cantidad || 0);
      if (cantidadFacturada === 0) continue;

      const fechaPedido = pedidoFechaMap.get(d.factura?.nro_pedido);
      if (!fechaPedido) continue; // ❌ ignorar si no tiene pedido asociado

      if (!resumenPorCategoria[catId]) {
        resumenPorCategoria[catId] = {
          nombre: categoriaNombreMap.get(catId) || 'Sin categoría',
          cantidadPedida: 0,
          cantidadFacturada: 0,
          leadTimes: [],
        };
      }

      resumenPorCategoria[catId].cantidadFacturada += cantidadFacturada;

      const dias = Math.round((new Date(d.factura.fecha_comp) - new Date(fechaPedido)) / (1000 * 60 * 60 * 24));
      if (dias >= 0) resumenPorCategoria[catId].leadTimes.push(dias);
    }

    // 📊 Resultado final
    const resultado = Object.entries(resumenPorCategoria)
      .filter(([_, data]) => data.cantidadFacturada > 0)
      .map(([catId, data]) => {
        const fillRate = data.cantidadPedida > 0
          ? Math.min((data.cantidadFacturada / data.cantidadPedida) * 100, 100)
          : null;

        const leadTimePromedio = data.leadTimes.length > 0
          ? +(data.leadTimes.reduce((a, b) => a + b, 0) / data.leadTimes.length).toFixed(2)
          : null;

        return {
          categoria: catId,
          categoriaNombre: data.nombre,
          cantidadPedida: data.cantidadPedida,
          cantidadFacturada: data.cantidadFacturada,
          fillRate: fillRate !== null ? +fillRate.toFixed(2) : null,
          leadTimePromedio
        };
      });

    res.json(resultado);
  } catch (err) {
    console.error("Error en obtenerEficienciaPorCategoria:", err);
    res.status(500).json({ error: "Error al calcular eficiencia por categoría" });
  }
};

export const obtenerDetallePorCategoria = async (req, res) => {
  try {
    const { desde, hasta, categoriaId } = req.query;

    if (!desde || !hasta || !categoriaId) {
      return res.status(400).json({ error: "Parámetros 'desde', 'hasta' y 'categoriaId' son requeridos" });
    }

    const desdeFecha = new Date(desde);
    const hastaFecha = new Date(hasta);

    const detallesPedidos = await DetallePedidoDux.findAll({
      include: {
        model: PedidoDux,
        as: "pedidoDux",
        where: { fecha: { [Op.between]: [desdeFecha, hastaFecha] } },
        attributes: ['id', 'nro_pedido', 'fecha']
      }
    });

    const detallesFacturas = await DetalleFactura.findAll({
      include: {
        model: Factura,
        as: "factura",
        where: {
          fecha_comp: { [Op.between]: [desdeFecha, hastaFecha] },
          anulada_boolean: false
        },
        attributes: ['nro_pedido', 'fecha_comp']
      }
    });

    const productoCache = new Map();

    const perteneceACategoria = async (codItem) => {
      if (productoCache.has(codItem)) return productoCache.get(codItem);

      const prod = await Producto.findOne({ where: { sku: codItem } });
      const pertenece = prod?.categoriaId?.toString() === categoriaId;
      productoCache.set(codItem, pertenece);
      return pertenece;
    };

    const agrupado = {};

    for (const d of detallesPedidos) {
      if (await perteneceACategoria(d.codItem)) {
        const pedido = d.pedidoDux;
        if (!agrupado[pedido.nro_pedido]) {
          agrupado[pedido.nro_pedido] = {
            nroPedido: pedido.nro_pedido,
            fecha: pedido.fecha,
            cantidadPedida: 0,
            cantidadFacturada: 0,
            leadTimeDias: null
          };
        }
        agrupado[pedido.nro_pedido].cantidadPedida += parseFloat(d.cantidad || 0);
      }
    }

    for (const d of detallesFacturas) {
      if (await perteneceACategoria(d.codItem)) {
        const nro = d.factura?.nro_pedido;
        if (nro && agrupado[nro]) {
          agrupado[nro].cantidadFacturada += parseFloat(d.cantidad || 0);
          if (d.factura.fecha_comp && agrupado[nro].fecha) {
            const diff = Math.round(
              (new Date(d.factura.fecha_comp) - new Date(agrupado[nro].fecha)) / (1000 * 60 * 60 * 24)
            );
            if (diff >= 0) agrupado[nro].leadTimeDias = diff;
          }
        }
      }
    }

    const resultado = Object.values(agrupado).map((p) => {
      const fillRate = p.cantidadPedida > 0
        ? Math.min((p.cantidadFacturada / p.cantidadPedida) * 100, 100)
        : 0;

      return {
        ...p,
        fillRate: +fillRate.toFixed(2)
      };
    });

    res.json(resultado);
  } catch (err) {
    console.error("Error en obtenerDetallePorCategoria:", err);
    res.status(500).json({ error: "Error al generar detalle por categoría" });
  }
};

export const obtenerEficienciaPorCliente = async (req, res) => {
  try {
    const { desde, hasta, cliente } = req.query;
    if (!desde || !hasta) return res.status(400).json({ error: "Faltan fechas" });

    const fechaDesde = new Date(desde);
    const fechaHasta = new Date(hasta);
    const filtroCliente = cliente?.toLowerCase() || "";

    const pedidos = await PedidoDux.findAll({
      where: {
        fecha: { [Op.between]: [fechaDesde, fechaHasta] },
        ...(filtroCliente && { cliente: { [Op.like]: `%${filtroCliente}%` } }),
      },
      attributes: ["id", "nro_pedido", "fecha", "cliente"],
    });

    const nroPedidos = pedidos.map(p => p.nro_pedido);

    const facturas = await Factura.findAll({
      where: {
        fecha_comp: { [Op.between]: [fechaDesde, fechaHasta] },
        anulada_boolean: false,
        nro_pedido: { [Op.in]: nroPedidos },
      },
    });

    const detallesPedidos = await DetallePedidoDux.findAll();
    const detallesFacturas = await DetalleFactura.findAll({
      include: {
        model: Factura,
        as: "factura",
        attributes: ["nro_pedido"],
      },
    });

    const clientesMap = new Map();

    for (const pedido of pedidos) {
      const cliente = pedido.cliente || "Sin nombre";
      const factura = facturas.find(f => f.nro_pedido === pedido.nro_pedido);
      const detallesP = detallesPedidos.filter(d => d.pedidoDuxId === pedido.id);
      const detallesF = detallesFacturas.filter(d => d.factura?.nro_pedido === pedido.nro_pedido);

      const cantidadPedida = detallesP.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);
      const cantidadFacturada = detallesF.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);

      if (cantidadFacturada === 0) continue;

      const fillRate = cantidadPedida > 0
        ? Math.min((cantidadFacturada / cantidadPedida) * 100, 100)
        : null;

      const leadTime = factura
        ? Math.max(0, Math.round((new Date(factura.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)))
        : null;

      if (!clientesMap.has(cliente)) {
        clientesMap.set(cliente, {
          cliente,
          pedidos: [],
          leadTimes: [],
          totalPedida: 0,
          totalFacturada: 0,
        });
      }

      const entry = clientesMap.get(cliente);
      if (fillRate !== null) entry.pedidos.push(fillRate);
      if (leadTime !== null) entry.leadTimes.push(leadTime);
      entry.totalPedida += cantidadPedida;
      entry.totalFacturada += cantidadFacturada;
    }

    const resultado = Array.from(clientesMap.values()).map(entry => {
      return {
        cliente: entry.cliente,
        cantidadPedida: entry.totalPedida,
        cantidadFacturada: entry.totalFacturada,
        fillRate: entry.pedidos.length
          ? +(entry.pedidos.reduce((a, b) => a + b, 0) / entry.pedidos.length).toFixed(2)
          : null,
        leadTimePromedio: entry.leadTimes.length
          ? +(entry.leadTimes.reduce((a, b) => a + b, 0) / entry.leadTimes.length).toFixed(2)
          : null,
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error("Error en obtenerEficienciaPorCliente:", error);
    res.status(500).json({ error: "Error al calcular eficiencia por cliente" });
  }
};

export const obtenerDetallePorCliente = async (req, res) => {
  try {
    const { desde, hasta, cliente } = req.query;

    if (!desde || !hasta || !cliente) {
      return res.status(400).json({ error: "Faltan parámetros requeridos" });
    }

    const pedidos = await PedidoDux.findAll({
      where: {
        cliente,
        fecha: { [Op.between]: [new Date(desde), new Date(hasta)] },
      },
      attributes: ['id', 'nro_pedido', 'fecha']
    });

    const nroPedidos = pedidos.map(p => p.nro_pedido);
    const pedidosMap = new Map(pedidos.map(p => [p.nro_pedido, p]));

    const facturas = await Factura.findAll({
      where: {
        nro_pedido: { [Op.in]: nroPedidos },
        anulada_boolean: false
      },
      attributes: ['nro_pedido', 'fecha_comp']
    });

    const detallesPedidos = await DetallePedidoDux.findAll({
      where: { pedidoDuxId: { [Op.in]: pedidos.map(p => p.id) } }
    });

    const detallesFacturas = await DetalleFactura.findAll({
      include: {
        model: Factura,
        as: "factura",
        where: { nro_pedido: { [Op.in]: nroPedidos } }
      }
    });

    const facturasMap = new Map(facturas.map(f => [f.nro_pedido, f]));

    const resultado = pedidos.map(pedido => {
      const detallesP = detallesPedidos.filter(d => d.pedidoDuxId === pedido.id);
      const cantidadPedida = detallesP.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);

      const detallesF = detallesFacturas.filter(d => d.factura?.nro_pedido === pedido.nro_pedido);
      const cantidadFacturada = detallesF.reduce((acc, d) => acc + parseFloat(d.cantidad || 0), 0);

      const fillRate = cantidadPedida > 0
        ? Math.min((cantidadFacturada / cantidadPedida) * 100, 100)
        : null;

      const factura = facturasMap.get(pedido.nro_pedido);
      const leadTimeDias =
        factura && cantidadFacturada > 0
          ? Math.max(0, Math.round((new Date(factura.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)))
          : null;

      return {
        pedidoId: pedido.id,
        nroPedido: pedido.nro_pedido,
        fecha: pedido.fecha,
        cantidadPedida,
        cantidadFacturada,
        fillRate: fillRate !== null ? +fillRate.toFixed(2) : null,
        leadTimeDias,
      };
    });

    res.json(resultado);
  } catch (error) {
    console.error("Error en obtenerDetalleCliente:", error);
    res.status(500).json({ error: "Error al obtener detalle del cliente" });
  }
};


