import { createSignal, For, Show } from "solid-js";
import { formatearPrecio, formatearMiles } from "@/utils/formato";

// Toggle minimalista embebido (evita dependencia externa)
function Segmented(props: {
  value: "monto" | "cantidad";
  onChange: (v: "monto" | "cantidad") => void;
}) {
  return (
    <div class="inline-flex bg-gray-100 rounded-full p-1 select-none">
      {(["monto", "cantidad"] as const).map((op) => (
        <button
          class={`px-3 py-1 rounded-full transition ${
            props.value === op ? "bg-white shadow text-gray-900" : "text-gray-500"
          }`}
          onClick={() => props.onChange(op)}
        >
          {op === "monto" ? "Monto" : "Cantidad"}
        </button>
      ))}
    </div>
  );
}

type ItemBasico = { codigo: string; descripcion: string };

type Resumen = {
  top12m: Array<ItemBasico & { monto_12m: number }>;
  crecimientoUltimoMes: Array<ItemBasico & { variacion_mes: number }>;
  enAlza: Array<ItemBasico & { delta_vs_prom3m: number }>;
  enBaja: Array<ItemBasico & { delta_vs_prom3m: number }>;
  proyeccion30d: Array<
    ItemBasico & {
      monto_proyectado_30d: number;
      cant_proyectada_30d: number; // 👈 agregado
    }
  >;
  oportunidades: Array<ItemBasico & { monto_12m: number }>;
  texto?: string; // markdown simple
};

export default function ResumenEjecutivoVentas(props: { data?: Resumen }) {
  const [abierto, setAbierto] = createSignal(false);
  const [modoProj, setModoProj] = createSignal<"monto" | "cantidad">("monto");

  const totalProyectadoMonto = () =>
    (props.data?.proyeccion30d || []).reduce(
      (acc, x) => acc + (x.monto_proyectado_30d || 0),
      0
    );

  const totalProyectadoCant = () =>
    (props.data?.proyeccion30d || []).reduce(
      (acc, x) => acc + (x.cant_proyectada_30d || 0),
      0
    );

  return (
    <Show when={props.data}>
      <div class="space-y-4 mb-6">
        {/* Resumen ejecutivo (colapsable) */}
        <div class="border rounded">
          <button
            class="w-full text-left px-4 py-3 font-semibold flex justify-between items-center"
            onClick={() => setAbierto(!abierto())}
          >
            <span>Resumen ejecutivo</span>
            <span>{abierto() ? "▲" : "▼"}</span>
          </button>
          <Show when={abierto()}>
            <div
              class="px-4 pb-4 text-sm prose prose-sm max-w-none"
              // Permitimos negritas y saltos simples del backend
              innerHTML={(props.data!.texto || "").replace(/\n/g, "<br/>")}
            />

        {/* Proyección 30 días (primero, destacado) */}
        <div class="border rounded p-4 md:col-span-2">
          <div class="flex items-center justify-between mb-2">
            <h3 class="font-semibold">Proyección 30 días</h3>
            <div class="flex items-center gap-3">
              <span class="text-xs px-2 py-1 rounded-full bg-gray-100">
                Total:&nbsp;
                {modoProj() === "monto"
                  ? formatearPrecio(totalProyectadoMonto())
                  : `${totalProyectadoCant()} u.`}
              </span>
              <Segmented value={modoProj()} onChange={setModoProj} />
            </div>
          </div>

          <ul class="space-y-1">
            <For each={props.data!.proyeccion30d}>
              {(i) => (
                <li class="flex justify-between">
                  <span class="truncate">{i.codigo} – {i.descripcion}</span>
                  <span class="font-medium">
                    {modoProj() === "monto"
                      ? formatearPrecio(i.monto_proyectado_30d)
                      : `${formatearMiles(i.cant_proyectada_30d)} u.`}
                  </span>
                </li>
              )}
            </For>
          </ul>
        </div>

        {/* Top 12 meses */}
        <div class="grid md:grid-cols-2 gap-4">
          <div class="border rounded p-4">
            <h3 class="font-semibold mb-2">Top 12 meses ($)</h3>
            <ul class="space-y-1">
              <For each={props.data!.top12m}>
                {(i) => (
                  <li class="flex justify-between">
                    <span class="truncate">{i.codigo} – {i.descripcion}</span>
                    <span class="font-medium">{formatearPrecio(i.monto_12m)}</span>
                  </li>
                )}
              </For>
            </ul>
          </div>

          {/* Crecimiento último mes (normalizado) */}
          <div class="border rounded p-4">
            <h3 class="font-semibold mb-2">Crecimiento último mes (%)</h3>
            <ul class="space-y-1">
              <For each={props.data!.crecimientoUltimoMes}>
                {(i) => (
                  <li class="flex justify-between">
                    <span class="truncate">{i.codigo} – {i.descripcion}</span>
                    <span class={i.variacion_mes >= 0 ? "text-emerald-600" : "text-rose-600"}>
                      {i.variacion_mes.toFixed(1)}%
                    </span>
                  </li>
                )}
              </For>
            </ul>
          </div>

          {/* En alza */}
          <div class="border rounded p-4">
            <h3 class="font-semibold mb-2">En alza</h3>
            <ul class="space-y-1">
              <For each={props.data!.enAlza}>
                {(i) => (
                  <li class="flex justify-between">
                    <span class="truncate">{i.codigo} – {i.descripcion}</span>
                    <span class="text-emerald-600">{i.delta_vs_prom3m.toFixed(1)}%</span>
                  </li>
                )}
              </For>
            </ul>
          </div>

          {/* En baja */}
          <div class="border rounded p-4">
            <h3 class="font-semibold mb-2">En baja</h3>
            <ul class="space-y-1">
              <For each={props.data!.enBaja}>
                {(i) => (
                  <li class="flex justify-between">
                    <span class="truncate">{i.codigo} – {i.descripcion}</span>
                    <span class="text-rose-600">{i.delta_vs_prom3m.toFixed(1)}%</span>
                  </li>
                )}
              </For>
            </ul>
          </div>

          {/* Oportunidades */}
          <div class="border rounded p-4 md:col-span-2">
            <h3 class="font-semibold mb-2">Oportunidades (12m &gt; 0 y 3m = 0)</h3>
            <ul class="space-y-1">
              <For each={props.data!.oportunidades}>
                {(i) => (
                  <li class="flex justify-between">
                    <span class="truncate">{i.codigo} – {i.descripcion}</span>
                    <span class="text-amber-700">{formatearPrecio(i.monto_12m)}</span>
                  </li>
                )}
              </For>
            </ul>
          </div>
        </div>
          </Show>
        </div>

      </div>
    </Show>
  );
}
