import axios from 'axios';
import type { LogCliente } from '../types/log';

export async function obtenerLogsCliente(clienteId: number): Promise<LogCliente[]> {
  const { data } = await axios.get('/logs-cliente', {
    params: { clienteId },
  });
  return data.data;
}
export async function obtenerLogsGenerales(params: any) {
    const { data } = await axios.get('/logs-cliente', { params });
    return data;
  }