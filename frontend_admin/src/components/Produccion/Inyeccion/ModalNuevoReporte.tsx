import { createSignal, Show, For, createResource } from "solid-js";
import { createStore } from "solid-js/store";
import { buscarPiezasPorTexto } from "@/services/pieza.service";
import { buscarOperariosPorTexto } from "@/services/operario.service";
import { buscarMaquinasPorTexto } from "@/services/maquina.service";
import { guardarReporteProduccionInyeccionEncabezado } from "@/services/produccionInyeccion.service";
import { useAuth } from "@/store/auth";
import type { Pieza } from "@/types/pieza";
import type { Operario } from "@/types/operario";
import type { Maquina } from "@/types/maquina";
import type { CrearReporteProduccionInyeccionEncabezado } from "@/types/produccionInyeccion";

type ItemRow = {
  uid: number;               // 🔑 identidad estable por fila
  pieza: Pieza;
  operario?: Operario;
  operarioInput?: string;
  maquina?: Maquina;
  maquinaInput?: string;
  horaDesde?: string;
  horaHasta?: string;
  cantidad?: number;
  fallados?: number;
};

let UID = 1;

export default function ModalNuevoReporteInyeccion(props: { onCerrar: () => void }) {
  const [busqueda, setBusqueda] = createSignal("");
  const [piezas] = createResource(busqueda, buscarPiezasPorTexto);

  // ✅ Usamos store para no reemplazar objetos y evitar perder foco
  const [items, setItems] = createStore<ItemRow[]>([]);

  const [mensaje, setMensaje] = createSignal("");
  const { usuario } = useAuth();

  const [turno, setTurno] = createSignal("");
  const [nota, setNota] = createSignal("");
  const hoy = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = createSignal(hoy);

  const agregarItem = (pieza: Pieza) => {
    // ✅ PERMITIDO repetir la misma pieza varias veces
    const ultimo = items.length > 0 ? items[items.length - 1] : undefined;
    const horaDesde = ultimo?.horaHasta && ultimo.horaHasta !== "" ? ultimo.horaHasta : "";
    setItems(items.length, {
      uid: UID++,
      pieza,
      horaDesde,
    });
    setBusqueda("");
  };

  const eliminarItem = (uid: number) => {
    const idx = items.findIndex((it) => it.uid === uid);
    if (idx >= 0) setItems((arr) => arr.toSpliced(idx, 1));
  };

  const guardarReporte = async () => {
    const usuarioId = usuario()?.id;
    if (!usuarioId) return setMensaje("Error: usuario no identificado.");
    if (!fecha()) return setMensaje("Seleccioná una fecha.");
    if (!turno()) return setMensaje("Seleccioná un turno.");
    if (items.length === 0) return setMensaje("Agregá al menos un detalle al reporte.");

    const faltantes = items.some(
      (it) =>
        !it.operario?.id ||
        !it.maquina?.id ||
        typeof it.cantidad !== "number" ||
        (it.cantidad ?? 0) < 1 ||
        !it.horaDesde ||
        !it.horaHasta
    );
    if (faltantes) return setMensaje("Todos los campos de cada detalle son obligatorios.");

    const payload: CrearReporteProduccionInyeccionEncabezado = {
      fecha: fecha(),
      turno: turno() as "mañana" | "tarde" | "noche",
      usuarioId,
      nota: nota() || undefined,
      detalles: items.map((it) => ({
        operarioId: it.operario!.id,
        maquinaId: it.maquina!.id,
        piezaId: it.pieza.id,
        horaDesde: it.horaDesde!,
        horaHasta: it.horaHasta!,
        cantidad: it.cantidad as number,
        fallados: (it.fallados ?? 0) as number,
      })),
    };

    await guardarReporteProduccionInyeccionEncabezado(payload);
    props.onCerrar();
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-5xl md:w-[90vw] min-h-[600px] md:h-[98vh] p-6 border border-gray-300 flex flex-col overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">Nuevo Reporte de Producción (Inyección)</h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4 text-sm">
          <input
            type="date"
            class="border p-2 rounded"
            value={fecha()}
            onInput={(e) => setFecha(e.currentTarget.value)}
          />
          <select
            class="border p-2 rounded"
            value={turno()}
            onChange={(e) => setTurno(e.currentTarget.value)}
          >
            <option value="">Seleccioná turno</option>
            <option value="mañana">Mañana</option>
            <option value="tarde">Tarde</option>
            <option value="noche">Noche</option>
          </select>
          <input
            type="text"
            placeholder="Notas/instrucciones (opcional)"
            class="border p-2 rounded"
            value={nota()}
            onInput={(e) => setNota(e.currentTarget.value)}
            maxlength={200}
          />
        </div>

        <div class="mb-3 relative">
          <input
            type="text"
            placeholder="Buscar pieza por descripcion o codigo..."
            class="border p-2 w-full rounded"
            value={busqueda()}
            onInput={(e) => setBusqueda(e.currentTarget.value)}
            autocomplete="off"
          />
          <Show when={busqueda().length > 0 && (piezas()?.length ?? 0) > 0}>
            <div class="absolute left-0 right-0 top-full bg-white border-x border-b border-gray-300 max-h-80 overflow-y-auto z-40 shadow-xl rounded-b-md">
              <For each={piezas()}>
                {(pieza) => (
                  <div
                    class="flex justify-between items-center border-b py-2 px-4 hover:bg-gray-200 cursor-pointer"
                    onClick={() => agregarItem(pieza)}
                  >
                    <span class="text-sm">{pieza.codigo} — {pieza.descripcion}</span>
                    <button class="bg-blue-600 text-white px-3 py-1 text-sm rounded">Seleccionar</button>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>

        <Show when={items.length > 0}>
          <div class="overflow-x-auto mb-4 min-h-[360px] md:min-h-[380px] overflow-visible">
            <table class="w-full text-base text-left border table-fixed">
              <thead class="bg-gray-100">
                <tr>
                  <th class="p-2 w-[120px]">Código</th>
                  <th class="p-2">Pieza</th>
                  <th class="p-2">Operario</th>
                  <th class="p-2">Máquina</th>
                  <th class="p-2 w-[90px]">Hora desde</th>
                  <th class="p-2 w-[90px]">Hora hasta</th>
                  <th class="p-2 w-[100px]">Cantidad</th>
                  <th class="p-2 w-[100px]">Fallados</th>
                  <th class="p-2 w-[80px] text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <For each={items}>
                  {(item, i) => {
                    // 🔎 Autocomplete Operarios (no borra el input al tipear)
                    const [operarios] = createResource(
                      () => (items[i()].operarioInput ?? "").trim(),
                      (texto) => texto ? buscarOperariosPorTexto(texto, 10) : Promise.resolve([])
                    );
                    // 🔎 Autocomplete Máquinas
                    const [maquinas] = createResource(
                      () => (items[i()].maquinaInput ?? "").trim(),
                      (texto) => texto ? buscarMaquinasPorTexto(texto) : Promise.resolve([])
                    );

                    const mostrarOps = () =>
                      (items[i()].operarioInput ?? "").length > 0 && (operarios()?.length ?? 0) > 0;
                    const mostrarMaq = () =>
                      (items[i()].maquinaInput ?? "").length > 0 && (maquinas()?.length ?? 0) > 0;

                    return (
                      <tr class="border-t relative align-top">
                        <td class="p-2 truncate">{item.pieza.codigo}</td>
                        <td class="p-2 truncate">{item.pieza.descripcion}</td>

                        {/* OPERARIO */}
                        <td class="p-2 relative align-top">
                          <input
                            type="text"
                            placeholder="Buscar operario..."
                            class="border p-1 w-full text-sm"
                            value={items[i()].operarioInput ?? ""}
                            onInput={(e) => {
                              const v = e.currentTarget.value;
                              setItems(i(), "operarioInput", v);          // ✅ mutación sin reemplazar el row
                              if (items[i()].operario) setItems(i(), "operario", undefined);
                            }}
                            autocomplete="off"
                          />
                          <Show when={mostrarOps()}>
                            <div class="bg-white border-x border-b border-gray-300 max-h-32 overflow-y-auto z-40 shadow-xl absolute top-full left-0 right-0 rounded-b-md">
                              <For each={operarios()}>
                                {(op) => (
                                  <div
                                    class="px-2 py-1 hover:bg-gray-200 cursor-pointer"
                                    onClick={() => {
                                      // ✅ selecciona pero NO limpia el texto; mantiene foco
                                      setItems(i(), { operario: op, operarioInput: op.nombre });
                                    }}
                                  >
                                    {op.nombre}
                                  </div>
                                )}
                              </For>
                            </div>
                          </Show>
                        </td>

                        {/* MÁQUINA */}
                        <td class="p-2 relative align-top">
                          <input
                            type="text"
                            placeholder="Buscar máquina..."
                            class="border p-1 w-full text-sm"
                            value={items[i()].maquinaInput ?? ""}
                            onInput={(e) => {
                              const v = e.currentTarget.value;
                              setItems(i(), "maquinaInput", v);
                              if (items[i()].maquina) setItems(i(), "maquina", undefined);
                            }}
                            autocomplete="off"
                          />
                          <Show when={mostrarMaq()}>
                            <div class="bg-white border-x border-b border-gray-300 max-h-32 overflow-y-auto z-40 shadow-xl absolute top-full left-0 right-0 rounded-b-md">
                              <For each={maquinas()}>
                                {(m) => (
                                  <div
                                    class="px-2 py-1 hover:bg-gray-200 cursor-pointer"
                                    onClick={() => {
                                      setItems(i(), { maquina: m, maquinaInput: m.nombre });
                                    }}
                                  >
                                    {m.nombre}
                                  </div>
                                )}
                              </For>
                            </div>
                          </Show>
                        </td>

                        {/* HORA DESDE */}
                        <td class="p-2">
                          <input
                            type="time"
                            class="border p-1 w-full text-sm"
                            value={items[i()].horaDesde ?? ""}
                            onChange={(e) => setItems(i(), "horaDesde", e.currentTarget.value)}
                          />
                        </td>
                        {/* HORA HASTA */}
                        <td class="p-2">
                          <input
                            type="time"
                            class="border p-1 w-full text-sm"
                            value={items[i()].horaHasta ?? ""}
                            onChange={(e) => setItems(i(), "horaHasta", e.currentTarget.value)}
                          />
                        </td>
                        {/* CANTIDAD */}
                        <td class="p-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={items[i()].cantidad ?? ""}
                            class="border p-1 w-full text-right"
                            onChange={(e) => {
                              const n = parseInt(e.currentTarget.value);
                              setItems(i(), "cantidad", Number.isFinite(n) ? n : undefined);
                            }}
                          />
                        </td>
                        {/* FALLADOS */}
                        <td class="p-2">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={items[i()].fallados ?? ""}
                            class="border p-1 w-full text-right"
                            onChange={(e) => {
                              const n = parseInt(e.currentTarget.value);
                              setItems(i(), "fallados", Number.isFinite(n) ? n : undefined);
                            }}
                          />
                        </td>

                        {/* ACCIONES */}
                        <td class="p-2 text-right">
                          <button
                            onClick={() => eliminarItem(item.uid)}
                            class="text-red-600 text-sm hover:underline"
                          >
                            Eliminar
                          </button>
                        </td>
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </div>
        </Show>

        <Show when={mensaje()}>
          <p class="text-red-600 text-sm mb-2">{mensaje()}</p>
        </Show>

        <div class="flex justify-end gap-2 mt-6">
          <button onClick={props.onCerrar} class="px-4 py-2 border rounded text-sm">
            Cancelar
          </button>
          <button onClick={guardarReporte} class="bg-green-600 text-white px-4 py-2 rounded text-sm">
            Guardar Reporte
          </button>
        </div>
      </div>
    </div>
  );
}
