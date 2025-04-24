import api from './api';

export const obtenerVendedorPorLink = async (link: string) => {
  const res = await api.get(`/usuarios/vendedores/vendedor-por-link/${link}`);
  return res.data;
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
