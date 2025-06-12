import api from './api';
import type { VendedorOption } from "@/types/vendedor";

export const obtenerPersonalDux = async (): Promise<VendedorOption[]> => {
  try {
    const response = await api.get('/personalDux');
    return response.data;
  } catch (error) {
    console.error('Error al obtener PersonalDux:', error);
    throw error;
  }
};
