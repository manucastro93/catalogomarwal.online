import {
  Show,
  createSignal,
  createEffect,
  onCleanup,
  For,
  createResource,
} from 'solid-js';
import { crearCliente, editarCliente } from '../services/cliente.service';
import { obtenerProvincias, obtenerLocalidades } from '../services/ubicacion.service';
import type { Cliente } from '../shared/types/cliente';
import { useAuth } from '../store/auth';
import { mostrarMensaje } from '../utils/mensajes';

interface Props {
  abierto: boolean;
  cliente: Cliente | null;
  onClose: () => void;
}

export default function ModalCliente(props: Props) {
  const { usuario } = useAuth();

  const [nombre, setNombre] = createSignal('');
  const [telefono, setTelefono] = createSignal('');
  const [email, setEmail] = createSignal('');
  const [cuitCuil, setCuitCuil] = createSignal('');
  const [razonSocial, setRazonSocial] = createSignal('');
  const [direccion, setDireccion] = createSignal('');
  const [provinciaId, setProvinciaId] = createSignal<number | undefined>();
  const [localidadId, setLocalidadId] = createSignal<number | undefined>();
  const [errores, setErrores] = createSignal<{ [key: string]: string }>({});

  const [provincias] = createResource(obtenerProvincias);
  const [localidades] = createResource(provinciaId, (id) =>
    id ? obtenerLocalidades(id) : Promise.resolve([])
  );

  createEffect(() => {
    if (props.abierto) {
      document.body.style.overflow = 'hidden';

      if (props.cliente) {
        setNombre(props.cliente.nombre || '');
        setTelefono(props.cliente.telefono || '');
        setEmail(props.cliente.email || '');
        setCuitCuil(props.cliente.cuit_cuil || '');
        setRazonSocial(props.cliente.razonSocial || '');
        setDireccion(props.cliente.direccion || '');
        setProvinciaId(props.cliente.provinciaId);

        // Esperar hasta que se carguen localidades
        const interval = setInterval(() => {
          if (localidades()?.length) {
            setLocalidadId(props.cliente!.localidadId);
            clearInterval(interval);
          }
        }, 100);
      } else {
        limpiarFormulario();
      }
    } else {
      document.body.style.overflow = '';
    }
  });

  onCleanup(() => {
    document.body.style.overflow = '';
  });

  const limpiarFormulario = () => {
    setNombre('');
    setTelefono('');
    setEmail('');
    setCuitCuil('');
    setRazonSocial('');
    setDireccion('');
    setProvinciaId(undefined);
    setLocalidadId(undefined);
    setErrores({});
  };

  const validar = () => {
    const err: { [key: string]: string } = {};
    if (!nombre().trim()) err.nombre = 'El nombre es obligatorio';
    if (!telefono().trim()) err.telefono = 'El teléfono es obligatorio';
    if (!email().trim()) {
      err.email = 'El email es obligatorio';
    } else if (!/^\S+@\S+\.\S+$/.test(email())) {
      err.email = 'Formato de email inválido';
    }
    if (!cuitCuil().trim()) {
      err.cuitCuil = 'El CUIT/CUIL es obligatorio';
    } else if (!/^\d{11}$/.test(cuitCuil())) {
      err.cuitCuil = 'Formato de CUIT/CUIL inválido';
    }
    if (!direccion().trim()) err.direccion = 'La dirección es obligatoria';
    if (!provinciaId()) err.provinciaId = 'Seleccioná una provincia';
    if (!localidadId()) err.localidadId = 'Seleccioná una localidad';

    setErrores(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!validar()) return;

    const clienteData: Partial<Cliente> = {
      nombre: nombre().trim(),
      telefono: telefono().trim(),
      email: email().trim(),
      cuit_cuil: cuitCuil().trim(),
      razonSocial: razonSocial().trim(),
      direccion: direccion().trim(),
      provinciaId: provinciaId(),
      localidadId: localidadId(),
      vendedorId: usuario()?.rol === 'vendedor' ? usuario()?.id : undefined,
    };

    try {
      if (props.cliente) {
        // modo edición
        await editarCliente(props.cliente.id, clienteData);
        mostrarMensaje('Cliente modificado correctamente');
      } else {
        // modo creación
        await crearCliente(clienteData);
        mostrarMensaje('Cliente creado correctamente');
      }
      props.onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Show when={props.abierto}>
      <div
        id="overlay"
        class="fixed inset-0 z-40 flex items-center justify-center bg-black/50"
      >
        <div class="relative z-50 bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
          <h2 class="text-xl font-bold mb-4">{props.cliente ? 'Editar cliente' : 'Nuevo cliente'}</h2>

          <form onSubmit={handleSubmit} class="grid grid-cols-2 gap-4">
            <div class="col-span-2">
              <input
                class="border p-2 rounded w-full"
                placeholder="Nombre"
                value={nombre()}
                onInput={(e) => setNombre(e.currentTarget.value)}
              />
              <Show when={errores().nombre}><p class="text-red-600 text-sm">{errores().nombre}</p></Show>
            </div>

            <div>
              <input
                class="border p-2 rounded w-full"
                placeholder="Teléfono"
                value={telefono()}
                onInput={(e) => setTelefono(e.currentTarget.value)}
              />
              <Show when={errores().telefono}><p class="text-red-600 text-sm">{errores().telefono}</p></Show>
            </div>

            <div>
              <input
                class="border p-2 rounded w-full"
                placeholder="Email"
                value={email()}
                onInput={(e) => setEmail(e.currentTarget.value)}
              />
              <Show when={errores().email}><p class="text-red-600 text-sm">{errores().email}</p></Show>
            </div>

            <div>
              <input
                class="border p-2 rounded w-full"
                placeholder="CUIT / CUIL"
                value={cuitCuil()}
                onInput={(e) => setCuitCuil(e.currentTarget.value)}
              />
              <Show when={errores().cuitCuil}><p class="text-red-600 text-sm">{errores().cuitCuil}</p></Show>
            </div>

            <div>
              <input
                class="border p-2 rounded w-full"
                placeholder="Razón social"
                value={razonSocial()}
                onInput={(e) => setRazonSocial(e.currentTarget.value)}
              />
            </div>

            <div class="col-span-2">
              <input
                class="border p-2 rounded w-full"
                placeholder="Dirección"
                value={direccion()}
                onInput={(e) => setDireccion(e.currentTarget.value)}
              />
              <Show when={errores().direccion}><p class="text-red-600 text-sm">{errores().direccion}</p></Show>
            </div>

            <div>
              <select
                class="border p-2 rounded w-full"
                value={provinciaId() ?? ''}
                onChange={(e) => {
                  setProvinciaId(Number(e.currentTarget.value) || undefined);
                  setLocalidadId(undefined);
                }}
              >
                <option value="">Seleccionar provincia</option>
                <For each={provincias()}>{(p) => <option value={p.id}>{p.nombre}</option>}</For>
              </select>
              <Show when={errores().provinciaId}><p class="text-red-600 text-sm">{errores().provinciaId}</p></Show>
            </div>

            <div>
              <select
                class="border p-2 rounded w-full"
                value={localidadId() ?? ''}
                onChange={(e) => setLocalidadId(Number(e.currentTarget.value) || undefined)}
              >
                <option value="">Seleccionar localidad</option>
                <For each={localidades()}>{(l) => <option value={l.id}>{l.nombre}</option>}</For>
              </select>
              <Show when={errores().localidadId}><p class="text-red-600 text-sm">{errores().localidadId}</p></Show>
            </div>

            <div class="col-span-2 mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={props.onClose}
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
