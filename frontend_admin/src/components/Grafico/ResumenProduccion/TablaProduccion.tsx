import { ResumenProduccion } from "../../../types/grafico";
import { ROLES_USUARIOS } from "../../../constants/rolesUsuarios";

interface Props {
  items: ResumenProduccion[];
  rolUsuarioId: number;
  modo: string;
}

export default function TablaProduccion(props: Props) {
  return (
    <div class="overflow-x-auto mt-60">
      <table class="w-full table-auto border border-collapse text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="border p-2">Fecha</th>
            <th class="border p-2">Planta</th>
            <th class="border p-2">Categoría</th>
            <th class="border p-2">SKU</th>
            <th class="border p-2">Producto</th>
            <th class="border p-2">Turno</th>
            <th class="border p-2">Cantidad</th>
            {props.rolUsuarioId !== ROLES_USUARIOS.OPERARIO && (
              <>
                <th class="border p-2">Costo MP</th>
                <th class="border p-2">Valor Total</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {props.items.map((item, index) => (
            <tr class="text-center hover:bg-gray-50">
              <td class="border p-2">{item.fecha}</td>
              <td class="border p-2">{item.planta}</td>
              <td class="border p-2">{item.categoria}</td>
              <td class="border p-2">{item.producto?.sku || "Sin SKU"}</td>
              <td class="border p-2">{item.producto?.nombre || "Sin Producto"}</td>
              <td class="border p-2">{item.turno}</td>
              <td class="border p-2">{item.cantidad}</td>
              {props.rolUsuarioId !== ROLES_USUARIOS.OPERARIO && (
                <>
                  <td class="border p-2">${Number(item.totalCostoMP || 0).toLocaleString()}</td>
                  <td class="border p-2">${Number(item.totalValor || 0).toLocaleString()}</td>
                </>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
