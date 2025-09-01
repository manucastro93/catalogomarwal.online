// src/components/Estadisticas/TablaVentasProducto.tsx
import { For, Show } from "solid-js";
import { formatearPrecio, formatearMiles } from "@/utils/formato";

type Row = {
  productoId: number;
  codigo: string;
  descripcion: string;
  cant_mes_actual: number;
  monto_mes_actual: number;
  cant_mes_anterior: number;
  monto_mes_anterior: number;
  cant_3m: number;
  monto_3m: number;
  cant_12m: number;
  monto_12m: number;
};

export default function TablaVentasProducto(props: {
  rows: Row[];
  orden: string;
  direccion: "ASC" | "DESC";
  onOrdenar: (col: string) => void;
  modo: "cantidad" | "monto"; // 👈 nuevo
}) {
  const Th = (k: string, label: string) => (
    <th class="px-3 py-2 text-left cursor-pointer select-none" onClick={() => props.onOrdenar(k)}>
      {label}{props.orden === k ? (props.direccion === "ASC" ? " ▲" : " ▼") : ""}
    </th>
  );
  const CellMonto = (v: number) => <span>{formatearPrecio(v || 0)}</span>;

  const promMensual = (r: Row) =>
    props.modo === "cantidad" ? (r.cant_12m || 0) / 12 : (r.monto_12m || 0) / 12;

  const ordenarPromedio = () => props.onOrdenar(props.modo === "cantidad" ? "cant_12m" : "monto_12m");

return (
    <div class="overflow-x-auto border rounded">
      <table class="min-w-[920px] w-full text-sm">
        <thead class="bg-gray-50">
          <tr>
            {Th("codigo","Código")}
            {Th("descripcion","Descripción")}

            {/* Promedio mensual (12m) */}
            <th
              class="px-3 py-2 text-left cursor-pointer select-none"
              onClick={ordenarPromedio}
              title="Promedio mensual calculado sobre 12 meses"
            >
              Prom. mensual {props.modo === "cantidad" ? "(cant.)" : "($)"} {/* indicador */}
            </th>

            {/* Bloques variables */}
            {props.modo === "cantidad" ? (
              <>
                {Th("cant_mes_actual","Cant. Mes actual")}
                {Th("cant_mes_anterior","Cant. Últ. mes")}
                {Th("cant_3m","Cant. 3m")}
                {Th("cant_12m","Cant. 12m")}
              </>
            ) : (
              <>
                {Th("monto_mes_actual","$ Mes actual")}
                {Th("monto_mes_anterior","$ Últ. mes")}
                {Th("monto_3m","$ 3m")}
                {Th("monto_12m","$ 12m")}
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {props.rows.map((r) => (
            <tr class="border-t hover:bg-gray-50">
              <td class="px-3 py-2 font-mono">{r.codigo}</td>
              <td class="px-3 py-2">{r.descripcion}</td>

              {/* celda de promedio mensual */}
              <td class="px-3 py-2">
                {props.modo === "cantidad" ? formatearMiles(Math.round(promMensual(r))) : CellMonto(promMensual(r))}
              </td>

              {props.modo === "cantidad" ? (
                <>
                  <td class="px-3 py-2">{formatearMiles(r.cant_mes_actual)}</td>
                  <td class="px-3 py-2">{formatearMiles(r.cant_mes_anterior)}</td>
                  <td class="px-3 py-2">{formatearMiles(r.cant_3m)}</td>
                  <td class="px-3 py-2">{formatearMiles(r.cant_12m)}</td>
                </>
              ) : (
                <>
                  <td class="px-3 py-2">{CellMonto(r.monto_mes_actual)}</td>
                  <td class="px-3 py-2">{CellMonto(r.monto_mes_anterior)}</td>
                  <td class="px-3 py-2">{CellMonto(r.monto_3m)}</td>
                  <td class="px-3 py-2">{CellMonto(r.monto_12m)}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
