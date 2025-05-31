import { PedidoDux, DetallePedidoDux } from '../models/index.js';
import sequelize from '../config/database.js';

function parsearDetallesPedidoSeguro(detallesBrutos) {
  let detalles = detallesBrutos;
  let intentos = 0;

  try {
    while (typeof detalles === "string" && intentos < 5) {
      detalles = JSON.parse(detalles);
      intentos++;
    }

    if (!Array.isArray(detalles)) throw new Error("No es un array válido");

    return detalles;
  } catch (e) {
    return null;
  }
}

export async function migrarDetallesPedidosDux() {
  const pedidos = await PedidoDux.findAll({ attributes: ['id', 'detalles'] });

  for (const pedido of pedidos) {
    if (!pedido.detalles) continue;

    const detalles = parsearDetallesPedidoSeguro(pedido.detalles);

    if (!detalles) {
      console.warn(`❌ JSON inválido en pedido ${pedido.id}`);
      continue;
    }

    for (const item of detalles) {
      if (!item.cod_item) {
        console.warn(`⛔ Pedido ${pedido.id} con item sin cod_item, omitido.`);
        continue;
      }

      await DetallePedidoDux.create({
        cantidad: parseFloat(item.ctd || 0),
        precioUnitario: parseFloat(item.precio_uni || 0),
        subtotal: parseFloat(item.precio_uni || 0) * parseFloat(item.ctd || 0),
        descuento: parseFloat(item.porc_desc || 0),
        codItem: item.cod_item,
        descripcion: item.item || null,
        pedidoDuxId: pedido.id,
      });
    }
  }

  console.log("✅ Migración de detalles de pedidos Dux finalizada");
}

// ✅ Ejecutar solo si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    await sequelize.authenticate();
    console.log("🔌 Conectado a la base de datos");
    await migrarDetallesPedidosDux();
    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al migrar:", error);
    process.exit(1);
  }
}
