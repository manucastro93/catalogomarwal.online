import { createSignal, createResource, onMount, onCleanup, Show, For } from "solid-js";
import { Bar, Pie } from "solid-chartjs";
import flatpickr from "flatpickr";
import type { Instance } from "flatpickr/dist/types/instance";
import "flatpickr/dist/flatpickr.min.css";

import {
  fetchResumenProduccion,
  fetchResumenProduccionPorPlanta,
  fetchResumenProduccionPorCategoria,
  fetchResumenProduccionPorTurno,
  fetchResumenProduccionGeneral,
} from "../../services/graficos.service";
import { obtenerPlantas } from "../../services/planta.service";
import { obtenerCategorias } from "../../services/categoria.service";

export default function ResumenProduccion() {
  const today = new Date();
  const primerDiaMes = new Date(today.getFullYear(), today.getMonth(), 1);

  const [desde, setDesde] = createSignal(primerDiaMes.toISOString().slice(0, 10));
  const [hasta, setHasta] = createSignal(today.toISOString().slice(0, 10));
  const [turno, setTurno] = createSignal("");
  const [plantaId, setPlantaId] = createSignal("");
  const [categoriaId, setCategoriaId] = createSignal("");

  const [plantas] = createResource(obtenerPlantas);
  const [categorias] = createResource(obtenerCategorias);

  const [resumen, { refetch: refetchResumen }] = createResource(
    () => ({ desde: desde(), hasta: hasta(), turno: turno(), plantaId: plantaId(), categoriaId: categoriaId() }),
    fetchResumenProduccion
  );
  const [resumenPlanta, { refetch: refetchResumenPlanta }] = createResource(
    () => ({ desde: desde(), hasta: hasta(), turno: turno(), plantaId: plantaId(), categoriaId: categoriaId() }),
    fetchResumenProduccionPorPlanta
  );
  const [resumenCategoria, { refetch: refetchResumenCategoria }] = createResource(
    () => ({ desde: desde(), hasta: hasta(), turno: turno(), plantaId: plantaId(), categoriaId: categoriaId() }),
    fetchResumenProduccionPorCategoria
  );
  const [resumenTurno, { refetch: refetchResumenTurno }] = createResource(
    () => ({ desde: desde(), hasta: hasta(), turno: turno(), plantaId: plantaId(), categoriaId: categoriaId() }),
    fetchResumenProduccionPorTurno
  );
  const [resumenGeneral, { refetch: refetchResumenGeneral }] = createResource(
    () => ({ desde: desde(), hasta: hasta(), turno: turno(), plantaId: plantaId(), categoriaId: categoriaId() }),
    fetchResumenProduccionGeneral
  );

  let desdeInput: HTMLInputElement | undefined;
  let hastaInput: HTMLInputElement | undefined;
  let desdePicker: Instance | undefined;
  let hastaPicker: Instance | undefined;

  function actualizarFiltros() {
    refetchResumen();
    refetchResumenPlanta();
    refetchResumenCategoria();
    refetchResumenTurno();
    refetchResumenGeneral();
  }

  onMount(() => {
    if (desdeInput) {
      desdePicker = flatpickr(desdeInput, {
        dateFormat: "Y-m-d",
        defaultDate: primerDiaMes,
        onChange: ([selectedDate]) => {
          if (selectedDate) {
            setDesde(selectedDate.toISOString().slice(0, 10));
            actualizarFiltros();
          }
        },
      });
    }

    if (hastaInput) {
      hastaPicker = flatpickr(hastaInput, {
        dateFormat: "Y-m-d",
        defaultDate: today,
        onChange: ([selectedDate]) => {
          if (selectedDate) {
            setHasta(selectedDate.toISOString().slice(0, 10));
            actualizarFiltros();
          }
        },
      });
    }
  });

  onCleanup(() => {
    desdePicker?.destroy();
    hastaPicker?.destroy();
  });

  function limpiarFiltros() {
    setDesde(primerDiaMes.toISOString().slice(0, 10));
    setHasta(today.toISOString().slice(0, 10));
    setTurno("");
    setPlantaId("");
    setCategoriaId("");
    if (desdeInput) desdeInput.value = primerDiaMes.toISOString().slice(0, 10);
    if (hastaInput) hastaInput.value = today.toISOString().slice(0, 10);
    actualizarFiltros();
  }

  function totalizar(data: any[], campo: string) {
    return data.reduce((acc, item) => acc + (Number(item[campo]) || 0), 0);
  }

  return (
    <div class="p-6 space-y-8">
      <h1 class="text-2xl font-bold mb-4">Resumen de Producción Diaria 📈</h1>

      {/* Filtros */}
      <div class="flex flex-wrap gap-4 mb-6 items-center">
        <input ref={(el) => desdeInput = el} class="border p-2 rounded" placeholder="Desde" readonly />
        <input ref={(el) => hastaInput = el} class="border p-2 rounded" placeholder="Hasta" readonly />

        <select value={turno()} onInput={(e) => { setTurno(e.currentTarget.value); actualizarFiltros(); }} class="border p-2 rounded">
          <option value="">Todos los Turnos</option>
          <option value="mañana">Mañana</option>
          <option value="tarde">Tarde</option>
          <option value="noche">Noche</option>
        </select>

        <select value={plantaId()} onInput={(e) => { setPlantaId(e.currentTarget.value); actualizarFiltros(); }} class="border p-2 rounded">
          <option value="">Todas las Plantas</option>
          <For each={plantas()}>
            {(planta) => <option value={planta.id}>{planta.nombre}</option>}
          </For>
        </select>

        <select value={categoriaId()} onInput={(e) => { setCategoriaId(e.currentTarget.value); actualizarFiltros(); }} class="border p-2 rounded">
          <option value="">Todas las Categorías</option>
          <For each={categorias()}>
            {(categoria) => <option value={categoria.id}>{categoria.nombre}</option>}
          </For>
        </select>

        <button onClick={limpiarFiltros} class="bg-gray-400 text-white px-4 py-2 rounded">Limpiar</button>
      </div>

      {/* Totales generales */}
      <Show when={resumenGeneral()}>
        <div class="bg-gray-100 p-4 rounded shadow-md">
          <p><b>Total Costo MP:</b> ${Number(resumenGeneral()?.totalCostoMP).toLocaleString()}</p>
          <p><b>Total Precio Unitario:</b> ${Number(resumenGeneral()?.totalPrecioUnitario).toLocaleString()}</p>
        </div>
      </Show>

      {/* Gráficos en Fila */}
      <div class="flex flex-wrap">

        {/* Planta */}
        <div class="w-full md:w-1/3 flex flex-col justify-between h-[500px] p-4 shadow rounded bg-white">
          <h2 class="text-xl font-semibold mb-4 text-center">Producción por Planta</h2>
          <Show when={resumenPlanta() && resumenPlanta()!.length > 0} fallback={<p class="text-center text-gray-500 mt-10">No se encontraron datos</p>}>
            <div class="flex-1">
              <Bar
                data={{
                  labels: resumenPlanta()!.map(p => p.planta),
                  datasets: [
                    { label: "Precio Unitario", data: resumenPlanta()!.map(p => p.totalPrecioUnitario), backgroundColor: "rgba(54, 162, 235, 0.6)" },
                    { label: "Costo MP", data: resumenPlanta()!.map(p => p.totalCostoMP), backgroundColor: "rgba(255, 99, 132, 0.6)" }
                  ]
                }}
              />
            </div>
            <div class="text-sm text-center mt-4">
              <p><b>Total Costo MP Planta:</b> ${totalizar(resumenPlanta() ?? [], "totalCostoMP").toLocaleString()}</p>
              <p><b>Total Precio Unitario Planta:</b> ${totalizar(resumenPlanta() ?? [], "totalPrecioUnitario").toLocaleString()}</p>
            </div>
          </Show>
        </div>

        {/* Categoría */}
        <div class="w-full md:w-1/3 flex flex-col justify-between h-[500px] p-4 shadow rounded bg-white">
          <h2 class="text-xl font-semibold mb-4 text-center">Producción por Categoría</h2>
          <Show when={resumenCategoria() && resumenCategoria()!.length > 0} fallback={<p class="text-center text-gray-500 mt-10">No se encontraron datos</p>}>
            <div class="flex-1">
              <Pie
                data={{
                  labels: resumenCategoria()!.map(c => c.categoria),
                  datasets: [
                    { data: resumenCategoria()!.map(c => c.totalPrecioUnitario),
                      backgroundColor: ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#8dd1e1", "#a4de6c", "#d0ed57", "#ffc0cb"] }
                  ]
                }}
              />
            </div>
          </Show>
        </div>

        {/* Turno */}
        <div class="w-full md:w-1/3 flex flex-col justify-between h-[500px] p-4 shadow rounded bg-white">
          <h2 class="text-xl font-semibold mb-4 text-center">Producción por Turno</h2>
          <Show when={resumenTurno() && resumenTurno()!.length > 0} fallback={<p class="text-center text-gray-500 mt-10">No se encontraron datos</p>}>
            <div class="flex-1">
              <Bar
                data={{
                  labels: resumenTurno()!.map(t => t.turno),
                  datasets: [
                    { label: "Precio Unitario", data: resumenTurno()!.map(t => t.totalPrecioUnitario), backgroundColor: "rgba(255, 206, 86, 0.6)" }
                  ]
                }}
              />
            </div>
          </Show>
        </div>

      </div>

            {/* Tabla de producción */}
            <Show when={resumen()}>
        <div class="overflow-x-auto">
          <table class="w-full table-auto border border-collapse">
            <thead class="bg-gray-200">
              <tr>
                <th class="border p-2">Fecha</th>
                <th class="border p-2">Planta</th>
                <th class="border p-2">Categoría</th>
                <th class="border p-2">Turno</th>
                <th class="border p-2">Costo MP</th>
                <th class="border p-2">Precio Unitario</th>
              </tr>
            </thead>
            <tbody>
              <For each={resumen()}>
                {(item) => (
                  <tr class="text-center hover:bg-gray-100">
                    <td class="border p-2">{item.fecha}</td>
                    <td class="border p-2">{item.planta}</td>
                    <td class="border p-2">{item.categoria}</td>
                    <td class="border p-2">{item.turno}</td>
                    <td class="border p-2">${Number(item.totalCostoMP).toLocaleString()}</td>
                    <td class="border p-2">${Number(item.totalPrecioUnitario).toLocaleString()}</td>
                  </tr>
                )}
              </For>
            </tbody>
          </table>
        </div>
      </Show>

    </div>
  );
}
