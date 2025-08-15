import jwt from 'jsonwebtoken';
import { Usuario, PermisosUsuario, Modulo } from '../models/index.js';
import PersonalDux from '../models/PersonalDux.js';

export const verificarToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token no proporcionado' });
  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscamos el usuario en la base
    const usuario = await Usuario.findByPk(decoded.id);

    if (!usuario) return res.status(401).json({ message: 'Usuario no encontrado' });

    // Buscamos sus permisos
    const permisos = await PermisosUsuario.findAll({
      where: { rolUsuarioId: usuario.rolUsuarioId, permitido: true },
      include: [{ model: Modulo, as: 'modulo', attributes: ['nombre'] }]
    });
    // Formateamos los permisos como el login
    const permisosPlano = permisos.map(p => ({
      modulo: p.modulo?.nombre || '',
      accion: p.accion,
      permitido: p.permitido
    }));

    // Ahora sí, armamos req.usuario
    req.usuario = {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rolUsuarioId: usuario.rolUsuarioId,
      personalDuxId: usuario.personalDuxId,
      permisos: permisosPlano
    };
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('Token vencido:', error.expiredAt);
      return res.status(401).json({ message: 'Token vencido' });
    }
    console.error('Error al verificar token:', error);
    return res.status(401).json({ message: 'Token inválido' });
  }
};
