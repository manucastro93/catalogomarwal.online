import { Usuario } from '../models/index.js';

export const esAdminOSupremo = async (req, res, next) => {
  try {
    const usuarioId = req.usuario.id; // Asumiendo que tienes el id del usuario desde el token
    const usuario = await Usuario.findByPk(usuarioId);

    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar si el usuario es 'admin' o 'supremo'
    if (usuario.rol === 'admin' || usuario.rol === 'supremo') {
      return next(); // Si es admin o supremo, pasa al siguiente middleware
    }

    // Si no tiene el rol adecuado
    return res.status(403).json({ message: 'No tienes permisos para realizar esta acción' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Error al verificar el rol del usuario' });
  }
};
