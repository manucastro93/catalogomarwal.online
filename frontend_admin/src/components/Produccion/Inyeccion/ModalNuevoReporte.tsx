import { createSignal, Show, For, createResource } from 'solid-js';
import { buscarPiezasPorTexto } from '@/services/pieza.service';
import { buscarOperariosPorTexto } from '@/services/operario.service';
import { buscarMaquinasPorTexto } from '@/services/maquina.service';
import { guardarReporteProduccionInyeccionEncabezado } from '@/services/produccionInyeccion.service';
import { useAuth } from '@/store/auth';
import type { Pieza } from '@/types/pieza';
import type { Operario } from '@/types/operario';
import type { Maquina } from '@/types/maquina';
import type { CrearReporteProduccionInyeccionEncabezado } from '@/types/produccionInyeccion';

export default function ModalNuevoReporteInyeccion(props: { onCerrar: () => void }) {
  const [busqueda, setBusqueda] = createSignal("");
  const [piezas] = createResource(busqueda, buscarPiezasPorTexto);

  const [items, setItems] = createSignal<
    {
      pieza: Pieza;
      operario?: Operario;
      operarioInput?: string;
      maquina?: Maquina;
      maquinaInput?: string;
      horaDesde?: string;
      horaHasta?: string;
      cantidad?: number;
      fallados?: number;
    }[]
  >([]);
  const [mensaje, setMensaje] = createSignal("");
  const { usuario } = useAuth();

  const [turno, setTurno] = createSignal("");
  const [nota, setNota] = createSignal("");
  const hoy = new Date().toISOString().split("T")[0];
  const [fecha, setFecha] = createSignal(hoy);

  const agregarItem = (pieza: Pieza) => {
    //const yaExiste = items().find((item) => item.pieza.id === pieza.id);
    //if (!yaExiste) {
      const ultimo = items().length > 0 ? items()[items().length - 1] : undefined;
      const horaDesde = ultimo?.horaHasta && ultimo.horaHasta !== "" ? ultimo.horaHasta : "";
      setItems([...items(), { pieza, horaDesde }]);
    //}
    setBusqueda("");
  };

  const cambiarCampo = (piezaId: number, campo: string, valor: any) => {
    setItems((prev) =>
      prev.map((item) =>
        item.pieza.id === piezaId ? { ...item, [campo]: valor } : item
      )
    );
  };

  const eliminarItem = (piezaId: number) => {
    setItems((prev) => prev.filter((item) => item.pieza.id !== piezaId));
  };

  const guardarReporte = async () => {
    const usuarioId = usuario()?.id;
    if (!usuarioId) {
      setMensaje("Error: usuario no identificado.");
      return;
    }
    if (!fecha()) {
      setMensaje("Seleccioná una fecha.");
      return;
    }
    if (!turno()) {
      setMensaje("Seleccioná un turno.");
      return;
    }
    if (
      items().some(
        (item) =>
          !item.operario?.id ||
          !item.maquina?.id ||
          typeof item.cantidad !== "number" ||
          item.cantidad < 1 ||
          !item.horaDesde ||
          !item.horaHasta
      )
    ) {
      setMensaje("Todos los campos de cada detalle son obligatorios.");
      return;
    }
    if (items().length === 0) {
      setMensaje("Agregá al menos un detalle al reporte");
      return;
    }

    // Armar el payload del encabezado
    const payload: CrearReporteProduccionInyeccionEncabezado = {
      fecha: fecha(),
      turno: turno() as "mañana" | "tarde" | "noche",
      usuarioId,
      nota: nota() || undefined,
      detalles: items().map((item) => ({
        operarioId: item.operario!.id,
        maquinaId: item.maquina!.id,
        piezaId: item.pieza.id,
        horaDesde: item.horaDesde!,
        horaHasta: item.horaHasta!,
        cantidad: item.cantidad as number,
        fallados: item.fallados as number,
      })),
    };
    await guardarReporteProduccionInyeccionEncabezado(payload);
    props.onCerrar();
  };

  // --- UI ---
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
          <Show when={busqueda().length > 0 && piezas() && (piezas()?.length ?? 0) > 0}>
            <div class="absolute left-0 right-0 top-full bg-white border-x border-b border-gray-300 max-h-80 overflow-y-auto z-40 shadow-xl rounded-b-md">
              <For each={piezas()}>
                {(pieza) => (
                  <div class="flex justify-between items-center border-b py-2 px-4 hover:bg-gray-200 cursor-pointer"
                    onClick={() => agregarItem(pieza)}
                  >
                    <span class="text-sm">{pieza.codigo} — {pieza.descripcion}</span>
                    <button
                      class="bg-blue-600 text-white px-3 py-1 text-sm rounded"
                    >
                      Seleccionar
                    </button>
                  </div>
                )}
              </For>
            </div>
          </Show>
        </div>


        <Show when={items().length > 0}>
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
                <For each={items()}>
                  {(item) => {
                    const [operarios] = createResource(
                      () => item.operarioInput ?? "",
                      (texto) => buscarOperariosPorTexto(texto, 1)
                    );
                    const [maquinas] = createResource(
                      () => item.maquinaInput ?? "",
                      (texto) => buscarMaquinasPorTexto(texto)
                    );
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
                            value={
                              item.operarioInput && item.operarioInput.length > 0
                                ? item.operarioInput
                                : item.operario?.nombre ?? ""
                            }
                            onInput={(e) => {
                              cambiarCampo(item.pieza.id, "operarioInput", e.currentTarget.value);
                              if (item.operario) {
                                cambiarCampo(item.pieza.id, "operario", undefined);
                              }
                            }}
                          />
                          <Show when={item.operarioInput && operarios()}>
                            <div class="bg-white border-x border-b border-gray-300 max-h-32 overflow-y-auto z-40 shadow-xl absolute top-full left-0 right-0 rounded-b-md">
                              <For each={operarios()}>
                                {(op) => (
                                  <div
                                    class="px-2 py-1 hover:bg-gray-200 cursor-pointer"
                                    onClick={() => {
                                      cambiarCampo(item.pieza.id, "operario", op);
                                      cambiarCampo(item.pieza.id, "operarioInput", op.nombre);
                                      setTimeout(() => cambiarCampo(item.pieza.id, "operarioInput", ""), 10);
                                    }}
                                  >
                                    {op.nombre}
                                  </div>
                                )}
                              </For>
                            </div>
                          </Show>
                        </td>
                        {/* MAQUINAS */}
                        <td class="p-2 relative align-top">
                          <input
                            type="text"
                            placeholder="Buscar máquina..."
                            class="border p-1 w-full text-sm"
                            value={
                              item.maquinaInput && item.maquinaInput.length > 0
                                ? item.maquinaInput
                                : item.maquina?.nombre ?? ""
                            }
                            onInput={(e) => {
                              cambiarCampo(item.pieza.id, "maquinaInput", e.currentTarget.value);
                              if (item.maquina) {
                                cambiarCampo(item.pieza.id, "maquina", undefined);
                              }
                            }}
                          />
                          <Show when={item.maquinaInput && maquinas()}>
                            <div class="bg-white border-x border-b border-gray-300 max-h-32 overflow-y-auto z-40 shadow-xl absolute top-full left-0 right-0 rounded-b-md">
                              <For each={maquinas()}>
                                {(m) => (
                                  <div
                                    class="px-2 py-1 hover:bg-gray-200 cursor-pointer"
                                    onClick={() => {
                                      cambiarCampo(item.pieza.id, "maquina", m);
                                      cambiarCampo(item.pieza.id, "maquinaInput", m.nombre);
                                      setTimeout(() => cambiarCampo(item.pieza.id, "maquinaInput", ""), 10);
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
                            value={item.horaDesde ?? ""}
                            onChange={(e) =>
                              cambiarCampo(item.pieza.id, "horaDesde", e.currentTarget.value)
                            }
                          />
                        </td>
                        {/* HORA HASTA */}
                        <td class="p-2">
                          <input
                            type="time"
                            class="border p-1 w-full text-sm"
                            value={item.horaHasta ?? ""}
                            onChange={(e) =>
                              cambiarCampo(item.pieza.id, "horaHasta", e.currentTarget.value)
                            }
                          />
                        </td>
                        {/* CANTIDAD */}
                        <td class="p-2">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            value={item.cantidad ?? ""}
                            class="border p-1 w-full text-right"
                            onChange={(e) => {
                              const valor = e.currentTarget.value;
                              const numero = parseInt(valor);
                              cambiarCampo(
                                item.pieza.id,
                                "cantidad",
                                isNaN(numero) ? undefined : numero
                              );
                            }}
                          />
                        </td>
                        {/* FALLADOS */}
                        <td class="p-2">
                          <input
                            type="number"
                            min="0"
                            step="0"
                            value={item.fallados ?? ""}
                            class="border p-1 w-full text-right"
                            onChange={(e) => {
                              const valor = e.currentTarget.value;
                              const numero = parseInt(valor);
                              cambiarCampo(
                                item.pieza.id,
                                "fallados",
                                isNaN(numero) ? undefined : numero
                              );
                            }}
                          />
                        </td>
                        {/* ACCIONES */}
                        <td class="p-2 text-right">
                          <button
                            onClick={() => eliminarItem(item.pieza.id)}
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
          <button
            onClick={props.onCerrar}
            class="px-4 py-2 border rounded text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={guardarReporte}
            class="bg-green-600 text-white px-4 py-2 rounded text-sm"
          >
            Guardar Reporte
          </button>
        </div>
      </div>
    </div>
  );
}
