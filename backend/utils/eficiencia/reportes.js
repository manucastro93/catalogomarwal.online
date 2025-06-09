import { toFloat, toFixed, formatFecha } from "./helpers.js";
import dayjs from "dayjs";


export function construirResumenDetallePorProducto(detallesPedidos, detallesFacturas) {
  const map = new Map();

  for (const dp of detallesPedidos) {
    const key = dp.codItem;
    const desc = dp.descripcion || key;
    if (!map.has(key)) {
      map.set(key, { codItem: key, descripcion: desc, pedida: 0, facturada: 0 });
    }
    map.get(key).pedida += toFloat(dp.cantidad);
  }

  for (const df of detallesFacturas) {
    const key = df.codItem;
    const desc = df.descripcion || key;
    if (!map.has(key)) {
      map.set(key, { codItem: key, descripcion: desc, pedida: 0, facturada: 0 });
    }
    map.get(key).facturada += toFloat(df.cantidad);
  }

  return Array.from(map.values()).map(item => ({
    ...item,
    diferencia: toFixed(item.facturada - item.pedida)
  }));
}

export function generarReporteEvolucionMensual({ facturas, pedidosPorNro, cantidadesPedidasPorItemEnPedido, detallesFacturasPorPedido, ultimaFacturaPorPedido, detallesPedidosPorPedido }) { // ¡Añadido detallesPedidosPorPedido!
  const dataPorMes = {};
  
  const pedidosAgregadosPorMes = new Map();

  for (const factura of facturas) {
    const nroPedido = Number(factura.nro_pedido);
    const pedido = pedidosPorNro.get(nroPedido);
    if (isNaN(nroPedido) || !pedido || !pedido.fecha) continue;

    const mes = dayjs(pedido.fecha).format("YYYY-MM");
    
    if (!pedidosAgregadosPorMes.has(mes)) {
        pedidosAgregadosPorMes.set(mes, new Map());
    }
    const pedidosDelMes = pedidosAgregadosPorMes.get(mes);

    if (!pedidosDelMes.has(nroPedido)) {
        // Obtenemos los detalles de pedido para este pedido específico para calcular cantidad pedida
        // Asegúrate de que 'pedido.id' sea la clave correcta para detallesPedidosPorPedido
        const detallesP = detallesPedidosPorPedido.get(pedido.id) || []; 
        const cantidadPedidaTotalDelPedido = detallesP.reduce((acc, d) => acc + toFloat(d.cantidad), 0);

        pedidosDelMes.set(nroPedido, { 
            cantidadPedida: cantidadPedidaTotalDelPedido, 
            cantidadFacturada: 0, 
            fechaPedido: new Date(pedido.fecha), 
            ultimaFechaFactura: null 
        });
    }
    const pedidoData = pedidosDelMes.get(nroPedido);

    for (const df of factura.detalles || []) {
        pedidoData.cantidadFacturada += toFloat(df.cantidad);
    }
    
    const fechaFacturaActual = new Date(factura.fecha_comp);
    if (!pedidoData.ultimaFechaFactura || fechaFacturaActual > pedidoData.ultimaFechaFactura) {
        pedidoData.ultimaFechaFactura = fechaFacturaActual;
    }
  }

  for (const [mes, pedidosDelMesMap] of pedidosAgregadosPorMes.entries()) {
    let totalCantidadPedidaMes = 0;
    let totalCantidadFacturadaMes = 0;
    let totalLeadTimeMes = 0;
    let countLeadTimeMes = 0;

    for (const [nroPedido, pedidoData] of pedidosDelMesMap.entries()) {
        if (pedidoData.cantidadFacturada > 0) { 
            totalCantidadPedidaMes += pedidoData.cantidadPedida;
            totalCantidadFacturadaMes += pedidoData.cantidadFacturada;

            if (pedidoData.ultimaFechaFactura && pedidoData.fechaPedido) {
                const leadTime = Math.max(0, Math.round((pedidoData.ultimaFechaFactura - pedidoData.fechaPedido) / (1000 * 60 * 60 * 24)));
                totalLeadTimeMes += leadTime;
                countLeadTimeMes++;
            }
        }
    }

    dataPorMes[mes] = {
        pedida: totalCantidadPedidaMes,
        facturada: totalCantidadFacturadaMes,
        totalLeadTime: totalLeadTimeMes,
        countLeadTime: countLeadTimeMes
    };
  }

  return Object.entries(dataPorMes)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, v]) => ({
      mes,
      fillRate: v.pedida > 0 && v.facturada > 0 
        ? toFixed(Math.min(v.facturada / v.pedida, 1) * 100)
        : 0, 
      leadTime: v.countLeadTime > 0
        ? toFixed(v.totalLeadTime / v.countLeadTime)
        : null
    }));
}

