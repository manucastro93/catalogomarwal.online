import {
  createEffect,
  createSignal,
  createResource,
  For,
  Show,
} from 'solid-js';
import type { Producto, ImagenProducto } from '../shared/types/producto';
import {
  crearProductoConImagenes,
  actualizarProductoConImagenes,
  eliminarImagenProducto,
} from '../services/producto.service';
import { obtenerCategorias } from '../services/categoria.service';
import { productoSchema } from '../validations/producto.schema';
import { z } from 'zod';
import ModalMensaje from './ModalMensaje';

export default function ModalNuevoProducto(props: {
  abierto: boolean;
  producto?: Producto | null;
  onCerrar: (mensajeExito?: string) => void;
}) {
  const [tab, setTab] = createSignal<'datos' | 'imagenes'>('datos');
  const [categorias] = createResource(obtenerCategorias);

  const [nombre, setNombre] = createSignal('');
  const [sku, setSku] = createSignal('');
  const [descripcion, setDescripcion] = createSignal('');
  const [hayStock, setHayStock] = createSignal('Sí');
  const [precioUnitario, setPrecioUnitario] = createSignal('');
  const [precioPorBulto, setPrecioPorBulto] = createSignal('');
  const [unidadPorBulto, setUnidadPorBulto] = createSignal('');
  const [categoriaId, setCategoriaId] = createSignal('');

  const [imagenesSeleccionadas, setImagenesSeleccionadas] = createSignal<{
    file: File;
    preview: string;
  }[]>([]);

  const [imagenesExistentes, setImagenesExistentes] = createSignal<ImagenProducto[]>([]);
  const [errores, setErrores] = createSignal<{ [key: string]: string }>({});
  const [mensajeError, setMensajeError] = createSignal("");

  createEffect(() => {
    if (props.producto) {
      setNombre(props.producto.nombre || '');
      setSku(props.producto.sku || '');
      setDescripcion(props.producto.descripcion || '');
      setHayStock(props.producto.hayStock ? 'Sí' : 'No');
      setPrecioUnitario(props.producto.precioUnitario?.toString() || '');
      setPrecioPorBulto(props.producto.precioPorBulto?.toString() || '');
      setUnidadPorBulto(props.producto.unidadPorBulto?.toString() || '');
      setCategoriaId(props.producto.categoriaId?.toString() || '');
      setImagenesExistentes(props.producto.Imagenes || []);
    } else {
      setNombre('');
      setSku('');
      setDescripcion('');
      setHayStock('Sí');
      setPrecioUnitario('');
      setPrecioPorBulto('');
      setUnidadPorBulto('');
      setCategoriaId('');
      setImagenesSeleccionadas([]);
      setImagenesExistentes([]);
      setErrores({});
    }
  });

  const handleGuardar = async () => {
    const datos = {
      sku: sku().trim(),
      nombre: nombre().trim(),
      descripcion: descripcion().trim(),
      hayStock: hayStock(),
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
      setMensajeError("Por favor corregí los campos indicados.");
      return;
    }

    setErrores({});
    setMensajeError("");

    const data = result.data;

    const formData = new FormData();
    formData.append('sku', data.sku);
    if (data.nombre) formData.append('nombre', data.nombre);
    if (data.descripcion) formData.append('descripcion', data.descripcion);
    formData.append('hayStock', data.hayStock === 'Sí' ? 'true' : 'false');
    formData.append('precioUnitario', data.precioUnitario);
    formData.append('precioPorBulto', data.precioPorBulto);
    formData.append('unidadPorBulto', data.unidadPorBulto);
    formData.append('categoriaId', data.categoriaId);

    imagenesSeleccionadas().forEach((img) => {
      formData.append('imagenes', img.file);
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
        <ModalMensaje mensaje={mensajeError()} cerrar={() => setMensajeError("")} />

          <h2 class="text-xl font-bold mb-4">
            {props.producto ? 'Editar producto' : 'Nuevo producto'}
          </h2>

          <div class="flex gap-4 mb-4 border-b">
            <button
              class={`pb-2 cursor-pointer ${tab() === 'datos' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setTab('datos')}
            >
              Datos
            </button>
            <button
              class={`pb-2 cursor-pointer ${tab() === 'imagenes' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500'}`}
              onClick={() => setTab('imagenes')}
            >
              Imágenes
            </button>
          </div>

          <Show when={tab() === 'datos'}>
            <div class="space-y-3">
              <div>
                <input class="w-full border p-2 rounded" placeholder="SKU *" value={sku()} onInput={(e) => setSku(e.currentTarget.value)} />
                <Show when={errores().sku}><p class="text-red-600 text-sm mt-1">{errores().sku}</p></Show>
              </div>
              <div>
                <input class="w-full border p-2 rounded" placeholder="Nombre" value={nombre()} onInput={(e) => setNombre(e.currentTarget.value)} />
                <Show when={errores().nombre}><p class="text-red-600 text-sm mt-1">{errores().nombre}</p></Show>
              </div>
              <div>
                <textarea class="w-full border p-2 rounded" placeholder="Descripción" value={descripcion()} onInput={(e) => setDescripcion(e.currentTarget.value)} />
                <Show when={errores().descripcion}><p class="text-red-600 text-sm mt-1">{errores().descripcion}</p></Show>
              </div>
              <Show when={props.producto?.id}>
                <span class='block'>Stock</span>
                <select class="w-full border p-2 rounded" value={hayStock()} onInput={(e) => setHayStock(e.currentTarget.value)}>
                  <option value="Sí">Sí</option>
                  <option value="No">No</option>
                </select>
              </Show>
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <input class="border p-2 rounded w-full" type="number" placeholder="Precio unitario" value={precioUnitario()} onInput={(e) => setPrecioUnitario(e.currentTarget.value)} />
                  <Show when={errores().precioUnitario}><p class="text-red-600 text-sm mt-1">{errores().precioUnitario}</p></Show>
                </div>
                <div>
                  <input class="border p-2 rounded w-full" type="number" placeholder="Precio por bulto" value={precioPorBulto()} onInput={(e) => setPrecioPorBulto(e.currentTarget.value)} />
                  <Show when={errores().precioPorBulto}><p class="text-red-600 text-sm mt-1">{errores().precioPorBulto}</p></Show>
                </div>
                <div>
                  <input class="border p-2 rounded w-full" type="number" placeholder="Unidades por bulto" value={unidadPorBulto()} onInput={(e) => setUnidadPorBulto(e.currentTarget.value)} />
                  <Show when={errores().unidadPorBulto}><p class="text-red-600 text-sm mt-1">{errores().unidadPorBulto}</p></Show>
                </div>
              </div>
              <div>
                <span class="block">Categoría</span>
                <select class="w-full border p-2 rounded" value={categoriaId()} onInput={(e) => setCategoriaId(e.currentTarget.value)}>
                  <option value="">Seleccionar categoría</option>
                  <For each={categorias()}>{(cat) => <option value={cat.id}>{cat.nombre}</option>}</For>
                </select>
                <Show when={errores().categoriaId}><p class="text-red-600 text-sm mt-1">{errores().categoriaId}</p></Show>
              </div>
            </div>
          </Show>

          <Show when={tab() === 'imagenes'}>
            <div class="space-y-4">
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => {
                  const files = Array.from(e.currentTarget.files || []);
                  const nuevas = files.map((file) => ({
                    file,
                    preview: URL.createObjectURL(file),
                  }));
                  setImagenesSeleccionadas([...imagenesSeleccionadas(), ...nuevas]);
                }}
              />

              <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
                <For each={imagenesExistentes()}>{(img) => (
                  <div class="relative group">
                    <img src={link+img.url} alt="" class="w-full h-32 object-cover rounded" />
                    <button
                      onClick={() => handleEliminarImagen(img.id)}
                      class="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      X
                    </button>
                  </div>
                )}</For>

                <For each={imagenesSeleccionadas()}>{(img, i) => (
                  <div class="relative group">
                    <img src={img.preview} alt="preview" class="w-full h-32 object-cover rounded" />
                    <button
                      onClick={() => setImagenesSeleccionadas((prev) => prev.filter((_, idx) => idx !== i()))}
                      class="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition cursor-pointer"
                    >
                      X
                    </button>
                  </div>
                )}</For>
              </div>
            </div>
          </Show>

          <div class="text-right mt-6">
            <button onClick={() => props.onCerrar()} class="bg-gray-300 px-4 py-1 rounded cursor-pointer">Cancelar</button>
            <button onClick={handleGuardar} class="bg-blue-600 text-white px-4 py-1 rounded ml-2 cursor-pointer">Guardar</button>
          </div>
        </div>
      </div>
    </Show>
  );
}
