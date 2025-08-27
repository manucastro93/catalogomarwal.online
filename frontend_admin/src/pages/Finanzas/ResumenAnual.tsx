import { createSignal, createResource, Show } from "solid-js";
import { obtenerResumenFinanzas } from "@/services/finanzas.service";
import Loader from "@/components/Layout/Loader";
import GastosDetalleModal from "@/components/Finanzas/GastosDetalleModal";
import TablaMensual, { RowData } from "@/components/Finanzas/TablaMensual";

export default function ResumenAnual() {
  const [anio, setAnio] = createSignal(new Date().getFullYear());
  const [verGastos, setVerGastos] = createSignal(false);

  const [data, { refetch }] = createResource(
    () => ({ anio: anio() }),
    obtenerResumenFinanzas
  );

  const rows = (): RowData[] => data()
    ? [
        { id: "facturacion", label: "Facturación", valores: data()!.facturacion.valores, variacion: data()!.facturacion.variacion },
        { id: "cmv", label: "Costo mercadería", valores: data()!.cmv.valores, variacion: data()!.cmv.variacion },
        { id: "resultadoBruto", label: "Resultado bruto", valores: data()!.resultadoBruto.valores, variacion: data()!.resultadoBruto.variacion, emphasize: true },
        { id: "gastos", label: "Gastos (comprobantes de servicios)", valores: data()!.gastos.valores, variacion: data()!.gastos.variacion, onClick: () => setVerGastos(true) },
        { id: "resultadoFinal", label: "Resultado final", valores: data()!.resultadoFinal.valores, variacion: data()!.resultadoFinal.variacion, emphasize: true },
      ]
    : [];

  return (
    <div class="p-6 space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Finanzas · Resumen anual</h1>
        <div class="flex items-center gap-2">
          <input
            type="number"
            class="border rounded-lg px-3 py-1.5 w-28 focus:ring focus:ring-primary/40"
            value={anio()}
            onInput={(e) => setAnio(Number((e.target as HTMLInputElement).value))}
          />
          <button
            class="px-3 py-1.5 rounded-lg bg-primary text-white hover:brightness-95"
            onClick={() => refetch()}
          >
            Actualizar
          </button>
        </div>
      </div>

      <Show when={!data.loading} fallback={<Loader />}>
        <TablaMensual rows={rows()} />
      </Show>

      <Show when={verGastos()}>
        <GastosDetalleModal anio={anio()} onClose={() => setVerGastos(false)} />
      </Show>
    </div>
  );
}
