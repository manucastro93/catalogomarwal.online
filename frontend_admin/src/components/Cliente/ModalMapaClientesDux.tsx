// src/components/Cliente/ModalMapaClientesDux.tsx
import { createSignal, createEffect, onCleanup, createMemo, Show, For } from "solid-js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatearPrecio, formatearFechaCorta } from "@/utils/formato";
import { obtenerClientesDuxGeo, geocodificarClientesDux } from "@/services/clienteDux.service";

type GeoPrecision = "direccion" | "localidad" | "provincia" | "ninguno" | null;

interface ClienteGeo {
  id: number;
  cliente: string;
  nombreFantasia?: string | null;
  domicilio?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  lat?: number | null;  // alias en controller: c.latitud AS lat
  lng?: number | null;  // alias en controller: c.longitud AS lng
  geoPrecision?: GeoPrecision;
  vendedorNombre?: string | null;
  volumenTotal?: number | null;
  totalPedidos?: number | null;
  fechaUltimaCompra?: string | null;
  montoUltimaCompra?: number | null;
  geoFuente?: "google" | "nominatim" | null; // si lo devolvés
  geoActualizadoAt?: string | null;          // si lo devolvés
}

interface Props {
  abierto: boolean;
  onCerrar: () => void;
}

export default function ModalMapaClientesDux(props: Props) {
  const [mapa, setMapa] = createSignal<L.Map | null>(null);
  const [datos, setDatos] = createSignal<ClienteGeo[]>([]);
  const [sinUbicacion, setSinUbicacion] = createSignal<ClienteGeo[]>([]);
  const [cargando, setCargando] = createSignal(false);
  const [procesando, setProcesando] = createSignal(false);
  const containerId = "mapaClientes"; // mantiene tu id original

  // ---------- helpers de escala ----------
  const vRef = createMemo(() => {
    const vals = datos().map(d => d.volumenTotal || 0).filter(v => v > 0).sort((a,b)=>a-b);
    if (!vals.length) return 1;
    const idx = Math.floor(0.95 * (vals.length - 1));
    return Math.max(vals[idx], 1);
  });
  const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));

  function radioPix(volumenTotal?: number | null, precision?: GeoPrecision | null) {
    const base = Math.sqrt(Math.max(volumenTotal || 0, 0) / vRef()) * 20; // K=20
    let r = clamp(base, 5, 22);
    if (precision === "localidad") r = Math.min(r, 14);
    if (precision === "provincia") r = Math.min(r, 12);
    if (!precision || precision === "ninguno") r = 6;
    return r;
  }

  function opacidadRecencia(fechaUltima?: string | null, precision?: GeoPrecision | null) {
    let op = 0.15;
    if (fechaUltima) {
      const dias = (Date.now() - new Date(fechaUltima).getTime()) / 86400000;
      if      (dias <= 30)  op = 0.85;
      else if (dias <= 90)  op = 0.65;
      else if (dias <= 180) op = 0.40;
      else                  op = 0.20;
    }
    if (precision === "localidad") op = Math.max(op - 0.1, 0.1);
    if (precision === "provincia") op = Math.max(op - 0.2, 0.08);
    if (!precision || precision === "ninguno") op = 0.12;
    return op;
  }

  function bordePorPrecision(precision?: GeoPrecision | null) {
    if (precision === "direccion") return { color: "#2563eb", weight: 2 } as const;                 // azul
    if (precision === "localidad") return { color: "#f59e0b", weight: 2, dashArray: "4,4" } as const; // ámbar
    if (precision === "provincia") return { color: "#6b7280", weight: 2, dashArray: "1,6" } as const; // gris
    return { color: "#9ca3af", weight: 1, dashArray: "1,6" } as const;                               // gris claro
  }
  const rellenoPorPrecision = (p?: GeoPrecision | null) =>
    p === "direccion" ? "#2563eb" : p === "localidad" ? "#f59e0b" : p === "provincia" ? "#6b7280" : "#9ca3af";

  // ---------- carga + render ----------
  async function cargar() {
    setCargando(true);
    try {
      // NO filtramos acá: necesitamos también los que no tienen coords para el listado
      const r = await obtenerClientesDuxGeo();
      setDatos(r || []);
      const sin = (r || []).filter((c: ClienteGeo) => !c.lat || !c.lng || !c.geoPrecision || c.geoPrecision === "ninguno");
      setSinUbicacion(sin);
    } finally {
      setCargando(false);
    }
  }

  function crearMapaBase(): L.Map {
    mapa()?.remove();
    const m = L.map(containerId, {
      center: [-38.4161, -63.6167],
      zoom: 5,
      zoomControl: true
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(m);
    setMapa(m);
    return m;
  }

  function popupHTML(c: ClienteGeo) {
    const nombre = c.nombreFantasia || c.cliente;
    const loc = [c.localidad, c.provincia].filter(Boolean).join(", ");
    const vol = c.volumenTotal != null ? formatearPrecio(c.volumenTotal) : "—";
    const ultFecha = c.fechaUltimaCompra ? formatearFechaCorta(c.fechaUltimaCompra) : "—";
    const ultMonto = c.montoUltimaCompra != null ? formatearPrecio(c.montoUltimaCompra) : "—";
    const vendedor = c.vendedorNombre || "—";
    return `
      <div style="min-width:260px">
        <div style="font-weight:700;margin-bottom:4px">${nombre}</div>
        ${c.domicilio ? `${c.domicilio}<br/>` : ""}
        ${loc ? `${loc}<br/>` : ""}
        <div style="margin-top:6px">
          <small>
            <b>Total histórico:</b> ${vol}<br/>
            <b>Pedidos:</b> ${c.totalPedidos ?? 0}<br/>
            <b>Última compra:</b> ${ultFecha} (${ultMonto})<br/>
            <b>Vendedor:</b> ${vendedor}
          </small>
        </div>
      </div>
    `;
  }

  function render() {
    const m = crearMapaBase();
    const capas: L.Layer[] = [];

    datos().forEach((c) => {
      if (c.lat == null || c.lng == null) return; // al mapa solo con coords

      const precision = (c.geoPrecision ?? "ninguno") as GeoPrecision;
      const borde = bordePorPrecision(precision);
      const fill = rellenoPorPrecision(precision);
      const r = radioPix(c.volumenTotal, precision);
      const op = opacidadRecencia(c.fechaUltimaCompra, precision);

      const marker = L.circleMarker([c.lat, c.lng], {
        radius: r,
        color: borde.color,
        weight: borde.weight,
        dashArray: (borde as any).dashArray,
        fillColor: fill,
        fillOpacity: op,
      }).addTo(m).bindPopup(popupHTML(c));

      capas.push(marker);
    });

    if (capas.length) {
      const grupo = L.featureGroup(capas);
      m.fitBounds(grupo.getBounds().pad(0.2));
    }
  }

  async function geocodificarAhora() {
    try {
      setProcesando(true);
      // Solo faltantes; podés ajustar el limit
      await geocodificarClientesDux({ onlyMissing: true, limit: 500 });
      await cargar();
      setTimeout(render, 0);
    } finally {
      setProcesando(false);
    }
  }

  createEffect(async () => {
    if (!props.abierto) return;
    await cargar();
    setTimeout(render, 100); // asegura contenedor montado
  });

  onCleanup(() => { mapa()?.remove(); });

  return (
    <div class={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${props.abierto ? "" : "hidden"}`}>
      <div class="bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[95vh] p-4 relative flex flex-col overflow-hidden">
        <div class="flex items-center justify-between mb-3 gap-3">
          <h2 class="text-xl font-bold">Mapa de Clientes Dux</h2>
          <div class="flex items-center gap-2">
            <button
              onClick={() => { cargar().then(() => setTimeout(render, 0)); }}
              class="px-3 py-1 rounded border text-sm"
            >
              Refrescar
            </button>
            <button
              onClick={geocodificarAhora}
              disabled={procesando()}
              class="px-3 py-1 rounded bg-emerald-600 text-white disabled:opacity-50 text-sm"
              title="Geocodificar clientes sin coordenadas (dirección → localidad → provincia)"
            >
              {procesando() ? "Geocodificando..." : "Geocodificar ahora"}
            </button>
            <button onClick={props.onCerrar} class="text-gray-500 hover:text-black text-xl">✕</button>
          </div>
        </div>

        {/* Leyenda */}
        <div class="flex flex-wrap gap-4 text-sm mb-2">
          <div class="flex items-center gap-2"><span class="inline-block w-3 h-3 rounded bg-[#2563eb]" /> Dirección</div>
          <div class="flex items-center gap-2"><span class="inline-block w-3 h-3 rounded bg-[#f59e0b]" /> Localidad</div>
          <div class="flex items-center gap-2"><span class="inline-block w-3 h-3 rounded bg-[#6b7280]" /> Provincia</div>
          <div class="flex items-center gap-2"><span class="inline-block w-3 h-3 rounded bg-[#9ca3af]" /> Sin precisión</div>
          <div class="ml-auto text-xs text-gray-500">Tamaño = total histórico · Intensidad = recencia</div>
        </div>

        <div class="flex-1 overflow-hidden rounded border relative">
          {cargando() && <div class="absolute inset-0 flex items-center justify-center text-sm text-gray-600 bg-white/50">Cargando...</div>}
          <div id={containerId} class="w-full h-full" style="min-height: 520px" />
        </div>

        {/* Listado de sin geocodificar */}
        <Show when={sinUbicacion().length}>
          <div class="mt-3 text-sm text-gray-700 overflow-y-auto max-h-36 border-t pt-2">
            <p class="font-semibold mb-1">
              Clientes sin geocodificar o sin coordenadas ({sinUbicacion().length}):
            </p>
            <ul class="list-disc list-inside space-y-1">
              <For each={sinUbicacion()}>
                {(c) => (
                  <li>
                    {c.nombreFantasia || c.cliente}
                    {c.domicilio ? ` — ${c.domicilio}` : ""}
                    {c.localidad || c.provincia ? ` (${[c.localidad, c.provincia].filter(Boolean).join(", ")})` : ""}
                  </li>
                )}
              </For>
            </ul>
          </div>
        </Show>
      </div>
    </div>
  );
}
