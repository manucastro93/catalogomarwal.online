import { Factura, DetalleFactura } from '../models/index.js';

console.log('🚀 Iniciando migración de detalles JSON...');

async function migrarDetallesFacturas() {
  const facturas = await Factura.findAll({
    attributes: ['id', 'detalles_json'],
    where: { anulada_boolean: false },
  });

  for (const factura of facturas) {
    if (!factura.detalles_json) continue;

    let detalles;
try {
  detalles = JSON.parse(factura.detalles_json);
  if (typeof detalles === 'string') {
    detalles = JSON.parse(detalles); // doble parseo si quedó como string
  }
} catch {
  console.warn(`❌ JSON inválido en factura ${factura.id}`);
  continue;
}

    for (const item of detalles) {
      if (!item.cod_item) {
        console.warn(`⛔ Factura ${factura.id} con item sin cod_item, omitido.`);
        continue;
      }

      await DetalleFactura.create({
        cantidad: parseFloat(item.ctd || 0),
        precioUnitario: parseFloat(item.precio_uni || 0),
        subtotal: parseFloat(item.precio_uni || 0) * parseFloat(item.ctd || 0),
        descuento: parseFloat(item.porc_desc || 0),
        costo: parseFloat(item.costo || 0),
        codItem: item.cod_item,
        descripcion: item.item || null,
        facturaId: factura.id,
      });
    }
  }
}

const main = async () => {
  await migrarDetallesFacturas();
  console.log('✅ Migración finalizada con éxito.');
  process.exit(0);
};

main();