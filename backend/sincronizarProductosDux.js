import dotenv from 'dotenv';
dotenv.config();

import sequelize from './config/database.js';
import { sincronizarProductosDesdeDux, sincronizarPedidosDesdeDux, sincronizarFacturasDesdeDux, sincronizarPersonalDesdeDux } from './services/dux.service.js';

async function ejecutar() {
  console.log(`[${new Date().toISOString()}] 🚀 Iniciando sincronización...`);

  try {

    const resultado = await sincronizarProductosDesdeDux();
    console.log(`✅ Resultado: ${JSON.stringify(resultado, null, 2)}`);

    console.log('⏳ Ejecutando sincronizarPedidosDesdeDux...');
    const resultadoPedidos = await sincronizarPedidosDesdeDux();
    console.log(`✅ Pedidos sincronizados: ${resultadoPedidos.length}`);

    console.log('⏳ Ejecutando sincronizarFacturasDesdeDux...');
    const resFacturas = await sincronizarFacturasDesdeDux();
    console.log(`✅ Facturas: ${JSON.stringify(resFacturas, null, 2)}`);

    console.log('⏳ Ejecutando sincronizarPersonalDesdeDux...');
    const resPersonal = await sincronizarPersonalDesdeDux();
    console.log(`✅ Personal: ${JSON.stringify(resPersonal, null, 2)}`);   

  } catch (error) {
    console.error('❌ Error general en la sincronización:', error);
  } finally {
    await sequelize.close();
    console.log(`[${new Date().toISOString()}] 🔚 Finalizó sincronización.`);
  }
}

ejecutar();
