const API_URL = import.meta.env.VITE_BACKEND_URL;

export const obtenerProvincias = async () => {
  const res = await fetch(`${API_URL}/public/provincias`);
  if (!res.ok) throw new Error('Error al obtener provincias');
  return res.json();
};

export const obtenerLocalidades = async (provinciaId: number) => {
  if (!provinciaId) return [];
  const res = await fetch(`${API_URL}/public/localidades?provinciaId=${provinciaId}`);
  if (!res.ok) throw new Error('Error al obtener localidades');
  return res.json();
};

export const buscarLocalidades = async (texto: string, provinciaId: number) => {
  if (!texto || !provinciaId) return [];
  const res = await fetch(`${API_URL}/public/localidades?q=${texto}&provinciaId=${provinciaId}`);
  if (!res.ok) throw new Error('Error al buscar localidades');
  return res.json();
};