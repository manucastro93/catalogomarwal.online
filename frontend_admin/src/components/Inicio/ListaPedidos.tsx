import { createSignal, For, Show, createMemo } from "solid-js";
import { Eye } from "lucide-solid";
import { formatearPrecio, formatearFechaCorta } from "@/utils/formato";
import type { Pedido, PedidoLocal, PedidoDux } from "@/types/pedido";
import VerPedidoModal from "@/components/Pedido/VerPedidoModal";
import VerPedidoDuxModal from "@/components/InformeClientesUltimaCompra/VerPedidoDuxModal";
import { obtenerPedidoPorId } from "@/services/pedido.service";
import { obtenerPedidoDuxPorId } from "@/services/pedido.service";

export default function ListaPedidos(props: {
  titulo: string;
  pedidos: Pedido[];
  color?: string;
}) {
  const [busqueda, setBusqueda] = createSignal("");
  const [orden, setOrden] = createSignal<"fecha" | "total">("fecha");

  const [pedidoLocalSel, setPedidoLocalSel] = createSignal<PedidoLocal | null>(null);
  const [pedidoDuxSel, setPedidoDuxSel] = createSignal<PedidoDux | null>(null);

  // Detectores robustos
  const esDux = (p: Pedido): p is PedidoDux =>
    (p as any).tipo === "dux" ||
    "nro_pedido" in (p as any) ||
    "estado_facturacion" in (p as any);

  const esLocal = (p: Pedido): p is PedidoLocal => !esDux(p);

  const parsePrecio = (v: number | string | null | undefined) => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    const n = v.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
    const val = parseFloat(n);
    return Number.isNaN(val) ? 0 : val;
  };

  const getCliente = (p: Pedido) =>
    esDux(p)
      ? p.cliente || p.clienteDux?.cliente || "—"
      : p.cliente?.nombre ?? p.clienteNombre ?? p.clienteDux?.cliente ?? "—";

  const getFecha = (p: Pedido) =>
    esDux(p)
      ? String(p.fecha ?? "").slice(0, 10)
      : String(p.createdAt ?? "").slice(0, 10);

  const getTotal = (p: Pedido) =>
    esDux(p) ? parsePrecio(p.total) : p.total;

  const getEstado = (p: Pedido) =>
    esDux(p) ? (p.estado_facturacion || "") : (p.estadoPedido?.nombre || "");

  const getNumero = (p: Pedido) => (esDux(p) ? String(p.nro_pedido ?? "") : "");

  const pedidosFiltrados = createMemo(() => {
    const b = busqueda().toLowerCase().trim();
    if (!b) return props.pedidos;

    return props.pedidos.filter((p) => {
      const cliente = (getCliente(p) || "").toLowerCase();
      const fecha = (getFecha(p) || "").toLowerCase();
      const estado = (getEstado(p) || "").toLowerCase();
      const num = getNumero(p).toLowerCase();
      const tot = String(getTotal(p)).toLowerCase();
      return (
        cliente.includes(b) ||
        fecha.includes(b) ||
        estado.includes(b) ||
        num.includes(b) ||
        tot.includes(b)
      );
    });
  });

  const pedidosOrdenados = createMemo(() => {
    const lista = [...pedidosFiltrados()];
    if (orden() === "fecha") {
      return lista.sort(
        (a, b) =>
          new Date(getFecha(b) || 0).getTime() -
          new Date(getFecha(a) || 0).getTime()
      );
    }
    return lista.sort((a, b) => getTotal(b) - getTotal(a));
  });

  const verPedido = async (p: Pedido) => {
    if (esLocal(p)) {
      const completo = await obtenerPedidoPorId(p.id);
      setPedidoLocalSel(completo as PedidoLocal);
      setPedidoDuxSel(null);
    } else {
      const completo = await obtenerPedidoDuxPorId(p.id);
      setPedidoDuxSel(completo as PedidoDux);
      setPedidoLocalSel(null);
    }
  };

  return (
    <div class="bg-white shadow-lg rounded-xl p-4 border border-gray-200">
      <div class="flex flex-col md:flex-row md:justify-between md:items-center gap-2 mb-4">
        <h2 class="text-lg font-bold text-gray-800">{props.titulo}</h2>

        <div class="flex gap-2">
          <input
            type="text"
            placeholder="Buscar por cliente, fecha, estado o nº pedido..."
            class="text-sm px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-400"
            onInput={(e) => setBusqueda(e.currentTarget.value)}
          />
          <select
            class="text-sm px-2 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-400"
            value={orden()}
            onChange={(e) => setOrden(e.currentTarget.value as "fecha" | "total")}
          >
            <option value="fecha">📅 Fecha</option>
            <option value="total">💰 Total</option>
          </select>
        </div>
      </div>

      <ul class="space-y-3 overflow-auto max-h-[70vh]">
        <For each={pedidosOrdenados()}>
          {(p) => (
            <li
              class={`flex justify-between items-center border-l-4 ${
                props.color ?? "border-gray-300"
              } bg-gray-50 rounded px-4 py-3`}
            >
              <div>
                <div class="font-semibold text-gray-700">{getCliente(p)}</div>

                <div class="text-xs text-gray-500">
                  <Show when={esDux(p)}>
                    Nº Pedido: <span class="font-medium">{getNumero(p)}</span> ·{" "}
                  </Show>
                  Estado: <span class="uppercase">{getEstado(p) || "—"}</span>
                </div>

                <div class="text-sm text-gray-600">
                  Total: {formatearPrecio(getTotal(p))} · {formatearFechaCorta(getFecha(p)) }
                </div>
              </div>

              <button
                onClick={() => verPedido(p)}
                class="flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <Eye size={16} />
                Ver
              </button>
            </li>
          )}
        </For>

        <Show when={pedidosOrdenados().length === 0}>
          <li class="text-sm text-gray-400 italic">No hay coincidencias.</li>
        </Show>
      </ul>

      <VerPedidoModal
        pedido={pedidoLocalSel()}
        onClose={() => setPedidoLocalSel(null)}
      />
      <VerPedidoDuxModal
        pedido={pedidoDuxSel()}
        onClose={() => setPedidoDuxSel(null)}
      />
    </div>
  );
}
