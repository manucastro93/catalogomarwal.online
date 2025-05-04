import { For, Show } from "solid-js";
import type { Usuario } from "@/types/usuario";

interface Props {
  vendedores: Usuario[];
  orden: string;
  direccion: "asc" | "desc";
  puedeEditar: boolean;
  puedeEliminar: boolean;
  onOrdenar: (col: string) => void;
  onVer: (v: Usuario) => void;
  onEditar: (v: Usuario) => void;
  onEliminar: (id: number) => void;
  onCopiarLink: (id: string | number | undefined) => void;
}

export default function TablaVendedores(props: Props) {
  return (
    <div class="overflow-auto border rounded-lg">
      <table class="w-full text-sm border-collapse">
        <thead class="bg-gray-100">
          <tr>
            <th class="text-left p-3 cursor-pointer" onClick={() => props.onOrdenar("nombre")}>
              Nombre {props.orden === "nombre" && (props.direccion === "asc" ? "▲" : "▼")}
            </th>
            <th class="text-left p-3 cursor-pointer" onClick={() => props.onOrdenar("email")}>
              Email {props.orden === "email" && (props.direccion === "asc" ? "▲" : "▼")}
            </th>
            <th class="text-left p-3 cursor-pointer" onClick={() => props.onOrdenar("telefono")}>
              Teléfono {props.orden === "telefono" && (props.direccion === "asc" ? "▲" : "▼")}
            </th>
            <th class="text-left p-3">Link</th>
            <th class="text-left p-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          <Show
            when={props.vendedores.length > 0}
            fallback={
              <tr>
                <td colSpan={5} class="p-4 text-center text-gray-500">
                  No se encontraron vendedores
                </td>
              </tr>
            }
          >
            <For each={props.vendedores}>
              {(v) => (
                <tr class="border-b hover:bg-gray-50">
                  <td class="p-3">{v.nombre}</td>
                  <td class="p-3">{v.email}</td>
                  <td class="p-3">{v.telefono || "-"}</td>
                  <td class="p-3">
                    <button
                      class="text-blue-600 hover:underline"
                      onClick={() => props.onCopiarLink(v.link ?? "")}
                    >
                      Copiar link
                    </button>
                    <a
                      href={`https://wa.me/?text=Mirá%20el%20catálogo%20de%20Marwal:%20https://www.catalogomarwal.online/${v?.link ?? ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Compartir por WhatsApp"
                    >
                      <img
                        src="https://upload.wikimedia.org/wikipedia/commons/5/5e/WhatsApp_icon.png"
                        alt="WhatsApp"
                        style="width: 25px; height: 25px; margin-left: 8px; display: inline-table;"
                      />
                    </a>
                  </td>
                  <td class="p-3 flex gap-2">
                    <button
                      class="text-blue-600 hover:underline"
                      onClick={() => props.onVer(v)}
                    >
                      Ver
                    </button>
                    <Show when={props.puedeEditar}>
                      <button
                        class="text-green-600 hover:underline"
                        onClick={() => props.onEditar(v)}
                      >
                        Editar
                      </button>
                    </Show>
                    <Show when={props.puedeEliminar}>
                      <button
                        class="text-red-600 hover:underline"
                        onClick={() => props.onEliminar(v.id)}
                      >
                        Eliminar
                      </button>
                    </Show>
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
