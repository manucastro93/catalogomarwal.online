import { createEffect, createSignal, createResource, For, Show } from 'solid-js';
import { crearProductoConImagenes, actualizarProductoConImagenes, eliminarImagenProducto, actualizarOrdenImagenes } from '@/services/producto.service';
import { obtenerCategorias } from '@/services/categoria.service';
import { productoSchema } from '@/validations/producto.schema';
import { formatearPrecio } from '@/utils/formato';
import ModalMensaje from '../Layout/ModalMensaje';
import type { Producto, ImagenProducto } from '@/types/producto';
import TabComposicionEdicion from './Tabs/TabComposicionEdicion';

export default function ModalNuevoProducto(props: {
  abierto: boolean;
  producto?: Producto | null;
  onCerrar: (mensajeExito?: string) => void;
}) {
  const [tab, setTab] = createSignal<"datos" | "imagenes" | "composicion">("datos");
  const [categorias] = createResource(obtenerCategorias);

  const [nombre, setNombre] = createSignal("");
  const [sku, setSku] = createSignal("");
  const [descripcion, setDescripcion] = createSignal("");
  const [activo, setActivo] = createSignal("Sí");
  const [precioUnitario, setPrecioUnitario] = createSignal("");
  const [precioPorBulto, setPrecioPorBulto] = createSignal("");
  const [unidadPorBulto, setUnidadPorBulto] = createSignal("");
  const [categoriaId, setCategoriaId] = createSignal("");

  const [imagenesSeleccionadas, setImagenesSeleccionadas] = createSignal<
    {
      file: File;
      preview: string;
    }[]
  >([]);

  const [imagenesExistentes, setImagenesExistentes] = createSignal<
    ImagenProducto[]
  >([]);
  const [errores, setErrores] = createSignal<{ [key: string]: string }>({});
  const [mensajeError, setMensajeError] = createSignal("");


  createEffect(() => {
    if (props.abierto) {
      if (props.producto) {
        setNombre(props.producto.nombre || "");
        setSku(props.producto.sku || "");
        setDescripcion(props.producto.descripcion || "");
        setActivo(props.producto.activo ? "Sí" : "No");
        setPrecioUnitario(props.producto.precioUnitario?.toString() || "");
        setPrecioPorBulto(props.producto.precioPorBulto?.toString() || "");
        setUnidadPorBulto(props.producto.unidadPorBulto?.toString() || "");
        setCategoriaId(props.producto.categoriaId?.toString() || "");

        const imagenes = Array.isArray(props.producto.Imagenes)
          ? props.producto.Imagenes
          : [];

        setImagenesExistentes(
          [...imagenes].sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        );

        setImagenesSeleccionadas([]);
      } else {
        setNombre("");
        setSku("");
        setDescripcion("");
        setActivo("Sí");
        setPrecioUnitario("");
        setPrecioPorBulto("");
        setUnidadPorBulto("");
        setCategoriaId("");
        setImagenesSeleccionadas([]);
        setImagenesExistentes([]);
        setErrores({});
      }
    }
  });

  const handleGuardar = async () => {
    const datos = {
      sku: sku().trim(),
      nombre: nombre().trim(),
      descripcion: descripcion().trim(),
      activo: activo(),
      precioUnitario: precioUnitario().trim(),
      precioPorBulto: precioPorBulto().trim(),
      unidadPorBulto: unidadPorBulto().trim(),
      categoriaId: categoriaId().trim(),
    };

    const result = productoSchema.safeParse(datos);

    if (!result.success) {
      const erroresZod = result.error.flatten().fieldErrors;
      const erroresFormateados: { [key: string]: string } = {};
      Object.entries(erroresZod).forEach(([key, value]) => {
        if (value?.[0]) erroresFormateados[key] = value[0];
      });
      setErrores(erroresFormateados);
      return;
    }

    setErrores({});
    setMensajeError("");

    const data = result.data;

    const formData = new FormData();
    formData.append("sku", data.sku);
    if (data.nombre) formData.append("nombre", data.nombre);
    if (data.descripcion) formData.append("descripcion", data.descripcion);
    formData.append("activo", data.activo === "Sí" ? "true" : "false");
    formData.append("precioUnitario", data.precioUnitario);
    formData.append("precioPorBulto", data.precioPorBulto);
    formData.append("unidadPorBulto", data.unidadPorBulto);
    formData.append("categoriaId", data.categoriaId);

    imagenesSeleccionadas().forEach((img) => {
      formData.append("imagenes", img.file);
    });

    try {
      if (props.producto?.id) {
        await actualizarProductoConImagenes(props.producto.id, formData);
        props.onCerrar("Producto editado correctamente");
      } else {
        await crearProductoConImagenes(formData);
        props.onCerrar("Producto creado correctamente");
      }
    } catch (error) {
      setMensajeError("Error al guardar el producto");
    }
  };

  const handleEliminarImagen = async (id: number) => {
    await eliminarImagenProducto(id);
    setImagenesExistentes((prev) => prev.filter((img) => img.id !== id));
  };

  const link: string = import.meta.env.VITE_BACKEND_URL;

  return (
    <Show when={props.abierto}>
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded shadow w-full max-w-2xl">
          <ModalMensaje
            mensaje={mensajeError()}
            cerrar={() => setMensajeError("")}
          />

          <h2 class="text-xl font-bold mb-4">
            {props.producto ? "Editar producto" : "Nuevo producto"}
          </h2>

          <div class="flex gap-4 mb-4 border-b">
            <button
              class={`pb-2 cursor-pointer ${
                tab() === "datos"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500"
              }`}
              onClick={() => setTab("datos")}
            >
              Datos
            </button>
            <button
              class={`pb-2 cursor-pointer ${
                tab() === "imagenes"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500"
              }`}
              onClick={() => setTab("imagenes")}
            >
              Imágenes
            </button>
              <button
                class={`pb-2 cursor-pointer ${tab() === "composicion" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"}`}
                onClick={() => setTab("composicion")}
                disabled={!props.producto?.id}
                title={!props.producto?.id ? "Primero debes crear el producto" : ""}
              >
                Composición
              </button>
          </div>

          <Show when={tab() === "datos"}>
            <div class="space-y-3">
              <div>
                <input
                  class="w-full border p-2 rounded"
                  placeholder="SKU *"
                  value={sku()}
                  onInput={(e) => setSku(e.currentTarget.value)}
                />
                <Show when={errores().sku}>
                  <p class="text-red-600 text-sm mt-1">{errores().sku}</p>
                </Show>
              </div>
              <div>
                <input
                  class="w-full border p-2 rounded"
                  placeholder="Nombre"
                  value={nombre()}
                  onInput={(e) => setNombre(e.currentTarget.value)}
                />
                <Show when={errores().nombre}>
                  <p class="text-red-600 text-sm mt-1">{errores().nombre}</p>
                </Show>
              </div>
              <div>
                <textarea
                  class="w-full border p-2 rounded"
                  placeholder="Descripción"
                  value={descripcion()}
                  onInput={(e) => setDescripcion(e.currentTarget.value)}
                />
                <Show when={errores().descripcion}>
                  <p class="text-red-600 text-sm mt-1">
                    {errores().descripcion}
                  </p>
                </Show>
              </div>
              <Show when={props.producto?.id}>
                <span class="block">Activo</span>
                <select
                  class="w-full border p-2 rounded"
                  value={activo()}
                  onInput={(e) => setActivo(e.currentTarget.value)}
                >
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </Show>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input
                    class="border p-2 rounded w-full"
                    type="text"
                    inputmode="numeric"
                    onKeyDown={(e) => {
                      const allowed = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'];
                      const isNumber = /^[0-9]$/.test(e.key);
                      if (!isNumber && !allowed.includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Precio unitario"
                    value={formatearPrecio(precioUnitario())}
                    onInput={(e) => {
                      const raw = e.currentTarget.value.replace(/[^0-9]/g, '');
                      setPrecioUnitario(raw);
                    }}
                  />
                  <Show when={errores().precioUnitario}>
                    <p class="text-red-600 text-sm mt-1">
                      {errores().precioUnitario}
                    </p>
                  </Show>
                </div>
                <div>
                  <input
                    class="border p-2 rounded w-full"
                    type="number"
                    onKeyDown={(e) => {
                      const allowed = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'];
                      const isNumber = /^[0-9]$/.test(e.key);
                      if (!isNumber && !allowed.includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Unidades por bulto"
                    value={unidadPorBulto()}
                    onInput={(e) => {
                      const value = e.currentTarget.value;
                      setUnidadPorBulto(value);

                      const unidades = parseInt(value, 10);
                      const precio = parseInt(precioUnitario(), 10);

                      if (!isNaN(unidades) && !isNaN(precio)) {
                        setPrecioPorBulto((unidades * precio).toString());
                      }
                    }}
                  />
                  <Show when={errores().unidadPorBulto}>
                    <p class="text-red-600 text-sm mt-1">
                      {errores().unidadPorBulto}
                    </p>
                  </Show>
                </div>
                <div>
                  <input
                    class="border p-2 rounded w-full"
                    type="text"
                    inputmode="numeric"
                    onKeyDown={(e) => {
                      const allowed = ['Backspace', 'ArrowLeft', 'ArrowRight', 'Tab'];
                      const isNumber = /^[0-9]$/.test(e.key);
                      if (!isNumber && !allowed.includes(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    placeholder="Precio por bulto"
                    value={formatearPrecio(precioPorBulto())}
                    onInput={(e) => {
                      const raw = e.currentTarget.value.replace(/[^0-9]/g, '');
                      setPrecioPorBulto(raw);
                    }}
                  />
                  <Show when={errores().precioPorBulto}>
                    <p class="text-red-600 text-sm mt-1">
                      {errores().precioPorBulto}
                    </p>
                  </Show>
                </div>
              </div>
              <div>
                <span class="block">Categoría</span>
                <select
                  class="w-full border p-2 rounded"
                  value={categoriaId()}
                  onInput={(e) => setCategoriaId(e.currentTarget.value)}
                >
                  <option value="">Seleccionar categoría</option>
                  <For each={categorias()}>
                    {(cat) => <option value={cat.id}>{cat.nombre}</option>}
                  </For>
                </select>
                <Show when={errores().categoriaId}>
                  <p class="text-red-600 text-sm mt-1">
                    {errores().categoriaId}
                  </p>
                </Show>
              </div>
            </div>
          </Show>

          <Show when={tab() === "imagenes"}>
            <div class="space-y-4">
              <label class="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded cursor-pointer hover:bg-blue-700 transition">
                <svg
                  class="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Subir imágenes
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  class="hidden"
                  onChange={(e) => {
                    const files = Array.from(e.currentTarget.files || []);
                    const nuevas = files.map((file) => ({
                      file,
                      preview: URL.createObjectURL(file),
                    }));
                    setImagenesSeleccionadas([
                      ...imagenesSeleccionadas(),
                      ...nuevas,
                    ]);
                  }}
                />
              </label>

              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <For each={imagenesExistentes()}>
                  {(img, i) => (
                    <div class="relative group">
                      <img
                        src={link + img.url}
                        alt=""
                        class="w-full h-32 object-cover rounded border"
                      />
                      <button
                        onClick={() => handleEliminarImagen(img.id)}
                        class="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        X
                      </button>

                      {/* Flecha arriba */}
                      <Show when={i() > 0}>
                        <button
                          onClick={() =>
                            setImagenesExistentes((prev) => {
                              const nuevo = [...prev];
                              [nuevo[i() - 1], nuevo[i()]] = [
                                nuevo[i()],
                                nuevo[i() - 1],
                              ];
                              return nuevo;
                            })
                          }
                          class="absolute bottom-1 left-1 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                        >
                          ↑
                        </button>
                      </Show>

                      {/* Flecha abajo */}
                      <Show when={i() < imagenesExistentes().length - 1}>
                        <button
                          onClick={() =>
                            setImagenesExistentes((prev) => {
                              const nuevo = [...prev];
                              [nuevo[i()], nuevo[i() + 1]] = [
                                nuevo[i() + 1],
                                nuevo[i()],
                              ];
                              return nuevo;
                            })
                          }
                          class="absolute bottom-1 right-1 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                        >
                          ↓
                        </button>
                      </Show>
                    </div>
                  )}
                </For>

                <For each={imagenesSeleccionadas()}>
                  {(img, i) => (
                    <div class="relative group">
                      <img
                        src={img.preview}
                        alt="preview"
                        class="w-full h-32 object-cover rounded border"
                      />
                      <button
                        onClick={() =>
                          setImagenesSeleccionadas((prev) =>
                            prev.filter((_, idx) => idx !== i())
                          )
                        }
                        class="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                      >
                        X
                      </button>

                      {/* Flecha arriba */}
                      <Show when={i() > 0}>
                        <button
                          onClick={() =>
                            setImagenesSeleccionadas((prev) => {
                              const nuevo = [...prev];
                              [nuevo[i() - 1], nuevo[i()]] = [
                                nuevo[i()],
                                nuevo[i() - 1],
                              ];
                              return nuevo;
                            })
                          }
                          class="absolute bottom-1 left-1 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                        >
                          ↑
                        </button>
                      </Show>

                      {/* Flecha abajo */}
                      <Show when={i() < imagenesSeleccionadas().length - 1}>
                        <button
                          onClick={() =>
                            setImagenesSeleccionadas((prev) => {
                              const nuevo = [...prev];
                              [nuevo[i()], nuevo[i() + 1]] = [
                                nuevo[i() + 1],
                                nuevo[i()],
                              ];
                              return nuevo;
                            })
                          }
                          class="absolute bottom-1 right-1 bg-gray-700 text-white text-xs px-2 py-1 rounded"
                        >
                          ↓
                        </button>
                      </Show>
                    </div>
                  )}
                </For>
              </div>
              <button
                class="bg-sky-500 text-white px-3 py-1 rounded mt-4"
                onClick={async () => {
                  try {
                    const ordenFinal = imagenesExistentes().map((img, idx) => ({
                      id: img.id,
                      orden: idx,
                    }));
                    await actualizarOrdenImagenes(ordenFinal);
                    setMensajeError("Orden actualizado correctamente ✅");
                  } catch (err) {
                    setMensajeError("Error al actualizar orden");
                  }
                }}
              >
                Guardar orden
              </button>
            </div>
          </Show>

          <Show when={tab() === "composicion" && !!props.producto}>
            <TabComposicionEdicion productoId={props.producto!.id} />
          </Show>

          <div class="text-right mt-6">
            <button
              onClick={() => props.onCerrar()}
              class="bg-gray-300 px-4 py-1 rounded cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleGuardar}
              class="bg-blue-600 text-white px-4 py-1 rounded ml-2 cursor-pointer"
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}