export function generarDetallePorPedido({
  pedido,
  detallesPedido,
  fechasFacturasArray,
  ultimaFacturaPedido, // ¡Importante!
  cantidadesFacturadasPorItemEnPedido,
  valorFacturadoPorItemEnPedido,
  fechaUltimaFacturaPorItem // ¡Importante!
}) {
  let totalCantidadPedida = 0;
  let totalValorPedido = 0;
  let totalCantidadFacturada = 0;
  let totalValorFacturado = 0;

  const productos = detallesPedido.map(p => {
    const pedida = toFloat(p.cantidad);
    const precioUnitarioPedido = toFloat(p.precioUnitario);
    const codItemNormalizado = (p.codItem || "").toString().trim().toUpperCase();
    const claveItemPedido = `${Number(pedido.nro_pedido)}-${codItemNormalizado}`; 

    const facturada = cantidadesFacturadasPorItemEnPedido.get(claveItemPedido) || 0;
    const valorFacturadoItem = valorFacturadoPorItemEnPedido.get(claveItemPedido) || 0;

    totalCantidadPedida += pedida;
    totalValorPedido += pedida * precioUnitarioPedido;
    totalCantidadFacturada += facturada;
    totalValorFacturado += valorFacturadoItem;

    const fillRate = pedida > 0 ? toFixed(Math.min(facturada / pedida, 1) * 100) : 0;

    let leadTimeItem = null;
    const ultimaFacturaItemFecha = fechaUltimaFacturaPorItem.get(claveItemPedido); 
    if (facturada > 0 && ultimaFacturaItemFecha && pedido.fecha) {
      leadTimeItem = Math.max(
        0,
        Math.round((ultimaFacturaItemFecha - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24))
      );
    }

    return {
      codItem: p.codItem,
      descripcion: p.descripcion || "Sin descripción",
      cantidadPedida: toFixed(pedida),
      cantidadFacturada: toFixed(facturada),
      fillRate,
      precioUnitarioPedido: toFixed(precioUnitarioPedido),
      valorFacturadoItem: toFixed(valorFacturadoItem),
      leadTimeItem,
    };
  });

  const fillRatePedido = totalCantidadPedida > 0
    ? toFixed(Math.min(totalCantidadFacturada / totalCantidadPedida, 1) * 100)
    : 0;

  const fillRatePonderado = totalValorPedido > 0
    ? toFixed(Math.min(totalValorFacturado / totalValorPedido, 1) * 100)
    : 0;

  let leadTimeDias = null;
  if (
    ultimaFacturaPedido && 
    totalCantidadFacturada > 0 && 
    pedido.fecha && 
    ultimaFacturaPedido.fecha_comp 
  ) {
    leadTimeDias = Math.max(
      0,
      Math.round(
        (new Date(ultimaFacturaPedido.fecha_comp) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)
      )
    );
  }

  return {
    tipo: "pedido",
    pedidoId: pedido.id,
    nroPedido: pedido.nro_pedido,
    fecha: formatFecha(pedido.fecha),
    fechasFacturas: fechasFacturasArray.length > 0 ? fechasFacturasArray : [],
    cantidadPedida: toFixed(totalCantidadPedida),
    cantidadFacturada: toFixed(totalCantidadFacturada),
    fillRate: toFixed(fillRatePedido),
    fillRatePonderado: toFixed(fillRatePonderado),
    leadTimeDias,
    totalPedido: toFixed(totalValorPedido),
    totalFacturado: toFixed(totalValorFacturado),
    productos,
  };
}

