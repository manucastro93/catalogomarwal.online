import { sincronizarProductosDesdeDux } from '../services/dux.service.js';

export async function syncProductosDux(req, res) {
  try {
    const resultado = await sincronizarProductosDesdeDux();

    if (resultado.ok) {
      return res.status(200).json({ mensaje: resultado.mensaje });
    } else {
      return res.status(500).json({ mensaje: resultado.mensaje, error: resultado.error });
    }
  } catch (error) {
    console.error('Error en syncProductosDux:', error);
    return res.status(500).json({ mensaje: 'Error inesperado en la sincronización', error });
  }
}
