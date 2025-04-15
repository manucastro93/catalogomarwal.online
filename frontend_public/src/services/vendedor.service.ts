const API_URL = import.meta.env.VITE_BACKEND_URL ;

export const obtenerVendedorPorLink = async (link: string) => {
  const res = await fetch(`${API_URL}/usuarios/vendedores/vendedor-por-link/${link}`);
  if (!res.ok) throw new Error('No se encontró el vendedor');
  return res.json();
};

export const guardarVendedorEnLocalStorage = (vendedor: any) => {
  localStorage.setItem('vendedor', JSON.stringify(vendedor));
};

export const obtenerVendedorGuardado = (): any | null => {
  const data = localStorage.getItem('vendedor');
  return data ? JSON.parse(data) : null;
};

export const borrarVendedor = () => {
  localStorage.removeItem('vendedor');
};
