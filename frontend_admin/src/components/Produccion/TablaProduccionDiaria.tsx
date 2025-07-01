import { For } from "solid-js";
import type { ReporteProduccionEncabezado } from "@/types/produccion";
import { formatearPrecio } from "@/utils/formato";

interface Props {
  reportes: ReporteProduccionEncabezado[];
  onEliminarReporte: (reporte: ReporteProduccionEncabezado) => void;
  onOrdenar: (col: string) => void;
  orden: string;
  direccion: "asc" | "desc";
  onVerDetalle?: (reporte: ReporteProduccionEncabezado) => void;
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
            {th("Planta", "planta.nombre")}
            <th class="p-2">Usuario</th>
            <th class="p-2 text-right">Total ($)</th>
            <th class="p-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <For each={reportes}>
            {(r) => (
              <tr class="border-t hover:bg-gray-50">
                <td class="p-2">{new Date(r.fecha).toLocaleDateString()}</td>
                <td class="p-2 capitalize">{r.turno}</td>
                <td class="p-2">{r.planta?.nombre ?? r.plantaId}</td>
                <td class="p-2">{r.usuario?.nombre}</td>
                <td class="p-2 text-right">
                  {formatearPrecio(
                    r.productos?.reduce(
                      (acc, item) =>
                        acc +
                        (item.cantidad && item.producto?.costoDux
                          ? item.cantidad * item.producto.costoDux
                          : 0),
                      0
                    ) ?? 0
                  )}
                </td>
                <td class="p-2 text-right flex gap-2 justify-end">

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
      {/* Versión mobile (opcional, adaptala igual que la desktop) */}
      <div class="md:hidden space-y-4">
        <For each={reportes}>
          {(r) => (
            <div class="border rounded-lg p-3 shadow-sm text-sm bg-white">
              <div>
                <strong>Fecha:</strong> {new Date(r.fecha).toLocaleDateString()}
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
                  r.productos?.reduce(
                    (acc, item) =>
                      acc +
                      (item.cantidad && item.producto?.costoDux
                        ? item.cantidad * item.producto.costoDux
                        : 0),
                    0
                  ) ?? 0
                )}
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
