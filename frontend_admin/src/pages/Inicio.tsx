import { createResource, For, Show } from 'solid-js';
import { useNavigate } from '@solidjs/router';
import { FaBrandsWhatsapp } from 'solid-icons/fa';
import { useAuth } from '@/store/auth';
import { obtenerResumenDelMes } from '@/services/estadisticas.service';
import { obtenerPedidosInicio } from '@/services/pedido.service';
import { formatearPrecio } from '@/utils/formato';
import ResumenInicioMensual from '@/components/Estadistica/ResumenInicioMensual';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';

export default function Inicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [resumen] = createResource(obtenerResumenDelMes);
  const [pedidos] = createResource(() =>
    obtenerPedidosInicio(usuario()?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR ? usuario()?.id : undefined)
  );

  const linkVendedor =
    usuario()?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR && usuario()?.link
      ? `https://catalogomarwal.online?${usuario()?.link}`
      : "";
  const mensaje = `Hola! Te comparto el catálogo de Marwal para que veas los productos: ${linkVendedor}`;
  const compartirPorWhatsapp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  return (
    <div class="p-6 space-y-6">
      <Show when={usuario()?.rolUsuarioId === ROLES_USUARIOS.OPERARIO}>
        <div class="flex justify-end">
          <button
            onClick={() => navigate("/Produccion/ProduccionDiaria")}
            class="bg-blue-600 text-white px-5 py-2 rounded text-base hover:bg-blue-700 transition"
          >
            ➕ Registrar producción diaria
          </button>
        </div>
      </Show>
      <Show when={usuario()?.rolUsuarioId === ROLES_USUARIOS.VENDEDOR}>
        <div class="flex justify-end gap-4">
          <button
            onClick={() => navigate("/pedido-rapido")}
            class="bg-purple-600 text-white px-5 py-2 rounded text-base hover:bg-purple-700 transition"
          >
            Crear Pedido Rápido
          </button>
          <button
            onClick={compartirPorWhatsapp}
            class="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <FaBrandsWhatsapp />
            Compartir mi link por WhatsApp
          </button>
        </div>
      </Show>
      <Show when={usuario()?.rolUsuarioId !== ROLES_USUARIOS.OPERARIO}>
        <div>
          <h1 class="text-2xl font-bold mb-2">Resumen del mes</h1>
          <Show when={resumen()}>
            <ResumenInicioMensual resumen={resumen()} />
          </Show>
        </div>
      
        <Show when={pedidos()}>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h2 class="text-xl font-semibold mb-3">Pedidos Pendientes</h2>
              <ul class="space-y-2">
                <For each={pedidos()?.pendientes}>
                  {(pedido) => (
                    <li class="border rounded px-4 py-2 shadow">
                      <div class="font-medium">{pedido.cliente?.nombre}</div>
                      <div class="text-sm text-gray-500">
                        Total: {formatearPrecio(pedido.total)} · {pedido.createdAt.slice(0, 10)}
                      </div>
                    </li>
                  )}
                </For>
              </ul>
            </div>
            <div>
              <h2 class="text-xl font-semibold mb-3">Confirmado / Preparando</h2>
              <ul class="space-y-2">
                <For each={pedidos()?.confirmados}>
                  {(pedido) => (
                    <li class="border rounded px-4 py-2 shadow">
                      <div class="font-medium">{pedido.cliente?.nombre}</div>
                      <div class="text-sm text-gray-500">
                        Total: {formatearPrecio(pedido.total)} · {pedido.createdAt.slice(0, 10)}
                      </div>
                    </li>
                  )}
                </For>
              </ul>
            </div>
          </div>
        </Show>
      </Show>
    </div>
  );
}
