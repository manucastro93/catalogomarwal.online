import axios from 'axios';
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

let cacheDux = null;
let cacheTimestamp = 0;

export const obtenerPedidosDux = async (req, res) => {
  const ahora = Date.now();
  const TTL = 5000;

  if (cacheDux && ahora - cacheTimestamp < TTL) {
    return res.json(cacheDux);
  }

  try {
    const response = await axios.get('https://erp.duxsoftware.com.ar/WSERP/rest/services/pedidos', {
      headers: {
        accept: 'application/json',
        authorization: process.env.DUX_API_KEY,
      },
      params: {
        idEmpresa: 5627,
        idSucursal: 1,
        fechaDesde: '2020-01-01',
        fechaHasta: '2025-11-30',
      },
    });

    const dataConTipo = response.data.results.map(p => ({
      ...p,
      tipo: 'dux',
    }));

    cacheDux = { data: dataConTipo };
    cacheTimestamp = ahora;

    return res.json(cacheDux);
  } catch (error) {
    console.error('❌ Error al obtener pedidos Dux:', error.message);
    return res.status(500).json({ error: 'Error al obtener pedidos Dux' });
  }
};
