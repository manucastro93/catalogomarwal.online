import { Usuario, PermisosUsuario, Modulo, RolUsuario } from '@/models';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res, next) => {
  try {
    const { email, contraseña } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });

    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Validar contraseña solo si tiene definida
    if (usuario.contraseña) {
      const coincide = await bcrypt.compare(contraseña, usuario.contraseña);
      if (!coincide) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
    }

    // Obtener permisos del rol
    const permisos = await PermisosUsuario.findAll({
      where: { rolUsuarioId: usuario.rolUsuarioId, permitido: true },
      include: [{ model: Modulo, as: 'modulo', attributes: ['nombre'] },
                { model: RolUsuario, as: 'rolUsuario', attributes: ['nombre']   
                }]
    });

    // Transformar permisos a formato plano para el frontend
    const permisosPlano = permisos.map(p => ({
      modulo: p.modulo?.nombre || '',
      accion: p.accion,
      permitido: p.permitido
    }));

    // Crear token
    const token = jwt.sign(
      {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rolUsuarioId: usuario.rolUsuarioId
      },
      process.env.JWT_SECRET,
      { expiresIn: '10000h' }
    );

    const usuarioLimpio = { ...usuario.toJSON(), permisos: permisosPlano };
    delete usuarioLimpio.contraseña;

    res.json({
      token,
      usuario: usuarioLimpio,
      requiereContraseña: !usuario.contraseña
    });
  } catch (error) {
    next(error);
  }
};
