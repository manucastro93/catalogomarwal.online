import dotenv from 'dotenv';
dotenv.config();

import { sincronizarProductosDesdeDux } from './services/dux.service.js';
import { sequelize } from './config/database.js';

async function ejecutar() {
  console.log(`[${new Date().toISOString()}] 🚀 Iniciando sincronización...`);

  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');

    const resultado = await sincronizarProductosDesdeDux();
    console.log('✅ Resultado:', resultado);
  } catch (error) {
    console.error('❌ Error general en la sincronización:', error);
  } finally {
    await sequelize.close();
    console.log(`[${new Date().toISOString()}] 🔚 Finalizó sincronización.`);
  }
}

ejecutar();
