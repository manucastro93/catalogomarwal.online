import { createEffect, createSignal, Show, For } from 'solid-js';
import type { Cliente } from '../../types/cliente';
import { editarCliente } from '../../services/cliente.service';
import { obtenerProvincias, obtenerLocalidades } from '../../services/ubicacion.service';
import { z } from 'zod';

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  email: z.string().email('Email inválido'),
  telefono: z.string().optional(),
  direccion: z.string().min(1, 'La dirección es obligatoria'),
  razonSocial: z.string().optional(),
  cuit_cuil: z.string().min(6, 'CUIT/CUIL obligatorio'),
  provinciaId: z.string().min(1, 'Seleccione una provincia'),
  localidadId: z.string().min(1, 'Seleccione una localidad'),
});

export default function ModalCliente(props: {
  cliente: Cliente;
  onCerrar: () => void;
  onActualizado: () => void;
}) {
  const [form, setForm] = createSignal({ ...props.cliente });
  const [errores, setErrores] = createSignal<{ [k: string]: string }>({});
  const [provincias, setProvincias] = createSignal<any[]>([]);
  const [localidades, setLocalidades] = createSignal<any[]>([]);

  createEffect(() => {
    obtenerProvincias().then(setProvincias);
  });

  createEffect(() => {
    if (form().provinciaId) {
      obtenerLocalidades(Number(form().provinciaId)).then(setLocalidades);
    }
  });

  const handleInput = (campo: string, valor: string | number) => {
    setForm({ ...form(), [campo]: valor });
  };

  const handleGuardar = async () => {
    const parsed = schema.safeParse(form());
    if (!parsed.success) {
      const errMap: { [k: string]: string } = {};
      parsed.error.errors.forEach(e => {
        if (e.path[0]) errMap[e.path[0] as string] = e.message;
      });
      setErrores(errMap);
      return;
    }
    try {
      await editarCliente(props.cliente.id, form());
      props.onActualizado();
      props.onCerrar();
    } catch (e) {
      console.error('Error al guardar:', e);
    }
  };

  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div class="bg-white w-full max-w-2xl p-6 rounded shadow overflow-y-auto max-h-[90vh]">
        <h2 class="text-2xl font-bold mb-4">Editar Cliente</h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium">Nombre</label>
            <input value={form().nombre} onInput={e => handleInput('nombre', e.currentTarget.value)} class="input" />
            <Show when={errores().nombre}><p class="text-red-500 text-sm">{errores().nombre}</p></Show>
          </div>
          <div>
            <label class="block text-sm font-medium">Email</label>
            <input value={form().email} onInput={e => handleInput('email', e.currentTarget.value)} class="input" />
            <Show when={errores().email}><p class="text-red-500 text-sm">{errores().email}</p></Show>
          </div>
          <div>
            <label class="block text-sm font-medium">Teléfono</label>
            <input value={form().telefono} onInput={e => handleInput('telefono', e.currentTarget.value)} class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium">Dirección</label>
            <input value={form().direccion} onInput={e => handleInput('direccion', e.currentTarget.value)} class="input" />
            <Show when={errores().direccion}><p class="text-red-500 text-sm">{errores().direccion}</p></Show>
          </div>
          <div>
            <label class="block text-sm font-medium">Razón social</label>
            <input value={form().razonSocial} onInput={e => handleInput('razonSocial', e.currentTarget.value)} class="input" />
          </div>
          <div>
            <label class="block text-sm font-medium">CUIT / CUIL</label>
            <input value={form().cuit_cuil} onInput={e => handleInput('cuit_cuil', e.currentTarget.value)} class="input" />
            <Show when={errores().cuit_cuil}><p class="text-red-500 text-sm">{errores().cuit_cuil}</p></Show>
          </div>
          <div>
            <label class="block text-sm font-medium">Provincia</label>
            <select
              value={form().provinciaId}
              onChange={e => handleInput('provinciaId', e.currentTarget.value)}
              class="input"
            >
              <option value="">Seleccionar...</option>
              <For each={provincias()}>{(p) => <option value={p.id}>{p.nombre}</option>}</For>
            </select>
            <Show when={errores().provinciaId}><p class="text-red-500 text-sm">{errores().provinciaId}</p></Show>
          </div>
          <div>
            <label class="block text-sm font-medium">Localidad</label>
            <select
              value={form().localidadId}
              onChange={e => handleInput('localidadId', e.currentTarget.value)}
              class="input"
            >
              <option value="">Seleccionar...</option>
              <For each={localidades()}>{(l) => <option value={l.id}>{l.nombre}</option>}</For>
            </select>
            <Show when={errores().localidadId}><p class="text-red-500 text-sm">{errores().localidadId}</p></Show>
          </div>
        </div>

        <div class="mt-6 flex justify-end gap-2">
          <button onClick={props.onCerrar} class="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400 text-sm">
            Cancelar
          </button>
          <button onClick={handleGuardar} class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}
