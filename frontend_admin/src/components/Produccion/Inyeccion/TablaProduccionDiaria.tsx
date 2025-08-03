import { For } from "solid-js";
import type { ReporteProduccionInyeccionEncabezado } from "@/types/produccionInyeccion";
import { formatearFechaCorta } from "@/utils/formato";

interface Props {
  reportes: ReporteProduccionInyeccionEncabezado[];
  onEliminarReporte: (reporte: ReporteProduccionInyeccionEncabezado) => void;
  onOrdenar: (col: string) => void;
  orden: string;
  direccion: "asc" | "desc";
  onVerDetalle?: (reporte: ReporteProduccionInyeccionEncabezado) => void;
}

export default function TablaProduccionDiaria({
  reportes,
  onEliminarReporte,
  onOrdenar,
  orden,
  direccion,
  onVerDetalle,
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
            {th("Turno", "turno")}
            <th class="p-2">Usuario</th>
            <th class="p-2 text-right">Total Piezas</th>
            <th class="p-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <For each={reportes}>
            {(r) => (
              <tr class="border-t hover:bg-gray-50">
                <td class="p-2">{formatearFechaCorta(r.fecha)}</td>
                <td class="p-2 capitalize">{r.Usuario?.nombre ?? r.Usuario?.nombre}</td>
                <td class="p-2">{r.turno}</td>
                <td class="p-2 text-right">
                  {/* Suma total de piezas producidas en los detalles */}
                  {r.Detalles?.reduce((acc, item) => acc + (item.cantidad ?? 0), 0) ?? 0}
                </td>
                <td class="p-2 text-right flex gap-2 justify-end">
                  <button
                    onClick={() => onEliminarReporte(r)}
                    class="text-red-600 hover:underline text-sm"
                  >
                    Eliminar
                  </button>
                  {onVerDetalle && (
                    <button
                      onClick={() => onVerDetalle(r)}
                      class="text-blue-600 hover:underline text-sm"
                    >
                      Ver detalle
                    </button>
                  )}
                </td>
              </tr>
            )}
          </For>
        </tbody>
      </table>
      {/* Versión mobile */}
      <div class="md:hidden space-y-4">
        <For each={reportes}>
          {(r) => (
            <div class="border rounded-lg p-3 shadow-sm text-sm bg-white">
              <div>
                <strong>Fecha:</strong> {formatearFechaCorta(r.fecha)}
              </div>
              <div>
                <strong>Turno:</strong>{" "}
                <span class="capitalize">{r.turno}</span>
              </div>
              <div>
                <strong>Usuario:</strong> {r.Usuario?.nombre ?? r.Usuario?.nombre}
              </div>
              <div>
                <strong>Total piezas:</strong>{" "}
                {r.Detalles?.reduce((acc, item) => acc + (item.cantidad ?? 0), 0) ?? 0}
              </div>
              <div class="flex gap-2 mt-2 justify-end">
                <button
                  onClick={() => onEliminarReporte(r)}
                  class="text-red-600 hover:underline text-sm"
                >
                  Eliminar
                </button>
                {onVerDetalle && (
                  <button
                    onClick={() => onVerDetalle(r)}
                    class="text-blue-600 hover:underline text-sm"
                  >
                    Ver detalle
                  </button>
                )}
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
