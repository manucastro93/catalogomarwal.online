import { useAuth } from '@/store/auth';
import type { PermisoUsuario } from '@/types/permisoUsuario';

export function tienePermiso(
  permisos: PermisoUsuario[] = [],
  modulo: string,
  accion: string
): boolean {
  const { usuario } = useAuth();

  if (usuario()?.rolUsuarioId === 1) { // SUPREMO
    return true;
  }

  const moduloLower = modulo.toLowerCase();
  const accionLower = accion.toLowerCase();

  for (const p of permisos) {
    if (p.modulo.nombre === 'supremo') {
      return true;
    }
    if (
      p.modulo.nombre.toLowerCase() === moduloLower &&
      p.accion.toLowerCase() === accionLower &&
      p.permitido
    ) {
      return true;
    }
  }
  
  return false;
}
