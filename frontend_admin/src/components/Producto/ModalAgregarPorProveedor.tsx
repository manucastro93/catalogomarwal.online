import { createSignal, createResource, For, Show } from "solid-js";
import { obtenerProveedores } from "@/services/proveedor.service";
import { obtenerMateriasPrimas } from "@/services/materiaPrima.service";
import type { MateriaPrima } from "@/types/materiaPrima";
import type { Proveedor } from "@/types/proveedor";

const UNIDADES = ["KG", "MT", "UN"];

export default function ModalAgregarPorProveedor(props: {
  onAgregar: (items: { materiaPrima: MateriaPrima; cantidad: number; unidadMedida: string }) => void;
  onCerrar: () => void;
}) {
  // Proveedor input/autocomplete
  const [proveedorInput, setProveedorInput] = createSignal("");
  const [proveedorSeleccionado, setProveedorSeleccionado] = createSignal<Proveedor | null>(null);
  const [mostrarOpcionesProveedor, setMostrarOpcionesProveedor] = createSignal(false);

  // Para filtrar lista proveedores
  const [proveedores] = createResource(() => ({}), () => obtenerProveedores({ limit: 10000, page: 1 }));
  const proveedoresFiltrados = () => {
    const val = proveedorInput().toLowerCase();
    return (proveedores()?.data ?? []).filter(
      (p: Proveedor) => p.nombre.toLowerCase().includes(val)
    );
  };

  // Selección de materias primas
  const [seleccionadas, setSeleccionadas] = createSignal<{ [id: number]: { cantidad: number, unidadMedida: string } }>({});
  const [busqueda, setBusqueda] = createSignal("");

  // Materias primas de ese proveedor
  const [materiasPrimas] = createResource(
    () => proveedorSeleccionado() ? ({
      proveedorId: proveedorSeleccionado()!.id,
      buscar: busqueda() || undefined,
    }) : undefined,
    obtenerMateriasPrimas
  );

  // Elegir materia prima (checkbox)
  const toggleSeleccion = (mp: MateriaPrima, checked: boolean) => {
    setSeleccionadas((prev) => {
      const nuevo = { ...prev };
      if (checked) {
        nuevo[mp.id] = { cantidad: 1, unidadMedida: mp.unidadMedida || UNIDADES[0] };
      } else {
        delete nuevo[mp.id];
      }
      return nuevo;
    });
  };

  // Cambia cantidad/unidad
  const cambiarCantidad = (mpId: number, cantidad: number) => {
    setSeleccionadas((prev) => ({
      ...prev,
      [mpId]: { ...prev[mpId], cantidad }
    }));
  };
  const cambiarUnidad = (mpId: number, unidadMedida: string) => {
    setSeleccionadas((prev) => ({
      ...prev,
      [mpId]: { ...prev[mpId], unidadMedida }
    }));
  };

  // Agregar seleccionados
  const handleAgregar = () => {
    if (!materiasPrimas()) return;
    const items = materiasPrimas().data
      .filter((mp: MateriaPrima) => seleccionadas()[mp.id])
      .map((mp: MateriaPrima) => ({
        materiaPrima: mp,
        cantidad: Number(seleccionadas()[mp.id].cantidad),
        unidadMedida: seleccionadas()[mp.id].unidadMedida,
      }));
    props.onAgregar(items);
  };

  // Cuando cambio proveedor, limpio búsqueda y seleccionadas
  const handleElegirProveedor = (proveedor: Proveedor) => {
    setProveedorSeleccionado(proveedor);
    setProveedorInput(proveedor.nombre);
    setMostrarOpcionesProveedor(false);
    setBusqueda("");
    setSeleccionadas({});
  };

  // Seleccionar/Deseleccionar todos
  const toggleSeleccionarTodos = (checked: boolean) => {
    if (!materiasPrimas()) return;
    if (checked) {
      const nuevas = { ...seleccionadas() };
      materiasPrimas().data.forEach((mp: MateriaPrima) => {
        nuevas[mp.id] = {
          cantidad: nuevas[mp.id]?.cantidad || 1,
          unidadMedida: nuevas[mp.id]?.unidadMedida || mp.unidadMedida || UNIDADES[0],
        };
      });
      setSeleccionadas(nuevas);
    } else {
      setSeleccionadas({});
    }
  };

  return (
    <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div class="bg-white p-6 rounded shadow-lg w-full max-w-2xl relative">
        <h2 class="text-xl font-bold mb-4">Agregar materias primas por proveedor</h2>

        {/* Input autocompletado de proveedor */}
        <label class="block font-medium mb-2">Proveedor:</label>
        <div class="relative mb-4">
          <input
            type="text"
            class="border p-2 rounded w-full"
            placeholder="Buscar proveedor..."
            value={proveedorInput()}
            onInput={(e) => {
              setProveedorInput(e.currentTarget.value);
              if (e.currentTarget.value.trim() === "") {
                setMostrarOpcionesProveedor(false);
                setProveedorSeleccionado(null);
                setSeleccionadas({});
              } else {
                setMostrarOpcionesProveedor(true);
                setProveedorSeleccionado(null);
                setSeleccionadas({});
              }
            }}
            onFocus={() => setMostrarOpcionesProveedor(true)}
            autocomplete="off"
          />
          <Show when={mostrarOpcionesProveedor() && proveedoresFiltrados().length > 0 && !proveedorSeleccionado()}>
            <div class="absolute z-10 bg-white border rounded shadow w-full max-h-56 overflow-y-auto">
              <For each={proveedoresFiltrados()}>
                {(prov) => (
                  <div
                    class="p-2 cursor-pointer hover:bg-blue-50"
                    onClick={() => handleElegirProveedor(prov)}
                  >
                    {prov.nombre}
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        {/* Solo si seleccionaste proveedor */}
        <Show when={proveedorSeleccionado()}>
          {/* Buscador de materia prima dentro del proveedor */}
          <input
            class="border p-2 rounded w-full mb-2"
            placeholder="Buscar materia prima..."
            value={busqueda()}
            onInput={(e) => setBusqueda(e.currentTarget.value)}
          />

          {/* Tabla de materias primas */}
          <div class="overflow-y-auto max-h-64 border rounded mb-3">
            <table class="w-full text-sm">
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={
                        materiasPrimas()?.data?.length &&
                        Object.keys(seleccionadas()).length === materiasPrimas().data.length
                      }
                      onChange={(e) => toggleSeleccionarTodos(e.currentTarget.checked)}
                    />
                  </th>
                  <th>SKU</th>
                  <th>Nombre</th>
                  <th>Unidad</th>
                  <th>Cantidad</th>
                </tr>
              </thead>
              <tbody>
                <For each={materiasPrimas()?.data || []}>
                  {(mp: MateriaPrima) => (
                    <tr>
                      <td>
                        <input
                          type="checkbox"
                          checked={!!seleccionadas()[mp.id]}
                          onChange={(e) => toggleSeleccion(mp, e.currentTarget.checked)}
                        />
                      </td>
                      <td>{mp.sku}</td>
                      <td>{mp.nombre}</td>
                      <td>
                        <select
                          class="border rounded p-1"
                          disabled={!seleccionadas()[mp.id]}
                          value={seleccionadas()[mp.id]?.unidadMedida || mp.unidadMedida || UNIDADES[0]}
                          onInput={(e) => cambiarUnidad(mp.id, e.currentTarget.value)}
                        >
                          {UNIDADES.map((u) => (
                            <option value={u}>{u}</option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          class="border p-1 rounded w-20"
                          value={seleccionadas()[mp.id]?.cantidad || ""}
                          disabled={!seleccionadas()[mp.id]}
                          onInput={(e) =>
                            cambiarCantidad(mp.id, Number(e.currentTarget.value))
                          }
                        />
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
        {/* Acciones */}
        <div class="flex justify-end gap-2 mt-4">
          <button
            class="bg-gray-300 px-4 py-2 rounded"
            onClick={props.onCerrar}
          >
            Cancelar
          </button>
          <button
            class="bg-green-600 text-white px-4 py-2 rounded"
            disabled={Object.keys(seleccionadas()).length === 0}
            onClick={handleAgregar}
          >
            Agregar seleccionados
          </button>
        </div>
      </div>
    </div>
  );
}
