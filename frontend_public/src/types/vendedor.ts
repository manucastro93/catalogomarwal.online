export interface Vendedor {
    id: number;
    nombre: string;
    email: string;
    contraseña?: string;
    rol: 'vendedor';
    link?: string;
    telefono: string;
    createdAt: string;
    updatedAt: string;
  }
  