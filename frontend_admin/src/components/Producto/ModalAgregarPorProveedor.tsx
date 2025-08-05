import { createSignal, createResource, For, Show } from "solid-js";
import { obtenerProveedores } from "@/services/proveedor.service";
import { obtenerMateriasPrimas } from "@/services/materiaPrima.service";
import type { MateriaPrima } from "@/types/materiaPrima";
import type { Proveedor } from "@/types/proveedor";
import { formatearPrecio } from "@/utils/formato";

const UNIDADES = ["KG", "MT", "UN", "LT"];

export default function ModalAgregarPorProveedor(props: {
  onAgregar: (items: { materiaPrima: MateriaPrima; cantidad: number; unidadMedida: string }) => void;
  onCerrar: () => void;
}) {
  const [proveedorInput, setProveedorInput] = createSignal("");
  const [proveedorSeleccionado, setProveedorSeleccionado] = createSignal<Proveedor | null>(null);
  const [mostrarOpcionesProveedor, setMostrarOpcionesProveedor] = createSignal(false);

  const [proveedores] = createResource(() => ({}), () => obtenerProveedores({ limit: 100000, page: 1 }));
  const proveedoresFiltrados = () => {
    const val = proveedorInput().toLowerCase();
    return (proveedores()?.data ?? []).filter(
      (p: Proveedor) => p.nombre.toLowerCase().includes(val)
    );
  };

  const [seleccionadas, setSeleccionadas] = createSignal<{
    [id: number]: { cantidad: number | string; unidadMedida: string }
  }>({});

  const [busqueda, setBusqueda] = createSignal("");

  const [materiasPrimas] = createResource(
    () => proveedorSeleccionado() ? ({
      proveedorId: proveedorSeleccionado()!.id,
      buscar: busqueda() || undefined,
      limit: 10000,
      page: 1,
    }) : undefined,
    obtenerMateriasPrimas
  );

  const toggleSeleccion = (mp: MateriaPrima, checked: boolean) => {
    setSeleccionadas((prev) => {
      const nuevo = { ...prev };
      if (checked) {
        nuevo[mp.id] = {
          cantidad: 1,
          unidadMedida: mp.unidadMedida || UNIDADES[0],
        };
      } else {
        delete nuevo[mp.id];
      }
      return nuevo;
    });
  };

  const cambiarUnidad = (mpId: number, unidadMedida: string) => {
    setSeleccionadas((prev) => ({
      ...prev,
      [mpId]: { ...prev[mpId], unidadMedida }
    }));
  };

  // Input solo de cantidad
  const cambiarCantidad = (mpId: number, raw: string) => {
    // Permitimos "," o "." y números
    let valor = raw.replace(",", ".");
    // Solo aceptamos números, punto, y una coma (ya reemplazada)
    valor = valor.replace(/[^0-9.]/g, "");
    setSeleccionadas((prev) => {
      const anterior = prev[mpId] || {};
      // Si termina en punto, coma o está vacío, no parseamos, dejamos escribir
      if (/(\.|,)$/.test(raw) || valor === "") {
        return {
          ...prev,
          [mpId]: { ...anterior, cantidad: raw }
        };
      }
      const cantidad = parseFloat(valor);
      // Si es número válido (positivo), lo guardamos como string, sino dejamos lo que está
      return {
        ...prev,
        [mpId]: { ...anterior, cantidad: !isNaN(cantidad) && cantidad > 0 ? valor : raw }
      };
    });
  };


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

  const handleElegirProveedor = (proveedor: Proveedor) => {
    setProveedorSeleccionado(proveedor);
    setProveedorInput(proveedor.nombre);
    setMostrarOpcionesProveedor(false);
    setBusqueda("");
    setSeleccionadas({});
  };

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

  const calcularTotalGeneral = () => {
    return (materiasPrimas()?.data || []).reduce((acc: number, mp: MateriaPrima) => {
      const sel = seleccionadas()[mp.id];
      if (!sel) return acc;
      return acc + (mp.costoDux || 0) * Number(sel.cantidad);
    }, 0);
  };

  return (
    <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
      <div class="bg-white p-8 rounded shadow-xl w-full max-w-6xl h-[90vh] overflow-y-auto relative">
        <h2 class="text-xl font-bold mb-4">Agregar materias primas por proveedor</h2>

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

        <Show when={proveedorSeleccionado()}>
          <input
            class="border p-2 rounded w-full mb-2"
            placeholder="Buscar materia prima..."
            value={busqueda()}
            onInput={(e) => setBusqueda(e.currentTarget.value)}
          />

          <div class="overflow-y-auto max-h-[250px] sm:max-h-[300px] md:max-h-[350px] lg:max-h-[350px] border rounded mb-3">
            <table class="w-full text-sm border-collapse">
              <thead class="bg-gray-100 sticky top-0">
                <tr>
                  <th class="text-left p-3 border-b">
                    <input
                      type="checkbox"
                      checked={
                        materiasPrimas()?.data?.length &&
                        Object.keys(seleccionadas()).length === materiasPrimas().data.length
                      }
                      onChange={(e) => toggleSeleccionarTodos(e.currentTarget.checked)}
                    />
                  </th>
                  <th class="text-left p-3 border-b">SKU</th>
                  <th class="text-left p-3 border-b">Nombre</th>
                  <th class="text-left p-3 border-b">Costo</th>
                  <th class="text-left p-3 border-b">Unidad</th>
                  <th class="text-left p-3 border-b">Cantidad</th>
                  <th class="text-left p-3 border-b">Total</th>
                </tr>
              </thead>
              <tbody>
                <Show
                  when={materiasPrimas()?.data.length > 0}
                  fallback={
                    <tr>
                      <td colspan="7" class="text-center p-4 text-gray-500">
                        No se encontraron productos
                      </td>
                    </tr>
                  }
                >
                  <For each={materiasPrimas()?.data || []}>
                    {(mp: MateriaPrima) => (
                      <tr class="hover:bg-gray-50 border-b">
                        <td>
                          <input
                            type="checkbox"
                            checked={!!seleccionadas()[mp.id]}
                            onChange={(e) => toggleSeleccion(mp, e.currentTarget.checked)}
                          />
                        </td>
                        <td class="p-3">{mp.sku}</td>
                        <td class="p-3">{mp.nombre}</td>
                        <td class="p-3">{formatearPrecio(mp.costoDux)}</td>
                        <td class="p-3">
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
                        <td class="p-3">
                          <input
                            type="text"
                            class="border p-1 rounded w-24"
                            value={seleccionadas()[mp.id]?.cantidad ?? ""}
                            disabled={!seleccionadas()[mp.id]}
                            onInput={(e) => cambiarCantidad(mp.id, e.currentTarget.value)}
                          />
                        </td>
                        <td class="p-3">
                          {seleccionadas()[mp.id]
                            ? formatearPrecio((mp.costoDux || 0) * Number(seleccionadas()[mp.id].cantidad || 0))
                            : "-"}
                        </td>
                      </tr>
                    )}
                  </For>
                </Show>
              </tbody>
              </table>
          </div>

          <Show when={Object.keys(seleccionadas()).length > 0}>
            <div class="text-right font-bold mt-2">
              Total: {formatearPrecio(calcularTotalGeneral())}
            </div>
          </Show>

        </Show>

        <div class="flex justify-end gap-2 mt-4">
          <button class="bg-gray-300 px-4 py-2 rounded" onClick={props.onCerrar}>
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
