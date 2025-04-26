import { createSignal, createEffect, Show } from 'solid-js';
import type { Usuario } from '../../../types/usuario';
import { usuarioSchema } from '../../../validations/usuario.schema';
import { crearUsuario, editarUsuario } from '../../../services/usuario.service';

interface ModalNuevoVendedorProps {
  abierto: boolean;
  usuario: Usuario | null;
  onCerrar: (mensajeExito?: string) => void;
}

export default function ModalNuevoVendedor(props: ModalNuevoVendedorProps) {
  const [nombre, setNombre] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [telefono, setTelefono] = createSignal('');
  const [errores, setErrores] = createSignal<{ [key: string]: string }>({});

  createEffect(() => {
    if (props.usuario) {
      setNombre(props.usuario.nombre || '');
      setEmail(props.usuario.email || '');
      setTelefono(props.usuario.telefono || '');
    } else {
      setNombre('');
      setEmail('');
      setTelefono('');
      setErrores({});
    }
  });

  const validar = () => {
    const datos = {
      nombre: nombre().trim(),
      email: email().trim(),
      telefono: telefono().trim(),
    };

    const result = usuarioSchema.safeParse(datos);

    if (!result.success) {
      const erroresZod = result.error.flatten().fieldErrors;
      const erroresFormateados: { [key: string]: string } = {};

      Object.entries(erroresZod).forEach(([key, value]) => {
        if (value?.[0]) erroresFormateados[key] = value[0];
      });

      setErrores(erroresFormateados);
      return null;
    }

    setErrores({});
    return result.data;
  };

  const handleSubmit = async () => {
    const datosValidados = validar();
    if (!datosValidados) return;

    try {
      if (props.usuario) {
        await editarUsuario(props.usuario.id, { ...datosValidados, rolUsuarioId: 3 }, 'Vendedores');
        props.onCerrar('Vendedor actualizado correctamente');
      } else {
        await crearUsuario({ ...datosValidados, rolUsuarioId: 3 }, 'Vendedores');
        props.onCerrar('Vendedor creado correctamente');
      }
    } catch (error) {
      console.error('Error al guardar usuario:', error);
      setErrores({ email: 'Error al guardar. Revisa los datos.' });
    }
  };

  return (
    <Show when={props.abierto}>
      <div class="fixed inset-0 z-40 flex items-center justify-center bg-black/50">
        <div class="bg-white p-6 rounded-md w-full max-w-md" onClick={(e) => e.stopPropagation()}>
          <h2 class="text-xl font-bold mb-4">
            {props.usuario ? 'Editar Vendedor' : 'Nuevo Vendedor'}
          </h2>

          <div class="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Nombre *"
                class="w-full border p-2 rounded"
                value={nombre()}
                onInput={(e) => setNombre(e.currentTarget.value)}
              />
              <Show when={errores().nombre}>
                <p class="text-red-600 text-sm mt-1">{errores().nombre}</p>
              </Show>
            </div>

            <div>
              <input
                type="email"
                placeholder="Email *"
                class="w-full border p-2 rounded"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
              />
              <Show when={errores().email}>
                <p class="text-red-600 text-sm mt-1">{errores().email}</p>
              </Show>
            </div>

            <div>
              <input
                type="tel"
                placeholder="Teléfono"
                class="w-full border p-2 rounded"
                value={telefono()}
                onInput={(e) => setTelefono(e.currentTarget.value)}
              />
              <Show when={errores().telefono}>
                <p class="text-red-600 text-sm mt-1">{errores().telefono}</p>
              </Show>
            </div>
          </div>

          <div class="flex justify-end gap-2 mt-6">
            <button class="bg-gray-300 px-4 py-1 rounded" onClick={() => props.onCerrar()}>
              Cancelar
            </button>
            <button class="bg-blue-600 text-white px-4 py-1 rounded" onClick={handleSubmit}>
              Guardar
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
