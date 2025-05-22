/*import cron from 'node-cron';
import { sincronizarProductosDesdeDux } from '../services/dux.service.js';

// Ejecutar todos los días a las 12:00 y 18:00
cron.schedule('0 12,18 * * *', async () => {
  console.log('[CRON] Sincronizando productos desde Dux...');
  const resultado = await sincronizarProductosDesdeDux();
  if (resultado.ok) {
    console.log('[CRON] Sincronización exitosa:', resultado.mensaje);
  } else {
    console.error('[CRON] Error en sincronización:', resultado.mensaje || resultado.error);
  }
});*/
