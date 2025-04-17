import api from './api'; // Asegúrate de que esta ruta sea correcta
import { Vendedor } from '../shared/types/vendedor'; // Asegúrate de que la ruta sea correcta

// Obtener todos los vendedores
export const obtenerVendedores = async (): Promise<Vendedor[]> => {
  try {
    const response = await api.get('/usuarios/vendedores');
    return response.data.filter((u: Vendedor) => u.rol === 'vendedor');
  } catch (error) {
    console.error('Error al obtener los vendedores', error);
    throw error;
  }
};

// Agregar un nuevo vendedor
export const agregarVendedor = async (
  vendedor: Partial<Omit<Vendedor, 'id'>>
): Promise<Vendedor> => {
  try {
    const response = await api.post('/usuarios/vendedores', vendedor);
    return response.data;
  } catch (error) {
    console.error('Error al agregar el vendedor', error);
    throw error;
  }
};
// Editar un vendedor
export const editarVendedor = async (vendedorId: string,datos: Partial<Omit<Vendedor, 'id'>>): Promise<Vendedor> => {
  try {
    const response = await api.put(`/usuarios/vendedores/${vendedorId}`, datos);
    return response.data;
  } catch (error) {
    console.error('Error al editar el vendedor', error);
    throw error;
  }
};

// Eliminar un vendedor
export const eliminarVendedor = async (vendedorId: string): Promise<void> => {
  try {
    await api.delete(`/usuarios/vendedores/${vendedorId}`);
  } catch (error) {
    console.error('Error al eliminar el vendedor', error);
    throw error;
  }
};
