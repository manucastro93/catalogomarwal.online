import { createSignal, Accessor } from "solid-js";
import { formatearMiles, formatearFechaCorta } from "@/utils/formato";
import type { ResumenEficiencia } from "@/types/eficiencia";

interface Props {
  desde: Accessor<string>;
  hasta: Accessor<string>;
  resumen: Accessor<ResumenEficiencia | undefined>;
}

export default function ResumenTextoEficiencia({
  desde,
  hasta,
  resumen,
}: Props) {
  const [mostrarResumen, setMostrarResumen] = createSignal(false);
  if (!resumen) {
    return (
      <div class="text-gray-500 text-sm text-center">
        Cargando resumen ejecutivo...
      </div>
    );
  }
  return (
    <div class="bg-white p-4 rounded shadow-md text-sm md:text-base border border-gray-200 space-y-3">
      <button
        class="text-blue-600 hover:underline font-semibold"
        onClick={() => setMostrarResumen(!mostrarResumen())}
      >
        {mostrarResumen() ? "🔽 Ocultar resumen" : "📌 Ver resumen"}
      </button>

      <div
        class={`transition-all duration-500 ease-in-out overflow-hidden ${
          mostrarResumen()
            ? "max-h-[1000px] opacity-100 mt-4"
            : "max-h-0 opacity-0"
        }`}
      >
        <div class="space-y-4">
          <p class="text-gray-600 font-medium">
            <b>Período analizado:</b> del {formatearFechaCorta(desde())} al{" "} {formatearFechaCorta(hasta())}
          </p>

          <p>
            Durante el período evaluado se procesaron{" "}
            <b>{formatearMiles(resumen()?.totalPedidos)} pedidos</b>, de los
            cuales{" "}
            <b>
              {formatearMiles(resumen()?.totalFacturas)} fueron efectivamente
              facturados
            </b>
            .
          </p>

          <p>
            El <b>Fill Rate promedio</b> fue del{" "}
            <b>{resumen()?.fillRateGeneral}%</b>, con una{" "}
            <b>variación del {resumen()?.variacionFillRate ?? "—"}%</b>. El{" "}
            <b>Lead Time</b> promedio fue de{" "}
            <b>{resumen()?.leadTimePromedioDias} días</b>, con un{" "}
            <b>desvío de {resumen()?.variacionLeadTime ?? "—"} días</b>.
          </p>

          <p>
            Se identificaron <b>{resumen()?.cantidadRetrasos} casos</b> con Lead
            Time superior a 7 días. El{" "}
            <b>{resumen()?.porcentajePedidosAltosFillRate}%</b> de los pedidos
            tuvo un Fill Rate superior al 95%, mientras que un{" "}
            <b>{resumen()?.porcentajePedidosBajoFillRate}%</b> quedó por debajo
            del 80%.
          </p>

          <div class="space-y-4">
  <div>
    <p class="font-semibold">Clientes con mejor performance:</p>
    <ul class="list-disc list-inside text-sm text-gray-700">
      {resumen()?.topClientesEficientes?.map(
        (c: { cliente: string }) => (
          <li>{c.cliente}</li>
        )
      ) || <li>—</li>}
    </ul>
  </div>

  <div>
    <p class="font-semibold">Clientes con peor performance:</p>
    <ul class="list-disc list-inside text-sm text-gray-700">
      {resumen()?.topClientesIneficientes?.map(
        (c: { cliente: string }) => (
          <li>{c.cliente}</li>
        )
      ) || <li>—</li>}
    </ul>
  </div>

  <div>
    <p class="font-semibold">Productos con mayor nivel de incumplimiento:</p>
    <ul class="list-disc list-inside text-sm text-gray-700">
      {resumen()?.topProductosProblema?.map(
        (p: { producto: string }) => (
          <li>{p.producto}</li>
        )
      ) || <li>—</li>}
    </ul>
  </div>
</div>

        </div>
      </div>
    </div>
  );
}
