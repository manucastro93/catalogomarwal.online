import { Producto } from '../models/index.js';

export const seedProductos = async () => {
  await Producto.bulkCreate([
    {
      sku: 'P001',
      nombre: 'Vaso Decorado',
      descripcion: 'Ideal para bebidas frías',
      precioUnitario: 120,
      stock: 100,
      categoriaId: 1
    },
    {
      sku: 'P002',
      nombre: 'Plato de Vidrio',
      descripcion: 'Plato resistente y elegante',
      precioUnitario: 300,
      stock: 50,
      categoriaId: 3
    }
  ]);
};
