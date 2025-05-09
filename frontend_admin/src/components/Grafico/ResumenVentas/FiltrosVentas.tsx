import { createSignal, onMount, onCleanup, Show, For } from "solid-js";
import { buscarProductosPorTexto } from "@/services/producto.service";
import { buscarClientesPorTexto } from "@/services/cliente.service";
import { obtenerCategorias } from "@/services/categoria.service";
import InputFecha from "@/components/Layout/InputFecha";
import { Download } from "lucide-solid";

interface Props {
  desde: string;
  hasta: string;
  cliente: string;
  categoriaId: string;
  producto: string;
  modo: string;
  setDesde: (v: string) => void;
  setHasta: (v: string) => void;
  setCliente: (v: string) => void;
  setCategoriaId: (v: string) => void;
  setProducto: (v: string) => void;
  setModo: (v: string) => void;
  limpiarFiltros: () => void;
  onExportar: () => void;
}

export default function FiltrosVentas(props: Props) {
  const [busquedaProducto, setBusquedaProducto] = createSignal("");
  const [busquedaCliente, setBusquedaCliente] = createSignal("");
  const [productos, setProductos] = createSignal<any[]>([]);
  const [clientes, setClientes] = createSignal<any[]>([]);
  const [categorias, setCategorias] = createSignal<{ id: number; nombre: string }[]>([]);
  const [openProducto, setOpenProducto] = createSignal(false);
  const [openCliente, setOpenCliente] = createSignal(false);
  let timer: ReturnType<typeof setTimeout>;
  let contenedor: HTMLDivElement;

  function onInputCliente(e: InputEvent) {
    const v = (e.currentTarget as HTMLInputElement).value;
    setBusquedaCliente(v);
    props.setCliente("");
    clearTimeout(timer);
    if (v.length >= 2) {
      timer = setTimeout(async () => {
        const results = await buscarClientesPorTexto(v);
        setClientes(results);
        setOpenCliente(true);
      }, 300);
    } else {
      setClientes([]);
      setOpenCliente(false);
    }
  }

  function seleccionarCliente(cli: any) {
    props.setCliente(cli.id);
    setBusquedaCliente(`${cli.id} - ${cli.nombre}`);
    setClientes([]);
    setOpenCliente(false);
  }

  function onInputProducto(e: InputEvent) {
    const v = (e.currentTarget as HTMLInputElement).value;
    setBusquedaProducto(v);
    props.setProducto("");
    clearTimeout(timer);
    if (v.length >= 2) {
      timer = setTimeout(async () => {
        const prods = await buscarProductosPorTexto(v);
        setProductos(prods);
        setOpenProducto(true);
      }, 300);
    } else {
      setProductos([]);
      setOpenProducto(false);
    }
  }

  function seleccionarProducto(prod: any) {
    props.setProducto(prod.sku);
    setBusquedaProducto(`${prod.sku} - ${prod.nombre}`);
    setProductos([]);
    setOpenProducto(false);
  }

  onMount(async () => {
    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = (hoy.getMonth() + 1).toString().padStart(2, "0");
    const dd = hoy.getDate().toString().padStart(2, "0");

    if (!props.desde) props.setDesde(`${yyyy}-${mm}-01`);
    if (!props.hasta) props.setHasta(`${yyyy}-${mm}-${dd}`);

    const cats = await obtenerCategorias();
    setCategorias(cats);

    const fuera = (e: MouseEvent) => {
      if (contenedor && !contenedor.contains(e.target as Node)) {
        setProductos([]);
        setClientes([]);
        setOpenProducto(false);
        setOpenCliente(false);
      }
    };
    document.addEventListener("mousedown", fuera);
    onCleanup(() => document.removeEventListener("mousedown", fuera));
  });

  return (
    <div class="w-full max-w-screen px-4 py-2 grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-center">
      {/* Desde */}
      <InputFecha
        valor={props.desde}
        onChange={(v) => props.setDesde(v || new Date().toISOString().slice(0, 10))}
        placeholder="Desde"
        class="w-full rounded"
      />

      {/* Hasta */}
      <InputFecha
        valor={props.hasta}
        onChange={(v) => props.setHasta(v || new Date().toISOString().slice(0, 10))}
        placeholder="Hasta"
        class="w-full rounded"
      />

      {/* Cliente */}
      <div class="relative w-full" ref={(el) => (contenedor = el!)}>
        <input
          type="text"
          value={busquedaCliente()}
          placeholder="Buscar Cliente"
          onInput={onInputCliente}
          class="border p-2 rounded w-full"
        />
        <Show when={openCliente()}>
          <div class="absolute bg-white border w-full max-h-40 overflow-y-auto rounded shadow z-10">
            <Show when={clientes().length > 0}>
              <For each={clientes()}>
                {(cli) => (
                  <div
                    onClick={() => seleccionarCliente(cli)}
                    class="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {cli.id} - {cli.nombre}
                  </div>
                )}
              </For>
            </Show>
            <Show when={clientes().length === 0}>
              <div class="p-2 text-gray-400 text-sm">Sin resultados</div>
            </Show>
          </div>
        </Show>
      </div>

      {/* Categoría */}
      <select
        value={props.categoriaId}
        onChange={(e) => {
          props.setCategoriaId(e.currentTarget.value);
          props.setProducto("");
          setBusquedaProducto("");
          setProductos([]);
          setOpenProducto(false);
        }}
        class="border p-2 rounded w-full"
      >
        <option value="">Todas las Categorías</option>
        <For each={categorias()}>
          {(c) => <option value={c.id}>{c.id} - {c.nombre}</option>}
        </For>
      </select>

      {/* Producto */}
      <div class="relative w-full" ref={(el) => (contenedor = el!)}>
        <input
          type="text"
          value={busquedaProducto()}
          placeholder="Buscar Producto"
          onInput={onInputProducto}
          class="border p-2 rounded w-full"
        />
        <Show when={openProducto()}>
          <div class="absolute bg-white border w-full max-h-40 overflow-y-auto rounded shadow z-10">
            <Show when={productos().length > 0}>
              <For each={productos()}>
                {(prod) => (
                  <div
                    onClick={() => seleccionarProducto(prod)}
                    class="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                  >
                    {prod.sku} - {prod.nombre}
                  </div>
                )}
              </For>
            </Show>
            <Show when={productos().length === 0}>
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
      <div class="flex flex-col gap-2 md:flex-row md:col-span-2 justify-end w-full">
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
