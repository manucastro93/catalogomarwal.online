import { createResource, Show, For } from "solid-js";
import {
  obtenerResumenDelMes,
  obtenerEstadisticasPorFecha,
  compararRangos,
  obtenerRankingEstadisticas,
} from "../services/estadisticas.service";
import { formatearPrecio } from "../utils/formato";
import GraficoEstadisticasPorFecha from "../components/Estadistica/GraficoEstadisticasPorFecha";
import ComparadorDeRangos from "../components/Estadistica/ComparadorDeRangos";
import RankingEstadisticas from "../components/Estadistica/RankingEstadisticas";
import ResumenEstadisticasMensuales from "../components/Estadistica/ResumenEstadisticasMensuales";

export default function Estadisticas() {
  const [resumen] = createResource(obtenerResumenDelMes);

  return (
    <div class="p-6 space-y-6">
      <h1 class="text-2xl font-bold">Estadísticas del mes</h1>

      <Show when={resumen()} fallback={<p>Cargando estadísticas...</p>}>
        <ResumenEstadisticasMensuales resumen={resumen()} />
      </Show>

      <GraficoEstadisticasPorFecha />
      <ComparadorDeRangos />
      <RankingEstadisticas />
    </div>
  );
}
