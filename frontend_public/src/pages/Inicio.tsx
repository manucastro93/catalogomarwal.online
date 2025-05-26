// 🔵 SolidJS imports
import {
  createSignal,
  For,
  onMount,
  createResource,
  Show,
  createEffect,
  onCleanup,
} from "solid-js";
import { useSearchParams } from "@solidjs/router";
// 🧩 UI Components
import ProductoCard from "@/components/UI/ProductoCard";
import CategoriaButton from "@/components/UI/CategoriaButton";
// 📦 Pedido Components
import DetalleProductoInline from "@/components/Pedido/DetalleProductoInline";
// 🌐 Services
import { obtenerCategorias, obtenerProductos } from "@/services/producto.service";
import { obtenerBanners } from "@/services/pagina.service";
import { registrarLogCliente, detectarClientePorIp, obtenerClientePorId } from "@/services/cliente.service";
// 🪝 Hooks
import { registrarBusqueda } from "@/hooks/useLogBusqueda";


let timeoutBusqueda: number;

function registrarBusquedaDebounced(valor: string) {
  clearTimeout(timeoutBusqueda);
  timeoutBusqueda = window.setTimeout(() => {
    if (valor.trim().length >= 2) {
      registrarBusqueda(valor);
    }
  }, 800);
}

interface InicioProps {
  pedidoIdEdicion?: string;
}

