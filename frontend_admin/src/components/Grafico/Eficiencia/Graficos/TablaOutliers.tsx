import { formatearMiles } from "@/utils/formato";

export default function TablaOutliers({ datos }: { datos: any[] }) {
  return (
    <div class="bg-white p-4 rounded shadow-md overflow-x-auto">
      <h2 class="text-lg font-semibold mb-3">Productos con peor Fill Rate</h2>
      <table class="min-w-full text-sm border">
        <thead>
          <tr class="bg-gray-100 text-left">
            <th class="p-2">Producto</th>
            <th class="p-2">Cod</th>
            <th class="p-2 text-right">Pedidas</th>
            <th class="p-2 text-right">Facturadas</th>
            <th class="p-2 text-right">Fill Rate</th>
          </tr>
        </thead>
        <tbody>
          {datos.map((item) => (
            <tr>
              <td class="p-2">{item.descripcion}</td>
              <td class="p-2">{item.codItem}</td>
              <td class="p-2 text-right">{formatearMiles(item.pedidas)}</td>
              <td class="p-2 text-right">{formatearMiles(item.facturadas)}</td>
              <td class="p-2 text-right">{item.fillRate.toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
