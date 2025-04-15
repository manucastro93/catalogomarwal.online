import { sequelize, Usuario } from '../models/index.js';

try {
  await sequelize.sync(); // por las dudas
  const user = await Usuario.create({
    nombre: 'Test',
    email: 'test@example.com',
    contraseña: '123456',
    rol: 'supremo',
  });

  console.log('✅ Usuario de prueba creado:', user.toJSON());
  process.exit();
} catch (err) {
  console.error('❌ Error creando usuario:', err);
  process.exit(1);
}
