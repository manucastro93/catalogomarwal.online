import { ROLES_USUARIOS } from "../constants/rolesUsuarios";

export function deberiaMostrarGrafico(
  tipo: "planta" | "categoria" | "turno",
  filtros: { plantaId: string; categoriaId: string; turno: string; producto?: string }
) {
  if (tipo === "planta" && filtros.plantaId !== "") return false;
  if (tipo === "categoria" && filtros.categoriaId !== "") return false;
  if (tipo === "categoria" && filtros.producto !== "") return false;
  if (tipo === "turno" && filtros.turno !== "") return false;
  return true;
}


export function totalizar(items: { totalCantidad: number; totalValor: number; totalCostoMP: number }[], rolUsuarioId: number, modo: string) {
  if (rolUsuarioId === ROLES_USUARIOS.OPERARIO) {
    return items.reduce((acc, item) => acc + (item.totalCantidad || 0), 0);
  }

  if (modo === "valor") {
    return items.reduce((acc, item) => acc + (item.totalValor || 0), 0);
  }

  if (modo === "costo") {
    return items.reduce((acc, item) => acc + (item.totalCostoMP || 0), 0);
  }

  return 0;
}
