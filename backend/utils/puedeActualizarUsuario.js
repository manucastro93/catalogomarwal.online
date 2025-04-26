import { ROLES_USUARIOS } from '../constants/rolesUsuarios.js';

export const puedeActualizarUsuario = ({ usuarioLogueado, usuarioObjetivo, bodyUpdate }) => {
    const esMismoUsuario = usuarioLogueado.id === usuarioObjetivo.id;
  
    const actualizaSoloContrasena =
      Object.keys(bodyUpdate).length === 1 && 'contraseña' in bodyUpdate;
  
    const esAdmin = [ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR].includes(usuarioLogueado.rolUsuarioId);
  
    if (esAdmin) return true;
  
    if (esMismoUsuario && actualizaSoloContrasena) return true;
  
    return false;
  };
  