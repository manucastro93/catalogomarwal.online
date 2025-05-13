import { useAuth } from '@/store/auth';
import type { PermisoUsuario } from '@/types/permisoUsuario';

export function tienePermiso(
  permisos: PermisoUsuario[] = [],
  modulo: string,
  accion: string
): boolean {
  const { usuario } = useAuth();
  console.log("usuariio: ", usuario())
  if (usuario()?.rolUsuarioId === 1) {
    return true; // SUPREMO
  }

  const moduloLower = modulo.toLowerCase();
  const accionLower = accion.toLowerCase();

  for (const p of permisos) {
    console.log("permiso: ", p);
    const nombreModulo = p?.modulo?.nombre?.toLowerCase?.();
    const nombreAccion = p?.accion?.toLowerCase?.();
    console.log("nombreModulo: ", nombreModulo, "accion: ", nombreAccion);

    if (!nombreModulo || !nombreAccion) continue;

    if (nombreModulo === 'supremo') {
      return true;
    }

    if (
      nombreModulo === moduloLower &&
      nombreAccion === accionLower &&
      p.permitido
    ) {
      return true;
    }
  }

  return false;
}
