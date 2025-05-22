import { createSignal, createEffect, Show, onCleanup } from 'solid-js';
import { crearCategoria, editarCategoria } from '@/services/categoria.service';
import { categoriaSchema } from '@/validations/categoria.schema';
import type { Categoria } from '@/types/categoria';

interface Props {
  abierto: boolean;
  categoria: Categoria | null;
  onCerrar: (mensaje?: string) => void;
}

export default function ModalCategoria(props: Props) {
  const [nombre, setNombre] = createSignal('');
  const [nombreWeb, setNombreWeb] = createSignal('');
  const [orden, setOrden] = createSignal('');
  const [estado, setEstado] = createSignal(true);
  const [errores, setErrores] = createSignal<{ [key: string]: string }>({});

  const limpiarFormulario = () => {
    setNombre('');
    setNombreWeb('');
    setOrden('');
    setEstado(true);
    setErrores({});
  };

  createEffect(() => {
    if (props.abierto) {
      if (props.categoria) {
        setNombre(props.categoria.nombre);
        setNombreWeb(props.categoria.nombreWeb ?? '');
        setOrden(props.categoria.orden?.toString() ?? '');
        setEstado(props.categoria.estado);
      } else {
        limpiarFormulario();
      }
    }
  });

  onCleanup(() => {
    limpiarFormulario();
  });

  const handleSubmit = async (e: Event) => {
    e.preventDefault();

    const datos = {
      nombre: nombre().trim(),
      nombreWeb: nombreWeb().trim() || null,
      orden: orden(),
      estado: estado(),
    };

    const result = categoriaSchema.safeParse(datos);

    if (!result.success) {
      const errors = result.error.flatten().fieldErrors;
      const formateados: { [key: string]: string } = {};
      Object.entries(errors).forEach(([key, val]) => {
        if (val?.[0]) formateados[key] = val[0];
      });
      setErrores(formateados);
      return;
    }

    setErrores({});

    const nuevaCategoria: Partial<Categoria> = {
      nombre: result.data.nombre,
      nombreWeb: result.data.nombreWeb,
      orden: result.data.orden === '' ? undefined : Number(result.data.orden),
      estado: result.data.estado,
    };

    try {
      if (props.categoria) {
        await editarCategoria(props.categoria.id, nuevaCategoria);
        props.onCerrar('Categoría actualizada correctamente');
      } else {
        await crearCategoria(nuevaCategoria);
        props.onCerrar('Categoría creada correctamente');
      }
    } catch (error: any) {
      setErrores({ nombre: 'Error al guardar la categoría' });
    }
  };

  return (
    <Show when={props.abierto}>
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
        <div class="relative z-50 bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
          <h2 class="text-xl font-bold mb-4">{props.categoria ? 'Editar categoría' : 'Nueva categoría'}</h2>

          <form onSubmit={handleSubmit} class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <input
                class="border p-2 rounded w-full"
                placeholder="Nombre de la categoría (Dux)"
                value={nombre()}
                onInput={(e) => setNombre(e.currentTarget.value)}
              />
              <Show when={errores().nombre}>
                <p class="text-red-600 text-sm">{errores().nombre}</p>
              </Show>
            </div>

            <div class="col-span-2">
              <input
                class="border p-2 rounded w-full"
                placeholder="Nombre visible en la web (opcional)"
                value={nombreWeb()}
                onInput={(e) => setNombreWeb(e.currentTarget.value)}
              />
              <Show when={errores().nombreWeb}>
                <p class="text-red-600 text-sm">{errores().nombreWeb}</p>
              </Show>
            </div>

            <div>
              <input
                class="border p-2 rounded w-full"
                placeholder="Orden"
                value={orden()}
                onInput={(e) => setOrden(e.currentTarget.value)}
              />
              <Show when={errores().orden}>
                <p class="text-red-600 text-sm">{errores().orden}</p>
              </Show>
            </div>

            <div>
              <select
                class="border p-2 rounded w-full"
                value={estado() ? 'true' : 'false'}
                onChange={(e) => setEstado(e.currentTarget.value === 'true')}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
              <Show when={errores().estado}>
                <p class="text-red-600 text-sm">{errores().estado}</p>
              </Show>
            </div>

            <div class="col-span-2 mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => props.onCerrar()}
                class="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Guardar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Show>
  );
}
