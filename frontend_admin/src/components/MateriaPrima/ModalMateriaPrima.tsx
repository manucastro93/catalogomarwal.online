import { createEffect, createSignal, createResource, For, Show } from 'solid-js';
import { actualizarMateriaPrima } from '@/services/materiaPrima.service';
import { obtenerSubcategorias } from '@/services/categoria.service';
import { materiaPrimaSchema } from '@/validations/materiaPrima.schema';
import ModalMensaje from '../Layout/ModalMensaje';
import type { MateriaPrima } from '@/types/materiaPrima';

export default function ModalMateriaPrima(props: {
  abierto: boolean;
  materiaPrima?: MateriaPrima | null;
  onCerrar: (mensajeExito?: string) => void;
}) {
  const [nombre, setNombre] = createSignal("");
  const [sku, setSku] = createSignal("");
  const [descripcion, setDescripcion] = createSignal("");
  const [activo, setActivo] = createSignal("Sí");
  const [subcategoriaId, setSubcategoriaId] = createSignal("");
  const [unidadMedida, setUnidadMedida] = createSignal("");
  const [largo, setLargo] = createSignal("");
  const [ancho, setAncho] = createSignal("");
  const [alto, setAlto] = createSignal("");
  const [peso, setPeso] = createSignal("");
  const [stock, setStock] = createSignal("");
  const [stockMinimo, setStockMinimo] = createSignal("");
  const [stockMaximo, setStockMaximo] = createSignal("");
  const [observaciones, setObservaciones] = createSignal("");
  const [errores, setErrores] = createSignal<{ [key: string]: string }>({});
  const [mensajeError, setMensajeError] = createSignal("");
  const [subcategorias] = createResource(obtenerSubcategorias);

  createEffect(() => {
    if (props.abierto) {
      if (props.materiaPrima) {
        setNombre(props.materiaPrima.nombre || "");
        setSku(props.materiaPrima.sku || "");
        setDescripcion(props.materiaPrima.descripcion || "");
        setActivo(props.materiaPrima.activo ? "Sí" : "No");
        setSubcategoriaId(props.materiaPrima.subcategoriaId?.toString() || "");
        setUnidadMedida(props.materiaPrima.unidadMedida || "");
        setLargo(props.materiaPrima.largo?.toString() || "");
        setAncho(props.materiaPrima.ancho?.toString() || "");
        setAlto(props.materiaPrima.alto?.toString() || "");
        setPeso(props.materiaPrima.peso?.toString() || "");
        setStock(props.materiaPrima.stock?.toString() || "");
        setStockMinimo(props.materiaPrima.stockMinimo?.toString() || "");
        setStockMaximo(props.materiaPrima.stockMaximo?.toString() || "");
        setObservaciones(props.materiaPrima.observaciones || "");
      } else {
        setNombre(""); setSku(""); setDescripcion(""); setActivo("Sí"); setSubcategoriaId(""); setUnidadMedida("");
        setLargo(""); setAncho(""); setAlto(""); setPeso(""); setStock(""); setStockMinimo(""); setStockMaximo(""); setObservaciones("");
        setErrores({});
      }
    }
  });

  const handleGuardar = async () => {
    const datos = {
      sku: sku().trim(),
      nombre: nombre().trim(),
      descripcion: descripcion().trim(),
      activo: activo() === "Sí",
      subcategoriaId: subcategoriaId().trim(),
      unidadMedida: unidadMedida() || null,
      largo: largo() ? parseFloat(largo()) : null,
      ancho: ancho() ? parseFloat(ancho()) : null,
      alto: alto() ? parseFloat(alto()) : null,
      peso: peso() ? parseFloat(peso()) : null,
      stock: stock() ? parseInt(stock(), 10) : 0,
      stockMinimo: stockMinimo() ? parseInt(stockMinimo(), 10) : null,
      stockMaximo: stockMaximo() ? parseInt(stockMaximo(), 10) : null,
      observaciones: observaciones().trim() || null,
    };

    // Si después validás los campos adicionales en el schema, agregalos ahí también.
    const result = materiaPrimaSchema.safeParse(datos);

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

    try {
      if (props.materiaPrima?.id) {
        await actualizarMateriaPrima(props.materiaPrima.id, {
          ...result.data,
          subcategoriaId: result.data.subcategoriaId ? Number(result.data.subcategoriaId) : null,
        });
        props.onCerrar("Materia prima editada correctamente");
      }

    } catch (error) {
      setMensajeError("Error al guardar la materia prima");
    }
  };

  return (
    <Show when={props.abierto}>
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded shadow w-full max-w-2xl">
          <ModalMensaje mensaje={mensajeError()} cerrar={() => setMensajeError("")} />

          <h2 class="text-xl font-bold mb-4">
            {props.materiaPrima ? "Editar materia prima" : "Nueva materia prima"}
          </h2>

          <div class="space-y-3">
            <div>
              <input class="w-full border p-2 rounded" placeholder="SKU *" value={sku()} onInput={(e) => setSku(e.currentTarget.value)} />
              <Show when={errores().sku}>
                <p class="text-red-600 text-sm mt-1">{errores().sku}</p>
              </Show>
            </div>
            <div>
              <input class="w-full border p-2 rounded" placeholder="Nombre" value={nombre()} onInput={(e) => setNombre(e.currentTarget.value)} />
              <Show when={errores().nombre}>
                <p class="text-red-600 text-sm mt-1">{errores().nombre}</p>
              </Show>
            </div>
            <div>
              <textarea class="w-full border p-2 rounded" placeholder="Descripción" value={descripcion()} onInput={(e) => setDescripcion(e.currentTarget.value)} />
              <Show when={errores().descripcion}>
                <p class="text-red-600 text-sm mt-1">{errores().descripcion}</p>
              </Show>
            </div>
            <div>
              <span class="block">Subcategoría</span>
              <select class="w-full border p-2 rounded" value={subcategoriaId()} onInput={(e) => setSubcategoriaId(e.currentTarget.value)}>
                <option value="">Seleccionar Subcategoría</option>
                <For each={subcategorias()}>
                  {(cat) => <option value={cat.id}>{cat.nombre}</option>}
                </For>
              </select>
              <Show when={errores().subcategoriaId}>
                <p class="text-red-600 text-sm mt-1">{errores().subcategoriaId}</p>
              </Show>
            </div>
            <div>
              <span class="block">Unidad de Medida</span>
              <select class="w-full border p-2 rounded" value={unidadMedida()} onInput={(e) => setUnidadMedida(e.currentTarget.value)}>
                <option value="">Seleccionar Unidad</option>
                <option value="KG">KG</option>
                <option value="MT">MT</option>
                <option value="UN">UN</option>
              </select>
            </div>
            <Show when={unidadMedida() === "KG"}>
              <div>
                <input
                  class="w-full border p-2 rounded"
                  placeholder="Peso"
                  value={peso()}
                  onInput={(e) => setPeso(e.currentTarget.value)}
                  type="number"
                  min="0"
                />
              </div>
            </Show>

            <Show when={unidadMedida() === "MT"}>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  class="w-full border p-2 rounded"
                  placeholder="Largo"
                  value={largo()}
                  onInput={(e) => setLargo(e.currentTarget.value)}
                  type="number"
                  min="0"
                />
                <input
                  class="w-full border p-2 rounded"
                  placeholder="Ancho"
                  value={ancho()}
                  onInput={(e) => setAncho(e.currentTarget.value)}
                  type="number"
                  min="0"
                />
              </div>
            </Show>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label for="stock" class="block mb-1 font-medium text-sm">Stock</label>
                <input
                  id="stock"
                  class="w-full border p-2 rounded"
                  placeholder="Stock"
                  value={stock()}
                  onInput={(e) => setStock(e.currentTarget.value)}
                  type="number"
                  min="0"
                />
              </div>
              <div>
                <label for="stockMinimo" class="block mb-1 font-medium text-sm">Stock Mínimo</label>
                <input
                  id="stockMinimo"
                  class="w-full border p-2 rounded"
                  placeholder="Stock Mínimo"
                  value={stockMinimo()}
                  onInput={(e) => setStockMinimo(e.currentTarget.value)}
                  type="number"
                  min="0"
                />
              </div>
              <div>
                <label for="stockMaximo" class="block mb-1 font-medium text-sm">Stock Máximo</label>
                <input
                  id="stockMaximo"
                  class="w-full border p-2 rounded"
                  placeholder="Stock Máximo"
                  value={stockMaximo()}
                  onInput={(e) => setStockMaximo(e.currentTarget.value)}
                  type="number"
                  min="0"
                />
              </div>
            </div>

            <div>
              <textarea class="w-full border p-2 rounded" placeholder="Observaciones" value={observaciones()} onInput={(e) => setObservaciones(e.currentTarget.value)} />
            </div>
            <div>
              <span class="block">Activo</span>
              <select class="w-full border p-2 rounded" value={activo()} onInput={(e) => setActivo(e.currentTarget.value)}>
                <option value="Sí">Sí</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div class="text-right mt-6">
            <button onClick={() => props.onCerrar()} class="bg-gray-300 px-4 py-1 rounded cursor-pointer">Cancelar</button>
            <button onClick={handleGuardar} class="bg-blue-600 text-white px-4 py-1 rounded ml-2 cursor-pointer">Guardar</button>
          </div>
        </div>
      </div>
    </Show>
  );
}
