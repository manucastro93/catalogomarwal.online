import dotenv from 'dotenv';
dotenv.config();

import sequelize from './config/database.js';
import { sincronizarProductosDesdeDux } from './services/dux.service.js';

async function ejecutar() {
  console.log(`[${new Date().toISOString()}] 🚀 Iniciando sincronización...`);

  try {

    const resultado = await sincronizarProductosDesdeDux();
    console.log(`✅ Resultado: ${JSON.stringify(resultado, null, 2)}`);

  } catch (error) {
    console.error('❌ Error general en la sincronización:', error);
  } finally {
    await sequelize.close();
    console.log(`[${new Date().toISOString()}] 🔚 Finalizó sincronización.`);
  }
}

ejecutar();
