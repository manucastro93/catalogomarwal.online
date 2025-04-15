import { Categoria } from '../models/index.js';

export const seedCategorias = async () => {
  await Categoria.bulkCreate([
    { nombre: 'Ofertas', orden: 1 },
    { nombre: 'Novedades', orden: 2 },
    { nombre: 'Cristalería', orden: 3 },
  ]);
};
