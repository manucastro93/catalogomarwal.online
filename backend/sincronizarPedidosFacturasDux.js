import dotenv from 'dotenv';
dotenv.config();

import sequelize from './config/database.js';
import { sincronizarPedidosDesdeDux, sincronizarFacturasDesdeDux } from './services/dux.service.js';

async function ejecutar() {
  console.log(`[${new Date().toISOString()}] 🚀 Iniciando sincronización...`);

  try {
    
    console.log('⏳ Ejecutando sincronizarPedidosDesdeDux...');
    const resultadoPedidos = await sincronizarPedidosDesdeDux(5);
    console.log(`✅ Pedidos sincronizados: ${resultadoPedidos.length}`);

    console.log('⏳ Ejecutando sincronizarFacturasDesdeDux...');
    const resFacturas = await sincronizarFacturasDesdeDux(5);
    console.log(`✅ Facturas: ${JSON.stringify(resFacturas, null, 2)}`);
    
  } catch (error) {
    console.error('❌ Error general en la sincronización:', error);
  } finally {
    await sequelize.close();
    console.log(`[${new Date().toISOString()}] 🔚 Finalizó sincronización.`);
  }
}

ejecutar();