export function generarReporteEficienciaPorProducto(detallesPedidos, facturasCompletas, pedidos, filtro = "") {
  const pedidasPorProducto = new Map();
  const facturadasPorProducto = new Map();
  const lowerFiltro = filtro.toLowerCase();

  const pedidoIdToNro = new Map();
  for (const p of pedidos) {
    pedidoIdToNro.set(p.id, p.nro_pedido);
  }

  const pedidosConAlgunaFactura = new Set(facturasCompletas.map(f => Number(f.nro_pedido)));

  for (const dp of detallesPedidos) {
    const nroPedido = pedidoIdToNro.get(dp.pedidoDuxId);
    if (!nroPedido || !pedidosConAlgunaFactura.has(Number(nroPedido))) continue;

    const key = (dp.codItem || "").toString().trim().toUpperCase();
    const desc = dp.descripcion || key;
    const precioUnitario = toFloat(dp.precioUnitario || 0);
    const cantidad = toFloat(dp.cantidad);
    const totalPedido = cantidad * precioUnitario;

    if (!filtro || key.toLowerCase().includes(lowerFiltro) || desc.toLowerCase().includes(lowerFiltro)) {
      const current = pedidasPorProducto.get(key) || {
        producto: desc,
        pedida: 0,
        totalPedido: 0
      };
      current.pedida += cantidad;
      current.totalPedido += totalPedido;
      pedidasPorProducto.set(key, current);
    }
  }

  for (const factura of facturasCompletas) {
    if (!Array.isArray(factura.detalles)) continue;
    const nroPedido = Number(factura.nro_pedido);

    for (const df of factura.detalles) {
      const key = (df.codItem || "").toString().trim().toUpperCase();
      const desc = df.descripcion || key;
      const cantidad = toFloat(df.cantidad);
      const precioUnitario = toFloat(df.precioUnitario || 0);
      const totalFacturado = cantidad * precioUnitario;

      if (!pedidasPorProducto.has(key)) continue;

      if (!filtro || key.toLowerCase().includes(lowerFiltro) || desc.toLowerCase().includes(lowerFiltro)) {
        const current = facturadasPorProducto.get(key) || {
          producto: desc,
          facturada: 0,
          totalFacturado: 0,
          leadTimes: []
        };
        current.facturada += cantidad;
        current.totalFacturado += totalFacturado;

        const fechaPedido = pedidos.find(p => p.nro_pedido === nroPedido)?.fecha;
        if (fechaPedido && factura.fecha_comp) {
          const diff = Math.max(0, Math.round(
            (new Date(factura.fecha_comp) - new Date(fechaPedido)) / (1000 * 60 * 60 * 24)
          ));
          current.leadTimes.push(diff);
        }

        facturadasPorProducto.set(key, current);
      }
    }
  }

  const result = [];

  for (const [key, pedidaData] of pedidasPorProducto.entries()) {
    const facturadaData = facturadasPorProducto.get(key) || { facturada: 0, leadTimes: [], totalFacturado: 0 };

    const pedidas = pedidaData.pedida;
    const facturadas = facturadaData.facturada;
    const leadTimes = facturadaData.leadTimes;

    if (pedidas === 0) continue;

    const fillRate = toFixed(Math.min(facturadas / pedidas, 1) * 100);

    const leadTimePromedio = leadTimes.length > 0
      ? toFixed(leadTimes.reduce((a, b) => a + b, 0) / leadTimes.length)
      : null;

    const frPonderado = pedidaData.totalPedido > 0
      ? toFixed((facturadaData.totalFacturado / pedidaData.totalPedido) * 100)
      : null;

    result.push({
      producto: pedidaData.producto,
      codItem: key,
      cantidadPedida: toFixed(pedidas),
      cantidadFacturada: toFixed(facturadas),
      fillRate,
      fillRatePonderado: frPonderado,
      leadTimePromedio
    });
  }

  return result;
}

