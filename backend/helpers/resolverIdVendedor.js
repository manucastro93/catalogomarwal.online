import { PersonalDux } from '../models/index.js';
import { ROLES_USUARIOS } from '../constants/rolesUsuarios.js';

export async function resolverIdVendedor(req) {
  // Si el logueado es VENDEDOR → usar su propio id_personal
  if (req.usuario?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR) {
    if (!req.usuario.id) return null;
    const p = await PersonalDux.findOne({
      where: {
        id: req.usuario.personalDuxId
      }
    });
    return p?.id_personal ?? null;
  }
  
  // Si viene vendedorId por query (admin mirando otro vendedor)
  const vendedorIdQuery = req.query?.personalDuxId;
  if (vendedorIdQuery) {
    const id = Number(vendedorIdQuery);
    if (!Number.isNaN(id)) return id; // es id_personal directo
  }

  // Sin filtro de vendedor
  return null;
}