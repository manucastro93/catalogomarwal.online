import { Modulo, PermisosUsuario } from '../models/index.js';

/**
 * Verifica si un usuario tiene permiso para realizar una acción sobre un módulo.
 * @param {object} usuario - Objeto usuario logueado (debe tener rolUsuarioId).
 * @param {string} moduloNombre - Nombre del módulo (ej: 'Productos', 'Clientes').
 * @param {string} accion - Acción que se desea validar (ej: 'ver', 'crear', 'editar').
 * @returns {Promise<boolean>}
 */
export const tienePermiso = async (usuario, moduloNombre, accion) => {
  if (!usuario?.rolUsuarioId) return false;

  const modulo = await Modulo.findOne({
    where: { nombre: moduloNombre },
    attributes: ['id']
  });

  if (!modulo) return false;

  const permiso = await PermisosUsuario.findOne({
    where: {
      rolUsuarioId: usuario.rolUsuarioId,
      moduloId: modulo.id,
      accion: accion
    }
  });

  return permiso?.permitido === true;
};