export function generarDetallePorPedidoCategoria({
  detallesPedidos,
  pedidosPorId,
  facturasCompletas,
  pedidosPorNro,
}) {
  const agrupado = new Map();

  // Paso 1: Acumular cantidades pedidas por pedido y por producto
  for (const dp of detallesPedidos) {
    const pedido = pedidosPorId.get(dp.pedidoDuxId);
    if (!pedido) continue;

    const clave = Number(pedido.nro_pedido);
    const precioUnitario = toFloat(dp.precioUnitario || 0);

    const current = agrupado.get(clave) || {
      nroPedido: clave,
      fecha: pedido.fecha,
      cantidadPedida: 0,
      cantidadFacturada: 0,
      valorPedido: 0,
      valorFacturado: 0,
      leadTimeDias: null,
      fechasFacturas: new Set(),
      productos: new Map(),
    };

    const cantidad = toFloat(dp.cantidad);
    current.cantidadPedida += cantidad;
    current.valorPedido += cantidad * precioUnitario;

    const productoEnPedido = current.productos.get(dp.codItem) || {
      codItem: dp.codItem,
      descripcion: dp.descripcion,
      cantidadPedida: 0,
      cantidadFacturada: 0,
      precioUnitario: precioUnitario,
    };

    productoEnPedido.cantidadPedida += cantidad;
    current.productos.set(dp.codItem, productoEnPedido);
    agrupado.set(clave, current);
  }

  // Paso 2: Acumular cantidades facturadas y fechas de facturas
  for (const factura of facturasCompletas) {
    const nroPedido = Number(factura.nro_pedido);
    const pedidoData = agrupado.get(nroPedido);
    if (!pedidoData) continue;

    const pedidoCompleto = pedidosPorNro.get(nroPedido);
    const fechaPedido = pedidoCompleto?.fecha;

    for (const df of factura.detalles || []) {
      const cantidad = toFloat(df.cantidad);
      const precioUnitarioFactura = toFloat(df.precioUnitario || 0);
      const producto = pedidoData.productos.get(df.codItem);
      if (!producto) continue;

      producto.cantidadFacturada += cantidad;
      pedidoData.cantidadFacturada += cantidad;
      pedidoData.valorFacturado += cantidad * precioUnitarioFactura;

      if (factura.fecha_comp) {
        pedidoData.fechasFacturas.add(factura.fecha_comp);

        if (fechaPedido && pedidoData.leadTimeDias === null) {
          const diff = Math.max(
            0,
            Math.round((new Date(factura.fecha_comp) - new Date(fechaPedido)) / (1000 * 60 * 60 * 24))
          );
          pedidoData.leadTimeDias = diff;
        }
      }
    }

    agrupado.set(nroPedido, pedidoData);
  }

  // Paso 3: Formato final
  return Array.from(agrupado.values())
    .filter(p => p.cantidadFacturada > 0)
    .map(p => {
      const fillRate = p.cantidadPedida > 0
        ? toFixed(Math.min(p.cantidadFacturada / p.cantidadPedida, 1) * 100)
        : 0;

      const fillRatePonderado = p.valorPedido > 0
        ? toFixed(Math.min(p.valorFacturado / p.valorPedido, 1) * 100)
        : 0;

      const productosDetallados = Array.from(p.productos.values()).map(prod => ({
        codItem: prod.codItem,
        descripcion: prod.descripcion,
        cantidadPedida: toFixed(prod.cantidadPedida),
        cantidadFacturada: toFixed(prod.cantidadFacturada),
        fillRate: prod.cantidadPedida > 0
          ? toFixed(Math.min(prod.cantidadFacturada / prod.cantidadPedida, 1) * 100)
          : 0,
      }));

      return {
        nroPedido: p.nroPedido,
        fechaPedido: formatFecha(p.fecha),
        fechasFacturas: Array.from(p.fechasFacturas).map(f => formatFecha(f)),
        cantidadPedida: toFixed(p.cantidadPedida),
        cantidadFacturada: toFixed(p.cantidadFacturada),
        totalPedido: toFixed(p.valorPedido),
        totalFacturado: toFixed(p.valorFacturado),
        fillRate,
        fillRatePonderado,
        leadTimeDias: p.leadTimeDias,
        productos: productosDetallados,
      };
    })
    .sort((a, b) =>
      dayjs(a.fechaPedido, "DD-MM-YYYY").diff(dayjs(b.fechaPedido, "DD-MM-YYYY"))
    );
}