export default function Inicio(props: InicioProps) {
  const [params] = useSearchParams();
  const [productos, setProductos] = createSignal<any[]>([]);
  const [categorias, setCategorias] = createSignal<{ nombre?: string; nombreWeb?: string }[]>([]);
  const [categoriaActiva, setCategoriaActiva] = createSignal("Todas");
  const [busqueda, setBusqueda] = createSignal("");
  const [ordenSeleccionado, setOrdenSeleccionado] = createSignal("default");
  const [pagina, setPagina] = createSignal(1);
  const [totalPaginas, setTotalPaginas] = createSignal(1);
  const [banners] = createResource(obtenerBanners);
  const [productoSeleccionado, setProductoSeleccionado] = createSignal<
    any | null
  >(null);
  const [mostrarDetalle, setMostrarDetalle] = createSignal(false);
  const [mensajeEdicion, setMensajeEdicion] = createSignal("");

  const obtenerOrdenYDireccion = () => {
    switch (ordenSeleccionado()) {
      case "precioAsc":
        return { orden: "precioPorBulto", direccion: "ASC" };
      case "precioDesc":
        return { orden: "precioPorBulto", direccion: "DESC" };
      case "nombreAsc":
        return { orden: "nombre", direccion: "ASC" };
      case "nombreDesc":
        return { orden: "nombre", direccion: "DESC" };
      default:
        return { orden: "createdAt", direccion: "DESC" };
    }
  };

  const fetchProductos = async () => {
    const { orden, direccion } = obtenerOrdenYDireccion();

    const params: Record<string, any> = {
      page: pagina(),
      limit: 12,
      orden,
      direccion,
      buscar: busqueda(),
    };

    if (categoriaActiva() !== "Todas") {
      params.categoria = categoriaActiva();
    }

    const res = await obtenerProductos(params);
    setProductos(res.data);
    setTotalPaginas(res.totalPaginas);
  };

  onMount(() => {
    const handler = () => setMensajeEdicion("");
    window.addEventListener("pedidoEditadoConfirmado", handler);

    onCleanup(() => {
      window.removeEventListener("pedidoEditadoConfirmado", handler);
    });
    (async () => {
    await fetchProductos();
    const cats = await obtenerCategorias();
    setCategorias([{ nombre: "Todas" }, ...cats]);
    const categoriaInicial = params.categoria;
    if (categoriaInicial) {
      const categoriaDecodificada = Array.isArray(categoriaInicial)
        ? categoriaInicial[0]
        : categoriaInicial;
      setCategoriaActiva(decodeURIComponent(categoriaDecodificada));
    }

    registrarLogCliente({
      ubicacion: "inicio",
      sesion: localStorage.getItem("sesionId") || crypto.randomUUID(),
      clienteId: Number(localStorage.getItem("clienteId")) || undefined,
      referer: document.referrer,
    });

    detectarClientePorIp();

    const clienteId = localStorage.getItem("clienteId");
    if (clienteId) {
      try {
        const data = await obtenerClientePorId(Number(clienteId));
        if (data?.id) {
          localStorage.setItem("clienteDatos", JSON.stringify(data));
        }
      } catch (error) {
        console.error("❌ Error al obtener datos del cliente por IP:", error);
      }
    }

    // ✅ Mostrar mensaje si ya está en modo edición
    const pedidoId = localStorage.getItem("modoEdicionPedidoId");
    if (pedidoId) {
      setMensajeEdicion(
        `Estás editando el Pedido #${pedidoId}. Realizá los cambios y volvé a enviarlo.`
      );
    }

    // ✅ Si viene desde props, lo setea también
    if (props.pedidoIdEdicion) {
      localStorage.setItem("modoEdicionPedidoId", props.pedidoIdEdicion);
      localStorage.setItem("abrirCarrito", "1");
    }
  })();
});

  createEffect(() => {
    fetchProductos();
  });
  return (
    <div class="flex flex-col">
      <Show when={mensajeEdicion()}>
        <div class="bg-yellow-100 text-yellow-800 px-4 py-2 text-sm border-b border-yellow-300">
          {mensajeEdicion()}
        </div>
      </Show>

      <Show when={banners()}>
        <div class="w-full overflow-hidden mb-0">
          <For each={banners()}>
            {(banner) => (
              <img
                src={`${import.meta.env.VITE_UPLOADS_URL}${banner.imagen}`}
                alt="Banner"
                class="w-full object-cover max-h-[1100px]"
              />
            )}
          </For>
        </div>
      </Show>

      <div class="flex flex-col sm:flex-row">
        <Show when={!mostrarDetalle()}>
          <aside class="w-full sm:w-48 bg-white border-r p-4">
            <h2 class="text-sm font-bold mb-2">CATEGORÍAS</h2>
            <div class="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible">
              <For each={categorias()}>
                {(cat) => (
                  <CategoriaButton
                    nombreWeb={cat.nombreWeb}
                    nombre={cat.nombre}
                    activa={(cat.nombreWeb || cat.nombre) === categoriaActiva()}
                    onClick={() => {
                      setCategoriaActiva(cat.nombreWeb || cat.nombre || "");
                      setPagina(1);
                    }}
                  />
                )}
              </For>
            </div>
          </aside>
        </Show>

        <div class="flex-1 px-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 mt-4 gap-2">
            <h1 class="text-base">
              <span class="font-bold">Bienvenidos</span> ¡A cargar el carrito!
            </h1>
            <div class="flex flex-col sm:flex-row gap-2 sm:items-center">
              <input
                type="text"
                placeholder="🔍 Buscar productos"
                value={busqueda()}
                onInput={(e) => {
                  const valor = e.currentTarget.value;
                  setBusqueda(valor);
                  setPagina(1);
                  registrarBusquedaDebounced(valor);
                }}
                class="w-full sm:w-60 px-3 py-2 border border-gray-300 rounded-full text-sm"
              />
              <select
                class="text-sm border border-gray-300 rounded-full px-3 py-2"
                value={ordenSeleccionado()}
                onInput={(e) => setOrdenSeleccionado(e.currentTarget.value)}
              >
                <option value="default">Orden predeterminado</option>
                <option value="precioAsc">Precio: menor a mayor</option>
                <option value="precioDesc">Precio: mayor a menor</option>
                <option value="nombreAsc">Nombre: A-Z</option>
                <option value="nombreDesc">Nombre: Z-A</option>
              </select>
            </div>
          </div>

          <Show
            when={!mostrarDetalle()}
            fallback={
              <div class="animate-fade-in">
                <DetalleProductoInline
                  producto={productoSeleccionado()}
                  onVolver={() => setMostrarDetalle(false)}
                />
              </div>
            }
          >
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-5">
              <For each={productos()}>
                {(prod) => (
                  <ProductoCard
                    id={prod.id}
                    sku={prod.sku}
                    nombre={prod.nombre}
                    precio={parseFloat(prod.precioUnitario) || 0}
                    precioPorBulto={
                      parseFloat(prod.precioPorBulto) || undefined
                    }
                    unidadPorBulto={prod.unidadPorBulto || undefined}
                    imagen={prod.Imagenes?.[0]?.url}
                    segundaImagen={prod.Imagenes?.[1]?.url}
                    onVerDetalle={() => {
                      setProductoSeleccionado(prod);
                      setMostrarDetalle(true);
                    }}
                  />
                )}
              </For>
            </div>

            <Show when={totalPaginas() > 1}>
              <div class="flex justify-center items-center gap-2 mt-6">
                <button
                  onClick={() => setPagina((p) => Math.max(1, p - 1))}
                  class="px-3 py-1 border rounded disabled:opacity-50"
                  disabled={pagina() === 1}
                >
                  ◀
                </button>
                <span class="text-sm">
                  Página {pagina()} de {totalPaginas()}
                </span>
                <button
                  onClick={() =>
                    setPagina((p) => Math.min(totalPaginas(), p + 1))
                  }
                  class="px-3 py-1 border rounded disabled:opacity-50"
                  disabled={pagina() === totalPaginas()}
                >
                  ▶
                </button>
              </div>
            </Show>
          </Show>
        </div>
      </div>
    </div>
  );
}
