import { createSignal, createEffect, onCleanup, For, Show } from "solid-js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Cliente } from "@/types/cliente";
import { obtenerClientesConVentas } from "@/services/cliente.service";

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function ModalMapaClientes(props: Props) {
  const [mapa, setMapa] = createSignal<L.Map | null>(null);
  const [sinUbicacion, setSinUbicacion] = createSignal<Cliente[]>([]);
  const containerId = "mapaClientes";

  createEffect(async () => {
    if (!props.abierto) return;

    const clientes = await obtenerClientesConVentas();

    const conCoords = clientes.filter(c => c.latitud && c.longitud);
    const sinCoords = clientes.filter(c => !c.latitud || !c.longitud);
    setSinUbicacion(sinCoords);

    setTimeout(() => {
      mapa()?.remove();

      const nuevoMapa = L.map(containerId, {
        center: [-34.6, -58.4],
        zoom: 5,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(nuevoMapa);

      const marcadores: L.Layer[] = [];

      conCoords.forEach((cliente) => {
        const total = cliente.totalVentas || 0;
        const totalMaximo = 1000000;
        const porcentaje = Math.min(total / totalMaximo, 1);
        const radio = 300 + porcentaje * 1200;

        let color = "#2053ed"; // verde
        if (total < 10000) color = "#f87171"; // rojo
        else if (total < 50000) color = "#facc15"; // amarillo

        const circulo = L.circle([cliente.latitud!, cliente.longitud!], {
          color,
          fillColor: color,
          fillOpacity: 0.5,
          radius: radio,
        })
          .addTo(nuevoMapa)
          .bindPopup(
            `<strong>${cliente.nombre}</strong><br>Compró por: $${total.toLocaleString(
              "es-AR"
            )}`
          );

        marcadores.push(circulo);
      });

      // Zoom automático
      if (marcadores.length > 0) {
        const grupo = L.featureGroup(marcadores);
        nuevoMapa.fitBounds(grupo.getBounds().pad(0.2));
      }

      setMapa(nuevoMapa);
    }, 300);
  });

  onCleanup(() => {
    mapa()?.remove();
  });

  return (
    <div
      class={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${
        props.abierto ? "" : "hidden"
      }`}
    >
      <div class="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[95vh] p-4 relative flex flex-col overflow-hidden">
        <h2 class="text-xl font-bold mb-4">
          Mapa de clientes según volumen de compras
        </h2>
        <div class="flex-1 overflow-hidden">
          <div
            id={containerId}
            class="w-full h-full rounded border"
            style="min-height: 400px"
          />
        </div>
        <Show when={sinUbicacion().length}>
          <div class="mt-4 text-sm text-gray-600 overflow-y-auto max-h-32">
            <p class="font-semibold mb-1">Clientes sin ubicación:</p>
            <ul class="list-disc list-inside space-y-1">
              <For each={sinUbicacion()}>
                {(c) => <li>{c.nombre} ({c.email})</li>}
              </For>
            </ul>
          </div>
        </Show>
        <button
          onClick={props.onCerrar}
          class="absolute top-2 right-2 text-gray-500 hover:text-black text-xl"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
