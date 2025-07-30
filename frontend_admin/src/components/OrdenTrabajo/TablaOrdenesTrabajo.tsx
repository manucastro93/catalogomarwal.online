import { For } from "solid-js";
import type { OrdenTrabajo } from "@/types/ordenTrabajo";
import { formatearPrecio, formatearFechaCorta } from "@/utils/formato";

interface Props {
  ordenes: OrdenTrabajo[];
  onEliminarOT: (ot: OrdenTrabajo) => void;
  onOrdenar: (col: string) => void;
  orden: string;
  direccion: "asc" | "desc";
  onVerDetalle?: (ot: OrdenTrabajo) => void;
}

export default function TablaOrdenesTrabajo({
  ordenes,
  onEliminarOT,
  onOrdenar,
  orden,
  direccion,
  onVerDetalle,
}: Props) {
  const th = (label: string, col: string) => (
    <th class="p-2 cursor-pointer select-none" onClick={() => onOrdenar(col)}>
      {label} {orden === col ? (direccion === "desc" ? "▲" : "▼") : null}
    </th>
  );

  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse hidden md:table">
        <thead class="bg-gray-100 sticky top-0">
          <tr>
            {th("Número", "id")}
            {th("Fecha", "fecha")}
            {th("Turno", "turno")}
            {th("Planta", "planta.nombre")}
            <th class="p-2">Usuario</th>
            <th class="p-2 text-right">Total ($)</th>
            <th class="p-2 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <For each={ordenes}>
            {(ot) => (
              <tr class="border-t hover:bg-gray-50">
                <td class="p-2">{ot.id}</td>
                <td class="p-2">{formatearFechaCorta(ot.fecha)}</td>
                <td class="p-2 capitalize">{ot.turno}</td>
                <td class="p-2">{ot.planta?.nombre ?? ot.plantaId}</td>
                <td class="p-2">{ot.usuario?.nombre}</td>
                <td class="p-2 text-right">
                  {formatearPrecio(
                    ot.productos?.reduce(
                      (acc, item) =>
                        acc +
                        (item.cantidad && item.producto?.precioUnitario
                          ? item.cantidad * item.producto.precioUnitario
                          : 0),
                      0
                    ) ?? 0
                  )}
                </td>
                <td class="p-2 text-right flex gap-2 justify-end">
                  <button
                    onClick={() => onEliminarOT(ot)}
                    class="text-red-600 hover:underline text-sm"
                  >
                    Eliminar
                  </button>
                  {onVerDetalle && (
                    <button
                      onClick={() => onVerDetalle(ot)}
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
      {/* Mobile */}
      <div class="md:hidden space-y-4">
        <For each={ordenes}>
          {(ot) => (
            <div class="border rounded-lg p-3 shadow-sm text-sm bg-white">
              <div>
                <strong>Fecha:</strong> {formatearFechaCorta(ot.fecha)}
              </div>
              <div>
                <strong>Turno:</strong> <span class="capitalize">{ot.turno}</span>
              </div>
              <div>
                <strong>Planta:</strong> {ot.planta?.nombre ?? ot.plantaId}
              </div>
              <div>
                <strong>Usuario:</strong> {ot.usuario?.nombre}
              </div>
              <div>
                <strong>Total:</strong>{" "}
                {formatearPrecio(
                  ot.productos?.reduce(
                    (acc, item) =>
                      acc +
                      (item.cantidad && item.producto?.precioUnitario
                        ? item.cantidad * item.producto.precioUnitario
                        : 0),
                    0
                  ) ?? 0
                )}
              </div>
              <div class="flex gap-2 mt-2 justify-end">
                <button
                  onClick={() => onEliminarOT(ot)}
                  class="text-red-600 hover:underline text-sm"
                >
                  Eliminar
                </button>
                {onVerDetalle && (
                  <button
                    onClick={() => onVerDetalle(ot)}
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
