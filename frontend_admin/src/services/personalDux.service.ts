import api from './api';
import type { PersonalDux } from "@/types/usuario";

export const obtenerPersonalDux = async (): Promise<PersonalDux[]> => {
  try {
    const response = await api.get('/personalDux');
    return response.data;
  } catch (error) {
    console.error('Error al obtener PersonalDux:', error);
    throw error;
  }
};
