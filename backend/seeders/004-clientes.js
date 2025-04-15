import { Cliente } from '../models/index.js';

export const seedClientes = async () => {
  await Cliente.create({
    nombre: 'Juan Perez',
    telefono: '1144556677',
    email: 'juan@mail.com',
    direccion: 'Av. Corrientes 1234',
    provincia: 'Buenos Aires',
    localidad: 'CABA',
    cuit_cuil: '20-12345678-9',
    vendedorId: 1
  });
};
