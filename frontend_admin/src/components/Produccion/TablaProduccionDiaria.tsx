import { For } from "solid-js";
import type { ReporteProduccion } from "@/types/produccion";
import { formatearPrecio } from "@/utils/formato";

interface Props {
  reportes: ReporteProduccion[];
  onEliminar: (reporte: ReporteProduccion) => void;
  onOrdenar: (col: string) => void;
  orden: string;
  direccion: "asc" | "desc";
}

export default function TablaProduccionDiaria({
  reportes,
  onEliminar,
  onOrdenar,
  orden,
  direccion,
}: Props) {
  const th = (label: string, col: string) => (
    <th class="p-2 cursor-pointer select-none" onClick={() => onOrdenar(col)}>
      {label} {orden === col ? (direccion === "asc" ? "▲" : "▼") : null}
    </th>
  );

  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse hidden md:table">
        <thead class="bg-gray-100 sticky top-0">
          <tr>
            {th("Fecha", "fecha")}
            {th("SKU", "producto.sku")}
            {th("Producto", "producto.nombre")}
            <th class="p-2">CostoMP</th>
            <th class="p-2">Cantidad</th>
            <th class="p-2">Turno</th>
            <th class="p-2">Planta</th>
            <th class="p-2">Total</th>
            <th class="p-2">Cargado por</th>
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
                <td class="p-2">
                  {formatearPrecio(
                    (r.producto?.precioUnitario ?? 0) * (r.cantidad ?? 0)
                  )}
                </td>
                <td class="p-2">{r.usuario?.nombre}</td>
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

      {/* Tabla MOBILE */}
      <div class="md:hidden space-y-4">
        <For each={reportes}>
          {(r) => (
            <div class="border rounded-lg p-3 shadow-sm text-sm bg-white">
              <div>
                <strong>Fecha:</strong> {new Date(r.fecha).toLocaleDateString()}
              </div>
              <div>
                <strong>SKU:</strong> {r.producto?.sku}
              </div>
              <div>
                <strong>Producto:</strong> {r.producto?.nombre}
              </div>
              <div>
                <strong>CostoMP:</strong> {formatearPrecio(r.producto?.costoMP)}
              </div>
              <div>
                <strong>Cantidad:</strong> {r.cantidad}
              </div>
              <div>
                <strong>Turno:</strong>{" "}
                <span class="capitalize">{r.turno}</span>
              </div>
              <div>
                <strong>Planta:</strong> {r.planta?.nombre ?? r.plantaId}
              </div>
              <div>
                <strong>Usuario:</strong> {r.usuario?.nombre}
              </div>
              <div>
                <strong>Total:</strong>{" "}
                {formatearPrecio(
                  (r.producto?.precioUnitario ?? 0) * (r.cantidad ?? 0)
                )}
              </div>
              <div class="text-right mt-2">
                <button
                  onClick={() => onEliminar(r)}
                  class="text-red-600 hover:underline text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
