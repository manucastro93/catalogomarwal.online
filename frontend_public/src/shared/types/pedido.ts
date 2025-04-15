export interface PedidoClienteInput {
  nombre: string;
  telefono: string;
  email: string;
  direccion: string;
  razonSocial?: string;
  cuit_cuil?: string;
  provinciaId?: number;
  localidadId?: number;
  vendedorId?: number; // 👈 nuevo campo
}

export interface ItemCarritoInput {
  id: number; // productoId
  nombre: string;
  cantidad: number; // en bultos
  precio: number;   // precio por bulto
  precioPorBulto?: number;
  unidadPorBulto?: number;
}

export interface PedidoPayload {
  cliente: PedidoClienteInput;
  carrito: ItemCarritoInput[];
  usuarioId?: number | null;
}
