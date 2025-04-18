import {
  createSignal,
  createMemo,
  For,
  onMount,
  createResource,
  Show,
} from "solid-js";
import { useSearchParams } from "@solidjs/router";
import ProductoCard from "../components/ProductoCard";
import CategoriaButton from "../components/CategoriaButton";
import DetalleProductoInline from "../components/DetalleProductoInline";
import {
  obtenerCategorias,
  obtenerProductos,
} from "../services/producto.service";
import { obtenerBanners } from "../services/pagina.service";
import { registrarLogCliente, detectarClientePorIp } from "../services/cliente.service";
import { registrarBusqueda } from "../hooks/useLogBusqueda";

export default function Inicio() {
  const [params] = useSearchParams();
  const [productos, setProductos] = createSignal<any[]>([]);
  const [categorias, setCategorias] = createSignal<string[]>([]);
  const [categoriaActiva, setCategoriaActiva] = createSignal("Todas");
  const [busqueda, setBusqueda] = createSignal("");
  const [banners] = createResource(obtenerBanners);
  const [productoSeleccionado, setProductoSeleccionado] = createSignal<
    any | null
  >(null);
  const [mostrarDetalle, setMostrarDetalle] = createSignal(false);

  onMount(async () => {
    const prods = await obtenerProductos();
    const cats = await obtenerCategorias();
    setProductos(prods.data);
    setCategorias(["Todas", ...cats.map((c: any) => c.nombre)]);

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
  });

  const filtrados = createMemo(() =>
    productos().filter((p) => {
      const coincideCategoria =
        categoriaActiva() === "Todas" ||
        p.Categoria?.nombre === categoriaActiva();
      const coincideBusqueda = p.nombre
        ?.toLowerCase()
        .includes(busqueda().toLowerCase());
      return coincideCategoria && coincideBusqueda;
    })
  );

  return (
    <div class="flex flex-col">
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
          <aside class="w-full sm:w-48 bg-white border-r p-4 transition-all duration-300 ease-in-out">
            <h2 class="text-sm font-bold mb-2">CATEGORÍAS</h2>
            <div class="flex sm:flex-col gap-2 overflow-x-auto sm:overflow-visible">
              <For each={categorias()}>
                {(cat) => (
                  <CategoriaButton
                    nombre={cat}
                    activa={cat === categoriaActiva()}
                    onClick={() => {
                      setCategoriaActiva(cat);
                      const categoria = productos().find(
                        (p) => p.Categoria?.nombre === cat
                      )?.Categoria;
                      registrarLogCliente({
                        ubicacion: "categoría",
                        categoriaId: categoria?.id,
                        sesion:
                          localStorage.getItem("sesionId") ||
                          crypto.randomUUID(),
                        clienteId:
                          Number(localStorage.getItem("clienteId")) ||
                          undefined,
                        referer: document.referrer,
                      });
                    }}
                  />
                )}
              </For>
            </div>
          </aside>
        </Show>

        <div class="flex-1 px-4">
          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 mt-4">
            <h1 class="text-base mb-2 sm:mb-0">
              <span class="font-bold">Bienvenidos</span> ¡A cargar el carrito!
              
            </h1>
            <Show when={!mostrarDetalle()}>
              <input
                type="text"
                placeholder="🔍 Buscar productos"
                value={busqueda()}
                onInput={(e) => {
                  setBusqueda(e.currentTarget.value);
                  registrarBusqueda(e.currentTarget.value);
                }}
                class="w-full sm:w-60 px-3 py-2 border border-gray-300 rounded-full text-sm"
              />
            </Show>
          </div>

          <Show
            when={!mostrarDetalle()}
            fallback={
              <div class="animate-fade-in">
                <div class="transition-all duration-300 animate-slide-fade">
                  <DetalleProductoInline
                    producto={productoSeleccionado()}
                    onVolver={() => setMostrarDetalle(false)}
                  />
                </div>
              </div>
            }
          >
            <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-5">
            <For each={filtrados()?.filter(p => Array.isArray(p.Imagenes) && p.Imagenes.length > 0)}>
            {(prod) => (
                  <ProductoCard
                    id={prod.id}
                    nombre={prod.nombre}
                    precio={parseFloat(prod.precioUnitario) || 0}
                    precioPorBulto={
                      parseFloat(prod.precioPorBulto) || undefined
                    }
                    unidadPorBulto={prod.unidadPorBulto || undefined}
                    imagen={prod.Imagenes?.[0]?.url || "/placeholder.png"}
                    onVerDetalle={() => {
                      setProductoSeleccionado(prod);
                      setMostrarDetalle(true);
                    }}
                  />
                )}
              </For>
            </div>
          </Show>
        </div>
      </div>
    </div>
  );
}
