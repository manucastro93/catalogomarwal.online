import type { Pedido } from "@/types/pedido";
import ListaPedidos from "./ListaPedidos";

export default function PedidosPendientes(props: {
  pendientes: Pedido[];
  confirmados: Pedido[];
}) {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <ListaPedidos titulo="📦 Pendientes" pedidos={props.pendientes} color="border-yellow-500" />
      <ListaPedidos titulo="✅ Confirmados / Preparando" pedidos={props.confirmados} color="border-green-600" />
    </div>
  );
}
