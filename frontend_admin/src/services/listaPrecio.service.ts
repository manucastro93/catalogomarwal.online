import api from './api';

export async function obtenerListasPrecio() {
  const res = await api.get('/listas-precio');
  return res.data;
}
