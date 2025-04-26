import { Usuario, PermisosUsuario, Modulo, RolUsuario } from '../models/index.js';

export const checkPermiso = (moduloManual = null, accion) => {
  return async (req, res, next) => {
    try {
      const usuario = req.usuario;
      if (!usuario) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      let nombreModulo = moduloManual || req.body?.modulo || null;

      // 🔥 Intentar deducir el módulo automáticamente
      if (!nombreModulo) {
        let rolUsuarioId = null;

        // Primero si viene en el body (crear o editar)
        if (req.body?.rolUsuarioId) {
          rolUsuarioId = req.body.rolUsuarioId;
        } 
        // Si no, intentar buscarlo por ID de usuario en params (eliminar)
        else if (req.params?.id) {
          const usuarioTarget = await Usuario.findByPk(req.params.id);
          if (!usuarioTarget) return res.status(404).json({ message: 'Usuario no encontrado' });
          rolUsuarioId = usuarioTarget.rolUsuarioId;
        }

        // Buscar el módulo asociado al rol
        if (rolUsuarioId) {
          const rol = await RolUsuario.findByPk(rolUsuarioId);
          if (!rol) return res.status(400).json({ message: 'Rol de usuario inválido' });

          const modulo = await Modulo.findOne({ where: { nombre: rol.nombre } });
          if (modulo) {
            nombreModulo = modulo.nombre;
          }
        }
      }

      console.log('✅ Módulo inferido para permiso:', nombreModulo);

      if (!nombreModulo) {
        return res.status(400).json({ message: 'No se pudo determinar el módulo para validar permisos' });
      }

      // ✅ Verificar si tiene permiso
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
