export interface Notificacion {
    id: number;
    titulo: string;
    mensaje: string;
    leida: boolean;
    tipo: string;
    createdAt: string;
    usuarioId?: number;
  }
  