export function generarDetalleProductoPorPedido(productoSku, datos) {
  if (!productoSku || typeof productoSku !== "string") {
    throw new Error("SKU de producto inválido o no definido.");
  }

  const {
    pedidos,
    detallesPedidosPorPedido,
    fechasFacturasArrayPorPedido,
    cantidadesFacturadasPorItemEnPedido,
    valorFacturadoPorItemEnPedido,
    fechaUltimaFacturaPorItem,
    facturasCompletas
  } = datos;

  const resultado = [];
  const productoNormalizado = productoSku.toUpperCase();

  // 🔒 Filtrar solo pedidos con al menos una factura asociada
  const pedidosConFactura = new Set(
    facturasCompletas.map(f => Number(f.nro_pedido))
  );

  for (const pedido of pedidos) {
    if (!pedidosConFactura.has(Number(pedido.nro_pedido))) continue;

    const detalles = detallesPedidosPorPedido.get(pedido.id) || [];
    const fechasFacturas = fechasFacturasArrayPorPedido.get(pedido.nro_pedido) || [];

    for (const detalle of detalles) {
      const codItem = (detalle.codItem || "").toString().trim().toUpperCase();
      if (codItem !== productoNormalizado) continue;

      const claveItemPedido = `${Number(pedido.nro_pedido)}-${codItem}`;
      const pedida = toFloat(detalle.cantidad);
      const facturada = cantidadesFacturadasPorItemEnPedido.get(claveItemPedido) || 0;
      const valorFacturado = valorFacturadoPorItemEnPedido.get(claveItemPedido) || 0;
      const precioUnitario = toFloat(detalle.precioUnitario || 0);
      const totalPedido = pedida * precioUnitario;
      const fillRate = pedida > 0 ? toFixed(Math.min(facturada / pedida, 1) * 100) : 0;
      const fillRatePonderado = pedida > 0 ? toFixed((facturada * 100) / pedida) : 0;

      const fechaUltima = fechaUltimaFacturaPorItem.get(claveItemPedido);
      const leadTimeDias = (fechaUltima && pedido.fecha)
        ? Math.max(0, Math.round((new Date(fechaUltima) - new Date(pedido.fecha)) / (1000 * 60 * 60 * 24)))
        : null;

      resultado.push({
        pedidoId: pedido.id,
        nroPedido: pedido.nro_pedido,
        fecha: formatFecha(pedido.fecha),
        codItem,
        descripcion: detalle.descripcion,
        cantidadPedida: pedida,
        cantidadFacturada: facturada,
        totalPedido,
        totalFacturado: valorFacturado,
        fillRate,
        fillRatePonderado,
        fechasFacturas,
        leadTimeDias
      });
    }
  }

  return resultado;
}

