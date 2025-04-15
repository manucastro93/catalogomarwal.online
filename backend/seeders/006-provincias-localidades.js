import { Provincia, Localidad } from '../models/index.js';

export const seedProvinciasLocalidades = async () => {
  const prov = await Provincia.create({ nombre: 'Buenos Aires' });

  await Localidad.bulkCreate([
    { nombre: 'CABA', provinciaId: prov.id },
    { nombre: 'La Plata', provinciaId: prov.id },
    { nombre: 'San Isidro', provinciaId: prov.id }
  ]);
};
