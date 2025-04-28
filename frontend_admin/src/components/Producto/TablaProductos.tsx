import { For, Show } from "solid-js";
import { formatearPrecio } from "@/utils/formato";
import type { Producto } from "@/types/producto";
import ConPermiso from "@/components/Layout/ConPermiso";

export default function TablaProductos(props: {
  productos: Producto[];
  orden: string;
  direccion: "asc" | "desc";
  esVendedor: boolean;
  onOrdenar: (col: string) => void;
  onVer: (id: number) => void;
  onEditar: (id: number) => void;
  onEliminar: (id: number) => void;
}) {
  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100 sticky top-0">
          <tr>
            <th class="text-left p-3 border-b">Imagen</th>
            {[
              "sku",
              "nombre",
              "costoMP",
              "precioUnitario",
              "precioPorBulto",
              "activo",
            ].map((col) => (
              <th
                class="text-left p-3 border-b cursor-pointer"
                onClick={() => props.onOrdenar(col)}
              >
                {col === "precioUnitario"
                  ? "PrecioXUn"
                  : col === "costoMP"
                  ? "costoMP"
                  : col === "precioPorBulto"
                  ? "PrecioXBulto"
                  : col === "activo"
                  ? "¿Activo?"
                  : col.charAt(0).toUpperCase() + col.slice(1)}{" "}
                {props.orden === col && (props.direccion === "asc" ? "▲" : "▼")}
              </th>
            ))}
            <th class="text-left p-3 border-b">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <Show
            when={props.productos.length > 0}
            fallback={
              <tr>
                <td colspan="7" class="text-center p-4 text-gray-500">
                  No se encontraron productos
                </td>
              </tr>
            }
          >
            <For each={props.productos}>
              {(p) => (
                <tr class="hover:bg-gray-50 border-b">
                  <td>
                    <Show
                      when={Array.isArray(p.Imagenes) && p.Imagenes.length > 0}
                    >
                      <img
                        src={`${import.meta.env.VITE_BACKEND_URL}${
                          p.Imagenes?.[0]?.url
                        }`}
                        alt={p.nombre ?? ""}
                        class="h-12 w-12 object-cover rounded"
                      />
                    </Show>
                  </td>
                  <td class="p-3">{p.sku}</td>
                  <td class="p-3">{p.nombre}</td>
                  <td class="p-3">
                    {p.costoMP != null
                      ? formatearPrecio(p.costoMP)
                      : "—"}
                  </td>
                  <td class="p-3">{formatearPrecio(p.precioUnitario)}</td>
                  <td class="p-3">
                    {p.precioPorBulto != null
                      ? formatearPrecio(p.precioPorBulto)
                      : "—"}
                  </td>
                  <td class="p-3">{p.activo ? "Sí" : "No"}</td>
                  <td class="p-3 flex gap-2">
                    <button
                      class="text-blue-600 hover:underline"
                      onClick={() => props.onVer(p.id)}
                    >
                      Ver
                    </button>
                    <ConPermiso modulo="productos" accion="editar">
                        <button
                          class="text-green-600 hover:underline"
                          onClick={() => props.onEditar(p.id)}
                        >
                          Editar
                        </button>
                    </ConPermiso>
                    <ConPermiso modulo="productos" accion="editar">
                    <button
                          class="text-red-600 hover:underline"
                          onClick={() => props.onEliminar(p.id)}
                        >
                          Eliminar
                        </button>
                    </ConPermiso>
                    
                  </td>
                </tr>
              )}
            </For>
          </Show>
        </tbody>
      </table>
    </div>
  );
}
