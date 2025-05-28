export interface ConversacionBot {
  id: number;
  telefono: string;
  mensajeCliente: string;
  respuestaBot: string;
  derivar: boolean;
  createdAt: string;
}

export interface FiltrosConversacionBot {
  page?: number;
  limit?: number;
  buscar?: string;
  derivar?: boolean;
}

export interface RespuestaConversaciones {
  data: ConversacionBot[];
  pagina: number;
  totalPaginas: number;
  totalItems: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export type ConversacionAgrupada = {
  telefono: string;
  historial: {
    mensajeCliente: string;
    respuestaBot: string;
    derivar: boolean;
    createdAt: string;
  }[];
};
