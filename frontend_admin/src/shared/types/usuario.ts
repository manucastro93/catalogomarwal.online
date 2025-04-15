export interface Usuario {
    id: number;
    nombre: string;
    email: string;
    contraseña?: string;
    rol: 'supremo' | 'administrador' | 'vendedor';
    link?: string;
    telefono: string;
    createdAt: string;
    updatedAt: string;
  }
  