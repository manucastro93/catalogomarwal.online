import { seedUsuarios } from './001-usuarios.js';
import { seedCategorias } from './002-categorias.js';
import { seedProductos } from './003-productos.js';
import { seedClientes } from './004-clientes.js';
import { seedBanners } from './005-banners.js';
import { seedProvinciasLocalidades } from './006-provincias-localidades.js';
import sequelize from '../config/database.js';

const runSeeds = async () => {
  try {
    await sequelize.sync({ force: true });
    await seedUsuarios();
    await seedCategorias();
    await seedProductos();
    await seedClientes();
    await seedBanners();
    await seedProvinciasLocalidades();
    console.log('🌱 Seeds ejecutados correctamente');
    process.exit();
  } catch (err) {
    console.error('❌ Error al ejecutar seeds:', err);
    process.exit(1);
  }
};

runSeeds();
