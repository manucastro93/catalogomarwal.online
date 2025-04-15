import { createResource } from 'solid-js';
import { obtenerResumenDelMes } from '../services/estadisticas.service';

export default function Estadisticas() {
  const [resumen] = createResource(obtenerResumenDelMes);

  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-6">Estadísticas</h1>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="bg-white p-4 rounded shadow">
          <h2 class="text-lg font-semibold mb-2">Pedidos del mes</h2>
          <p class="text-3xl">{resumen()?.pedidosDelMes ?? '...'}</p>
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h2 class="text-lg font-semibold mb-2">Producto estrella</h2>
          <p>{resumen()?.productoEstrella?.Producto?.nombre ?? '-'}</p>
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h2 class="text-lg font-semibold mb-2">Vendedor con más ventas</h2>
          <p>{resumen()?.vendedorTop?.nombre ?? '-'}</p>
        </div>

        <div class="bg-white p-4 rounded shadow">
          <h2 class="text-lg font-semibold mb-2">Categoría más vendida</h2>
          <p>{resumen()?.categoriaTop?.nombre ?? '-'}</p>
        </div>
      </div>
    </div>
  );
}
