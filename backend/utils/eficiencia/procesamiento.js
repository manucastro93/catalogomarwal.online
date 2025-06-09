// backend/utils/eficiencia/procesamiento.js
import { Categoria, Producto } from '../../models/index.js'; // Ajusta la ruta

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
dayjs.extend(utc);

/*** 🗂 Prepara mapeos de categorías y productos.
 * @param {Array<Categoria>} categorias - Lista de categorías.
 * @param {Array<Producto>} productos - Lista de productos.
 * @returns {object} Objeto con mapeos de categorías y productos.
 */
export function prepararMapeosCategoriasYProductos(categorias, productos) {
    const categoriasValidas = new Set(categorias.map(c => c.id));
    const categoriaNombreMap = new Map(categorias.map(c => [c.id, c.nombre]));
    const productoCategoriaMap = new Map(productos.map(p => [p.sku, p.categoriaId]));
    return { categoriasValidas, categoriaNombreMap, productoCategoriaMap };
}

export function procesarFacturasParaMapeo(facturas) {
  const detallesFacturasPorPedido = new Map();
  const primeraFacturaPorPedido = new Map();
  const ultimaFacturaPorPedido = new Map(); // ¡Importante!
  const fechasFacturasPorPedido = new Map();
  const cantidadesFacturadasPorItemEnPedido = new Map();
  const valorFacturadoPorItemEnPedido = new Map();
  const fechaUltimaFacturaPorItem = new Map(); // ¡Importante!

  for (const factura of facturas) {
    const nroPedido = Number(factura.nro_pedido); 
    if (isNaN(nroPedido)) { 
        console.warn(`Factura ID: ${factura.id} tiene un nro_pedido inválido: ${factura.nro_pedido}. Se omitirá.`);
        continue;
    }
    const fechaFacturaActual = factura.fecha_comp ? new Date(factura.fecha_comp) : null;

    if (factura.detalles && Array.isArray(factura.detalles)) {
      if (!detallesFacturasPorPedido.has(nroPedido)) {
        detallesFacturasPorPedido.set(nroPedido, []);
      }
      detallesFacturasPorPedido.get(nroPedido).push(...factura.detalles);

      for (const det of factura.detalles) {
        const codItem = (det.codItem || "").toString().trim().toUpperCase();
        const claveItemPedido = `${nroPedido}-${codItem}`; 

        const cantidad = parseFloat(det.cantidad || 0);
        const precio = parseFloat(det.precioUnitario || 0);

        cantidadesFacturadasPorItemEnPedido.set(
          claveItemPedido,
          (cantidadesFacturadasPorItemEnPedido.get(claveItemPedido) || 0) + cantidad
        );
        valorFacturadoPorItemEnPedido.set(
          claveItemPedido,
          (valorFacturadoPorItemEnPedido.get(claveItemPedido) || 0) + (cantidad * precio)
        );

        if (fechaFacturaActual) {
          // Guardar la ULTIMA fecha de factura por item en un pedido específico
          if (
            !fechaUltimaFacturaPorItem.has(claveItemPedido) || 
            fechaFacturaActual > fechaUltimaFacturaPorItem.get(claveItemPedido)
          ) {
            fechaUltimaFacturaPorItem.set(claveItemPedido, fechaFacturaActual); 
          }
        }
      }
    }

    if (!primeraFacturaPorPedido.has(nroPedido)) {
      primeraFacturaPorPedido.set(nroPedido, factura);
    }

    // Lógica para la ULTIMA factura por pedido
    if (!ultimaFacturaPorPedido.has(nroPedido) || 
        (fechaFacturaActual && ultimaFacturaPorPedido.get(nroPedido) && fechaFacturaActual > new Date(ultimaFacturaPorPedido.get(nroPedido).fecha_comp))) {
      ultimaFacturaPorPedido.set(nroPedido, factura);
    }

    if (!fechasFacturasPorPedido.has(nroPedido)) {
      fechasFacturasPorPedido.set(nroPedido, new Set());
    }
    if (factura.fecha_comp) {
      fechasFacturasPorPedido.get(nroPedido).add(
        dayjs(factura.fecha_comp).utc().format("DD-MM-YYYY")
      );
    }
  }

  const fechasFacturasArrayPorPedido = new Map();
  for (const [nroPedido, fechasSet] of fechasFacturasPorPedido.entries()) {
    fechasFacturasArrayPorPedido.set(nroPedido, [...fechasSet].sort());
  }

  return {
    detallesFacturasPorPedido,
    primeraFacturaPorPedido,
    ultimaFacturaPorPedido, // ¡Exportar!
    fechasFacturasArrayPorPedido,
    cantidadesFacturadasPorItemEnPedido,
    valorFacturadoPorItemEnPedido,
    fechaUltimaFacturaPorItem, // ¡Exportar!
  };
}