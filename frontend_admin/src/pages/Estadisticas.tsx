import { createResource, Show } from 'solid-js';
import { obtenerResumenDelMes } from '../services/estadisticas.service';
import ResumenEstadisticasMensuales from '../components/Estadistica/ResumenEstadisticasMensuales';
import GraficoVentasPorCategoria from '../components/Estadistica/GraficoVentasPorCategoria';
import Loader from '../components/Layout/Loader';

export default function Estadisticas() {
  const [resumen] = createResource(obtenerResumenDelMes);

  return (
    <div class="p-4 space-y-6">
      <h1 class="text-2xl font-bold text-gray-800">Estadísticas del Mes</h1>

      <Show when={resumen()} fallback={<Loader />}>
        {(data) => {
          console.log('📦 Resumen recibido:', data());
          return (
            <>
              <ResumenEstadisticasMensuales resumen={data()} />

              <div class="mt-6">
                <GraficoVentasPorCategoria />
              </div>
            </>
          );
        }}
      </Show>
    </div>
  );
}
