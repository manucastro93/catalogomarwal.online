const API_URL = import.meta.env.VITE_BACKEND_URL;

export const obtenerProductos = async (params: Record<string, any> = {}) => {
  Object.keys(params).forEach((key) => {
    if (params[key] === undefined) delete params[key];
  });
  
  const queryString = new URLSearchParams(params).toString();
  const res = await fetch(`${API_URL}/public/productos?${queryString}`);
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json(); // { data, pagina, totalPaginas }
};


export const obtenerCategorias = async () => {
  const res = await fetch(`${API_URL}/public/categorias`);
  if (!res.ok) throw new Error('Error al obtener categorías');
  return res.json();
};

export const obtenerProductoPorId = async (id: number) => {
  const res = await fetch(`${API_URL}/productos/${id}`);
  if (!res.ok) throw new Error('Error al obtener el producto');
  return res.json();
};
