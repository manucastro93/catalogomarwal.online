import api from './api';

export const obtenerProductos = async (params: Record<string, any> = {}) => {
  Object.keys(params).forEach((key) => {
    if (params[key] === undefined) delete params[key];
  });

  const res = await api.get('/productos', { params });
  return res.data; // { data, pagina, totalPaginas }
};

export const obtenerProductoPorId = async (id: number) => {
  const res = await api.get(`/productos/${id}`);
  return res.data;
};

export const obtenerCategorias = async () => {
  const res = await api.get('/categorias');
  return res.data;
};

export const registrarVistaProducto = async (productoId: number) => {
  try {
    await api.post('/logs', {
      busqueda: `detalle:${productoId}`,
      tiempoEnPantalla: 0,
    });
  } catch (err) {
    console.warn("❌ No se pudo registrar vista de producto:", err);
  }
};
