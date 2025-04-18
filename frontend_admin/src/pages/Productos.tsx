import {
  createSignal,
  createResource,
  createMemo,
  For,
  Show
} from "solid-js";
import {
  obtenerProductos,
  obtenerProductoPorId,
  eliminarProducto,
} from "../services/producto.service";
import { useAuth } from "../store/auth";
import { obtenerCategorias } from "../services/categoria.service";
import ModalNuevoProducto from "../components/ModalNuevoProducto";
import ModalImportarExcel from "../components/ModalImportarExcel";
import VerProductoModal from "../components/VerProductoModal";
import ModalConfirmacion from "../components/ModalConfirmacion";
import ModalMensaje from "../components/ModalMensaje";
import Loader from "../components/Loader";
import type { Producto } from "../shared/types/producto";
import { formatearPrecio } from "../utils/formato"; 

export default function Productos() {
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal("sku");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("asc");

  const [busqueda, setBusqueda] = createSignal("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = createSignal("");

  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [modalExcel, setModalExcel] = createSignal(false);
  const [productoSeleccionado, setProductoSeleccionado] =
    createSignal<Producto | null>(null);
  const [verProducto, setVerProducto] = createSignal<Producto | null>(null);
  const [productoAEliminar, setProductoAEliminar] =
    createSignal<Producto | null>(null);
  const [mensaje, setMensaje] = createSignal("");
  const { usuario } = useAuth();
  const esVendedor = usuario()?.rol === "vendedor";
  const [categorias] = createResource(obtenerCategorias);

  const fetchParams = createMemo(() => ({
    page: pagina(),
    limit: 10,
    orden: orden(),
    direccion: direccion(),
    buscar: busqueda(),
    categoriaId: categoriaSeleccionada(),
  }));

  const [respuesta, { refetch }] = createResource(
    fetchParams,
    obtenerProductos
  );

  const cambiarOrden = (col: string) => {
    if (orden() === col) {
      setDireccion(direccion() === "asc" ? "desc" : "asc");
    } else {
      setOrden(col);
      setDireccion("asc");
    }
  };

  const verProductoCompleto = async (id: number) => {
    const producto = await obtenerProductoPorId(id);
    setVerProducto(producto);
  };

  const editarProductoCompleto = async (id: number) => {
    const producto = await obtenerProductoPorId(id);
    setProductoSeleccionado(producto);
    setModalAbierto(true);
  };

  const handleEliminar = (id: number) => {
    setProductoAEliminar(respuesta()?.data.find((p: Producto) => p.id === id) || null);
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Productos</h1>
        {!esVendedor && (
          <div class="flex gap-2">
            <button
              onClick={() => setModalExcel(true)}
              class="bg-green-600 text-white px-3 py-1 rounded text-sm"
            >
              Importar Excel
            </button>
            <button
              onClick={() => {
                setProductoSeleccionado(null);
                setModalAbierto(true);
              }}
              class="bg-blue-600 text-white px-3 py-1 rounded text-sm"
            >
              + Nuevo Producto
            </button>
          </div>
        )}
      </div>

      <div class="flex gap-4 mb-4">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          class="p-2 border rounded w-full max-w-md"
          value={busqueda()}
          onInput={(e) => {
            setBusqueda(e.currentTarget.value);
            setPagina(1);
          }}
        />

        <select
          class="p-2 border rounded"
          value={categoriaSeleccionada()}
          onInput={(e) => {
            setCategoriaSeleccionada(e.currentTarget.value);
            setPagina(1);
          }}
        >
          <option value="">Todas las categorías</option>
          <For each={categorias()}>
            {(cat) => <option value={cat.id}>{cat.nombre}</option>}
          </For>
        </select>
      </div>

      <Show when={!respuesta.loading} fallback={<Loader />}>
        <div class="overflow-auto border rounded-lg">
          <table class="w-full text-sm border-collapse">
            <thead class="bg-gray-100 sticky top-0">
              <tr>
                <th class="text-left p-3 border-b cursor-pointer">Imagen</th>
                <th
                  class="text-left p-3 border-b cursor-pointer"
                  onClick={() => cambiarOrden("sku")}
                >
                  SKU {orden() === "sku" && (direccion() === "asc" ? "▲" : "▼")}
                </th>
                <th
                  class="text-left p-3 border-b cursor-pointer"
                  onClick={() => cambiarOrden("nombre")}
                >
                  Nombre{" "}
                  {orden() === "nombre" && (direccion() === "asc" ? "▲" : "▼")}
                </th>
                <th
                  class="text-left p-3 border-b cursor-pointer"
                  onClick={() => cambiarOrden("precioUnitario")}
                >
                  PrecioXUn{" "}
                  {orden() === "precioUnitario" &&
                    (direccion() === "asc" ? "▲" : "▼")}
                </th>
                <th
                  class="text-left p-3 border-b cursor-pointer"
                  onClick={() => cambiarOrden("precioPorBulto")}
                >
                  PrecioXBulto{" "}
                  {orden() === "precioPorBulto" &&
                    (direccion() === "asc" ? "▲" : "▼")}
                </th>
                <th
                  class="text-left p-3 border-b cursor-pointer"
                  onClick={() => cambiarOrden("producto?.hayStock")}
                >
                  ¿Hay Stock?{" "}
                  {orden() === "producto?.hayStock" &&
                    (direccion() === "asc" ? "▲" : "▼")}
                </th>
                <th class="text-left p-3 border-b">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <Show
                when={respuesta()?.data && respuesta()!.data.length > 0}
                fallback={
                  <tr>
                    <td colspan="6" class="text-center p-4 text-gray-500">
                      No se encontraron productos
                    </td>
                  </tr>
                }
              >
                <For each={respuesta()?.data}>
                  {(p: Producto) => (
                    <tr class="hover:bg-gray-50 border-b">
                      <td>  
                      <Show when={Array.isArray(p.Imagenes) && p.Imagenes.length > 0}>
                        <img
                          src={`${import.meta.env.VITE_BACKEND_URL}${p.Imagenes?.[0]?.url}`}
                          alt={p.nombre}
                          class="h-12 w-12 object-cover rounded"
                        />
                      </Show>
                      </td>
                      <td class="p-3">{p.sku}</td>
                      <td class="p-3">{p.nombre}</td>
                      <td class="p-3">{formatearPrecio(p.precioUnitario)}</td>
                      <td class="p-3">{formatearPrecio(p.precioPorBulto)}</td>
                      <td class="p-3">{p.hayStock ? "Sí" : "No"}</td>
                      <td class="p-3 flex gap-2">
                        <button
                          class="text-blue-600 hover:underline"
                          onClick={() => verProductoCompleto(p.id)}
                        >
                          Ver
                        </button>
                        {!esVendedor && (
                          <>
                            <button
                              class="text-green-600 hover:underline"
                              onClick={() => editarProductoCompleto(p.id)}
                            >
                              Editar
                            </button>
                            <button
                              class="text-red-600 hover:underline"
                              onClick={() => handleEliminar(p.id)}
                            >
                              Eliminar
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  )}
                </For>
              </Show>
            </tbody>
          </table>
        </div>
      </Show>

      <div class="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() === 1}
        >
          ◀
        </button>
        <span class="text-sm">
          Página {respuesta()?.pagina ?? "-"} de{" "}
          {respuesta()?.totalPaginas ?? "-"}
        </span>
        <button
          onClick={() =>
            setPagina((p) => Math.min(respuesta()?.totalPaginas || p, p + 1))
          }
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() === (respuesta()?.totalPaginas ?? 1)}
        >
          ▶
        </button>
      </div>

      <ModalNuevoProducto
        abierto={modalAbierto()}
        producto={productoSeleccionado()}
        onCerrar={(mensajeExito?: string) => {
          setModalAbierto(false);
          refetch();
          if (mensajeExito) setMensaje(mensajeExito);
        }}
      />

      <ModalImportarExcel
        abierto={modalExcel()}
        onCerrar={() => {
          setModalExcel(false);
          refetch();
        }}
      />

      <VerProductoModal
        producto={verProducto()}
        onCerrar={() => setVerProducto(null)}
      />

      <ModalConfirmacion
        mensaje="¿Estás seguro que querés eliminar este producto?"
        abierto={!!productoAEliminar()}
        onCancelar={() => setProductoAEliminar(null)}
        onConfirmar={async () => {
          if (productoAEliminar()) {
            await eliminarProducto(productoAEliminar()!.id);
            setProductoAEliminar(null);
            refetch();
            setMensaje("Producto eliminado correctamente");
          }
        }}
      />

      <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje("")} />
    </div>
  );
}
