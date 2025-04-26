import cron from 'node-cron';
import dayjs from 'dayjs';
import { Op } from 'sequelize';
import { Pedido } from '../models/index.js';
import { revertirPedidoEditando } from '../utils/revertirPedidoEditando.js';

// Cada 5 minutos, revertir pedidos en edición por más de 30 minutos
cron.schedule('*/5 * * * *', async () => {
  console.log("⏰ Ejecutando cron para revertir pedidos en edición...");
  const cutoff = dayjs().subtract(30, 'minutes').toDate();
  const pedidosEditando = await Pedido.findAll({
    where: {
      estadoEdicion: true,
      updatedAt: { [Op.lte]: cutoff },
    },
  });

  for (const pedido of pedidosEditando) {
    await revertirPedidoEditando(pedido);
  }
});
