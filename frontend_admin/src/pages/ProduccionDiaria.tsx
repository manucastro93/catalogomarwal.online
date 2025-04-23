import { createSignal, createResource, For, Show } from "solid-js";
import { obtenerReportesProduccion } from "../services/produccion.service";
import { useAuth } from "../store/auth";
import ModalNuevoReporte from "../components/Produccion/ModalNuevoReporte";
import type { ReporteProduccion } from "../types/produccion";
import ModalMensaje from "../components/Layout/ModalMensaje";
import Loader from "../components/Layout/Loader";

export default function ProduccionDiaria() {
  const { usuario } = useAuth();
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [mensaje, setMensaje] = createSignal("");
  const [reportes, { refetch }] = createResource<ReporteProduccion[]>(obtenerReportesProduccion);

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Producción Diaria</h1>
        <button
          onClick={() => setModalAbierto(true)}
          class="bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          + Nuevo Reporte
        </button>
      </div>

      <Show when={!reportes.loading} fallback={<Loader />}>
        <div class="overflow-x-auto bg-white shadow rounded">
          <table class="min-w-full text-sm text-left">
            <thead class="bg-gray-200">
              <tr>
                <th class="p-2">SKU</th>
                <th class="p-2">Producto</th>
                <th class="p-2">Cantidad</th>
                <th class="p-2">Cargado por</th>
                <th class="p-2">Fecha</th>
              </tr>
            </thead>
            <tbody>
              <For each={reportes()}>
                {(r) => (
                  <tr class="border-t hover:bg-gray-50">
                    <td class="p-2">{r.producto?.sku}</td>
                    <td class="p-2">{r.producto?.nombre}</td>
                    <td class="p-2">{r.cantidad}</td>
                    <td class="p-2">{r.usuario?.nombre}</td>
                    <td class="p-2">{new Date(r.createdAt).toLocaleDateString()}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>

      <Show when={modalAbierto()}>
        <ModalNuevoReporte
          onCerrar={() => {
            setModalAbierto(false);
            refetch();
          }}
        />
      </Show>

      <Show when={mensaje()}>
        <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje("")} />
      </Show>
    </div>
  );
}
