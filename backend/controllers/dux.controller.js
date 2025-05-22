import { sincronizarProductosDesdeDux } from '../services/dux.service.js';
import { estadoSync } from '../state/estadoSync.js';

export const sincronizarDesdeDuxController = async (req, res) => {
  try {
    const resultado = await sincronizarProductosDesdeDux();
    res.status(200).json({ ok: true, ...resultado });
  } catch (error) {
    console.error('❌ Error al sincronizar productos desde Dux:', error);
    res.status(500).json({ ok: false, mensaje: error.message });
  }
};

export const getProgresoSync = (req, res) => {
  try {
    console.log('➡️ Progreso actual:', estadoSync.porcentaje);
    res.json({ porcentaje: estadoSync.porcentaje });
  } catch (error) {
    console.error('❌ Error al obtener progreso:', error);
    res.status(500).json({ porcentaje: 0 });
  }
};
