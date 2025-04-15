import bcrypt from 'bcryptjs';
import { Usuario } from '../models/index.js';

export const seedUsuarios = async () => {
  const hash = await bcrypt.hash('admin123', 10);

  await Usuario.create({
    nombre: 'Usuario Supremo',
    email: 'supremo@admin.com',
    contraseña: hash,
    rol: 'supremo',
  });
};
