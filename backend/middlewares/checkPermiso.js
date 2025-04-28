import { Usuario, PermisosUsuario, Modulo, RolUsuario } from '../models/index.js';

export const checkPermiso = (moduloManual = null, accion) => {
  return async (req, res, next) => {
    try {
      const usuario = req.usuario;
      if (!usuario) {
        return res.status(401).json({ message: 'No autenticado' });
      }
      if (usuario.rolUsuarioId === 1) {
        return next();
      }

      // Primero determinar el módulo
      let nombreModulo = moduloManual || req.query?.modulo || req.body?.modulo || null;

      if (!nombreModulo) {
        let rolUsuarioId = null;

        if (req.body?.rolUsuarioId) {
          rolUsuarioId = req.body.rolUsuarioId;
        } else if (req.params?.id) {
          // Primero intentamos como módulo
          const moduloTarget = await Modulo.findByPk(req.params.id);
          if (moduloTarget) {
            nombreModulo = moduloTarget.nombre;
          } else {
            // Si no, como usuario
            const usuarioTarget = await Usuario.findByPk(req.params.id);
            if (!usuarioTarget) {
              return res.status(404).json({ message: 'Usuario o módulo no encontrado' });
            }
            rolUsuarioId = usuarioTarget.rolUsuarioId;
          }
        }

        if (rolUsuarioId && !nombreModulo) {
          const rol = await RolUsuario.findByPk(rolUsuarioId);
          if (!rol) return res.status(400).json({ message: 'Rol de usuario inválido' });

          const modulo = await Modulo.findOne({ where: { nombre: rol.nombre } });
          if (modulo) {
            nombreModulo = modulo.nombre;
          }
        }
      }

      if (!nombreModulo) {
        return res.status(400).json({ message: 'No se pudo determinar el módulo para validar permisos' });
      }
      
      // Luego validar permisos
      const tienePermiso = await PermisosUsuario.findOne({
        where: {
          rolUsuarioId: usuario.rolUsuarioId,
          permitido: true,
          accion
        },
        include: {
          model: Modulo,
          as: 'modulo',
          where: { nombre: nombreModulo }
        }
      });

      if (!tienePermiso) {
        return res.status(403).json({ message: 'No tenés permiso para realizar esta acción' });
      }

      next();
    } catch (error) {
      console.error('Error en checkPermiso:', error);
      return res.status(500).json({ message: 'Error interno al validar permisos' });
    }
  };
};
