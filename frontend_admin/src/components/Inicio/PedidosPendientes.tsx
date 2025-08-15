import type { Pedido } from "@/types/pedido";
import ListaPedidosDux from "./ListaPedidos";

export default function PedidosDuxPendientes(props: {
  pendientes: Pedido[];
  confirmados: Pedido[];
}) {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ListaPedidosDux titulo="📦 Pendientes" pedidos={props.pendientes} color="border-yellow-500" />
      <ListaPedidosDux titulo="✅ Facturados / Cerrados" pedidos={props.confirmados} color="border-green-600" />
    </div>
  );
}
