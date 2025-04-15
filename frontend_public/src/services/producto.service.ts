const API_URL = import.meta.env.VITE_BACKEND_URL;

export const obtenerProductos = async () => {
  const res = await fetch(`${API_URL}/productos`);
  if (!res.ok) throw new Error('Error al obtener productos');
  return res.json();
};

export const obtenerCategorias = async () => {
  const res = await fetch(`${API_URL}/categorias`);
  if (!res.ok) throw new Error('Error al obtener categorías');
  return res.json();
};

export const obtenerProductoPorId = async (id: number) => {
  const res = await fetch(`${API_URL}/productos/${id}`);
  if (!res.ok) throw new Error('Error al obtener el producto');
  return res.json();
};