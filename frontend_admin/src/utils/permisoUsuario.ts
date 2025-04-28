import type { PermisoUsuario } from '@/types/permisoUsuario';

export function tienePermiso(
  permisos: PermisoUsuario[] = [],
  modulo: string,
  accion: string
): boolean {
  return permisos.some(
    (p) =>
      p.modulo.toLowerCase() === modulo.toLowerCase() &&
      p.accion.toLowerCase() === accion.toLowerCase() &&
      p.permitido
  );
}
