import { Show } from "solid-js";
import { formatearPrecio } from "@/utils/formato";

interface DetalleVenta {
  fecha: string;
  cliente: string;
  vendedor: string;
  producto: string;
  cantidad: number;
  total: number;
  comentario?: string;
}

interface Props {
  items: DetalleVenta[];
  modo: string;
}

export default function TablaVentas(props: Props) {
  return (
    <div class="overflow-x-auto mt-5">
      <table id="tabla-ventas" class="w-full table-auto border border-collapse text-sm">
        <thead class="bg-gray-100">
          <tr>
            <th class="border p-2">Fecha</th>
            <th class="border p-2">Cliente</th>
            <th class="border p-2">Vendedor</th>
            <th class="border p-2">Producto</th>
            <th class="border p-2">Cantidad</th>
            <th class="border p-2">Total</th>
            <th class="border p-2">Comentario</th>
          </tr>
        </thead>
        <tbody>
          {props.items.map((item) => (
            <tr class="text-center hover:bg-gray-50">
              <td class="border p-2">{item.fecha}</td>
              <td class="border p-2">{item.cliente}</td>
              <td class="border p-2">{item.vendedor}</td>
              <td class="border p-2">{item.producto}</td>
              <td class="border p-2">{item.cantidad}</td>
              <td class="border p-2">{formatearPrecio(item.total)}</td>
              <td class="border p-2">{item.comentario || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
