import { For } from "solid-js";
import type { ReporteProduccion } from "../../types/produccion";
import { formatearPrecio } from "../../utils/formato";

interface Props {
  reportes: ReporteProduccion[];
  onEliminar: (reporte: ReporteProduccion) => void;
  onOrdenar: (col: string) => void;
  orden: string;
  direccion: "asc" | "desc";
}

export default function TablaProduccionDiaria({ reportes, onEliminar, onOrdenar, orden, direccion }: Props) {
  const th = (label: string, col: string) => (
    <th
      class="p-2 cursor-pointer select-none"
      onClick={() => onOrdenar(col)}
    >
      {label} {orden === col ? (direccion === "asc" ? "▲" : "▼") : null}
    </th>
  );

  return (
    <div class="overflow-x-auto bg-white shadow rounded">
      <table class="min-w-full text-sm text-left">
        <thead class="bg-gray-200">
          <tr>
            {th("Fecha", "createdAt")}
            {th("SKU", "producto.sku")}
            {th("Producto", "producto.nombre")}
            <th class="p-2">CostoMP</th>
            <th class="p-2">Cantidad</th>
            <th class="p-2">Turno</th>
            <th class="p-2">Planta</th>
            <th class="p-2">Cargado por</th>
            <th class="p-2">Total</th>
            <th class="p-2">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <For each={reportes}>
            {(r) => (
              <tr class="border-t hover:bg-gray-50">
                <td class="p-2">{new Date(r.fecha).toLocaleDateString()}</td>
                <td class="p-2">{r.producto?.sku}</td>
                <td class="p-2">{r.producto?.nombre}</td>
                <td class="p-2">{formatearPrecio(r.producto?.costoMP)}</td>
                <td class="p-2">{r.cantidad}</td>
                <td class="p-2 capitalize">{r.turno}</td>
                <td class="p-2">{r.planta?.nombre ?? r.plantaId}</td>
                <td class="p-2">{r.usuario?.nombre}</td>
                <td class="p-2">{formatearPrecio((r.producto?.precioUnitario ?? 0) * (r.cantidad ?? 0))}</td>
                <td class="p-2 text-right">
                  <button
                    onClick={() => onEliminar(r)}
                    class="text-red-600 hover:underline text-sm"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
    </div>
  );
}
