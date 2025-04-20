import { createResource, For, Show } from "solid-js";
import { useNavigate } from "@solidjs/router";
import { FaBrandsWhatsapp } from "solid-icons/fa";
import { useAuth } from "../store/auth";
import { obtenerResumenDelMes } from "../services/estadisticas.service";
import { formatearPrecio } from "../utils/formato";
import ResumenInicioMensual from "../components/Estadistica/ResumenInicioMensual";

export default function Inicio() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [resumen] = createResource(obtenerResumenDelMes);
  const linkVendedor =
    usuario()?.rol === "vendedor" && usuario()?.link
      ? `https://catalogomarwal.online?${usuario()?.link}`
      : "";
  const mensaje = `Hola! Te comparto el catálogo de Marwal para que veas los productos: ${linkVendedor}`;
  const compartirPorWhatsapp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
    window.open(url, "_blank");
  };

  return (
    <div class="p-6">
      <Show when={usuario()?.rol === "vendedor"}>
        <div class="mb-4 text-right">
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

      <h1 class="text-2xl font-bold mb-6">Resumen del mes</h1>

      <Show when={resumen()}>
        <ResumenInicioMensual resumen={resumen()} />
      </Show>
    </div>
  );
}
