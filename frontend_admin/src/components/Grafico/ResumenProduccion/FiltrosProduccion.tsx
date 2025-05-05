import { createSignal, onMount, onCleanup, Show, For } from "solid-js";
import { buscarProductosPorTexto } from "@/services/producto.service";
import InputFecha from "@/components/Layout/InputFecha";
import { Download } from "lucide-solid";

interface Props {
  desde: string;
  hasta: string;
  turno: string;
  plantaId: string;
  categoriaId: string;
  producto: string;
  modo: string;
  plantas: { id: number; nombre: string }[];
  categorias: { id: number; nombre: string }[];
  setDesde: (v: string) => void;
  setHasta: (v: string) => void;
  setTurno: (v: string) => void;
  setPlantaId: (v: string) => void;
  setCategoriaId: (v: string) => void;
  setProducto: (v: string) => void;
  setModo: (v: string) => void;
  limpiarFiltros: () => void;
  onExportar: () => void;
}

export default function FiltrosProduccion(props: Props) {
  const [busqueda, setBusqueda] = createSignal(props.producto || "");
  const [resultados, setResultados] = createSignal<any[]>([]);
  const [open, setOpen] = createSignal(false);
  let timer: ReturnType<typeof setTimeout>;
  let contenedor: HTMLDivElement;

  function onInputProducto(e: InputEvent) {
    const v = (e.currentTarget as HTMLInputElement).value;
    setBusqueda(v);
    props.setProducto("");
    clearTimeout(timer);
    if (v.length >= 2) {
      timer = setTimeout(async () => {
        const prods = await buscarProductosPorTexto(v);
        setResultados(prods);
        setOpen(true);
      }, 300);
    } else {
      setResultados([]);
      setOpen(false);
    }
  }

  function seleccionar(prod: any) {
    props.setProducto(prod.sku);
    setBusqueda(`${prod.sku} - ${prod.nombre}`);
    setResultados([]);
    setOpen(false);
  }

  onMount(() => {
    const fuera = (e: MouseEvent) => {
      if (contenedor && !contenedor.contains(e.target as Node)) {
        setResultados([]);
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", fuera);
    onCleanup(() => document.removeEventListener("mousedown", fuera));
  });

  return (
    <div class="w-full max-w-screen px-4 py-2 grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-4 items-center">
      {/* Desde */}
      <InputFecha
        valor={props.desde}
        onChange={(v) =>
          props.setDesde(v || new Date().toISOString().slice(0, 10))
        }
        placeholder="Desde"
        class="w-full p-2 rounded border"
      />

      {/* Hasta */}
      <InputFecha
        valor={props.hasta}
        onChange={(v) =>
          props.setHasta(v || new Date().toISOString().slice(0, 10))
        }
        placeholder="Hasta"
        class="w-full p-2 rounded border"
      />

      {/* Turno */}
      <select
        value={props.turno}
        onChange={(e) => {
          props.setTurno(e.currentTarget.value);
          setOpen(false);
        }}
        class="border p-2 rounded w-full"
      >
        <option value="">Todos los Turnos</option>
        <option value="mañana">Mañana</option>
        <option value="tarde">Tarde</option>
        <option value="noche">Noche</option>
      </select>

      {/* Planta */}
      <select
        value={props.plantaId}
        onChange={(e) => {
          props.setPlantaId(e.currentTarget.value);
          props.setProducto("");
          setBusqueda("");
          setResultados([]);
          setOpen(false);
        }}
        class="border p-2 rounded w-full"
      >
        <option value="">Todas las Plantas</option>
        <For each={props.plantas}>
          {(p) => <option value={p.id}>{p.nombre}</option>}
        </For>
      </select>

      {/* Categoría */}
      <select
        value={props.categoriaId}
        onChange={(e) => {
          props.setCategoriaId(e.currentTarget.value);
          props.setProducto("");
          setBusqueda("");
          setResultados([]);
          setOpen(false);
        }}
        class="border p-2 rounded w-full"
      >
        <option value="">Todas las Categorías</option>
        <For each={props.categorias}>
          {(c) => <option value={c.id}>{c.nombre}</option>}
        </For>
      </select>

      {/* Buscar producto */}
      <div class="relative w-full" ref={(el) => (contenedor = el!)}>
        <input
          type="text"
          value={busqueda()}
          placeholder="Buscar Producto"
          onInput={onInputProducto}
          class="border p-2 rounded w-full"
        />
        <Show when={open()}>
          <div class="absolute bg-white border w-full max-h-40 overflow-y-auto rounded shadow z-10">
            <Show when={resultados().length > 0}>
              <For each={resultados()}>
                {(prod) => (
                  <div
                    onClick={() => seleccionar(prod)}
                    class="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {prod.sku} - {prod.nombre}
                  </div>
                )}
              </For>
            </Show>
            <Show when={resultados().length === 0}>
              <div class="p-2 text-gray-400 text-sm">Sin resultados</div>
            </Show>
          </div>
        </Show>
      </div>

      {/* Modo */}
      <select
        value={props.modo}
        onChange={(e) => props.setModo(e.currentTarget.value)}
        class="border p-2 rounded w-full"
      >
        <option value="valor">Valor $</option>
        <option value="cantidad">Cantidad</option>
      </select>

      {/* Botones */}
      <div class="flex flex-col gap-2 md:flex-row md:col-span-3 justify-end w-full">
      <button
          onClick={props.limpiarFiltros}
          class="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
        >
          Limpiar
        </button>
        <button
          onClick={props.onExportar}
          class="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          <Download size={18} />
          Exportar Reporte
        </button>
        
      </div>
    </div>
  );
}
