import api from "./api";
import type { ResumenFinanzas, GastoCategoria, GastoProveedor, GastoDetalle } from "@/types/finanzas";

export const obtenerResumenFinanzas = (p:{anio:number, clienteId?:number}) =>
  api.get<ResumenFinanzas>("/finanzas/resumen-anual",{ params:p }).then(r=>r.data);

export const obtenerGastosPorCategoria = (anio:number) =>
  api.get<GastoCategoria[]>("/finanzas/gastos-por-categoria",{ params:{ anio } }).then(r=>r.data);

export const obtenerGastosProveedores = (anio:number, categoriaId:number) =>
  api.get<GastoProveedor[]>("/finanzas/gastos-proveedores",{ params:{ anio, categoriaId } }).then(r=>r.data);

export const obtenerGastosDetalle = (p: {
  anio: number;
  mes: number;            // 1..12
  categoriaId?: number;
  proveedorId?: number;
}) =>
  api.get<GastoDetalle[]>("/finanzas/gastos-detalle", { params: p }).then(r => r.data);