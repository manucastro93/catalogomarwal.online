import { createSignal, Show, onMount, createResource, createEffect } from 'solid-js';
import type { Operario } from '@/types/operario';
import { obtenerRubros } from '@/services/rubro.service';
import { crearOperario, editarOperario } from '@/services/operario.service';

import type { Rubro } from '@/types/rubro';

export default function ModalNuevoOperario(props: {
  abierto: boolean;
  operario?: Operario | null;
  cerrar: () => void;
  onExito: (msg: string) => void;
}) {
  const [form, setForm] = createSignal<Partial<Operario>>({});
  const [guardando, setGuardando] = createSignal(false);
  const [error, setError] = createSignal('');
  const [rubros] = createResource(obtenerRubros);

  // Si el modal se abre en modo edición, seteamos el form con el operario a editar
    createEffect(() => {
    if (props.abierto && rubros()) {
        if (props.operario) setForm({ ...props.operario });
        else setForm({});
    }
    });

  const handleChange = (key: keyof Operario, value: any) => {
    setForm(f => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    try {
      if (props.operario?.id) {
        await editarOperario(props.operario.id, form());
        props.onExito('Operario editado correctamente');
      } else {
        await crearOperario(form());
        props.onExito('Operario creado correctamente');
      }
      props.cerrar();
    } catch (err) {
      setError('Error al guardar operario');
    }
    setGuardando(false);
  };
  console.log('form rubroId', form().rubroId, typeof form().rubroId);

  if (!props.abierto) return null;
  return (
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <form
        class="bg-white rounded-2xl shadow-xl p-8 min-w-[340px] w-full max-w-md space-y-4"
        onSubmit={handleSubmit}
      >
        <h2 class="text-xl font-bold mb-2">{props.operario ? 'Editar' : 'Nuevo'} operario</h2>

        <div>
          <label class="block font-medium mb-1">Código</label>
          <input
            type="text"
            class="border rounded-lg px-3 py-2 w-full"
            required
            value={form().codigo || ''}
            onInput={e => handleChange('codigo', e.currentTarget.value)}
          />
        </div>
        <div>
          <label class="block font-medium mb-1">Nombre</label>
          <input
            type="text"
            class="border rounded-lg px-3 py-2 w-full"
            required
            value={form().nombre || ''}
            onInput={e => handleChange('nombre', e.currentTarget.value)}
          />
        </div>
        <div>
          <label class="block font-medium mb-1">Apellido</label>
          <input
            type="text"
            class="border rounded-lg px-3 py-2 w-full"
            required
            value={form().apellido || ''}
            onInput={e => handleChange('apellido', e.currentTarget.value)}
          />
        </div>
        <div>
          <label class="block font-medium mb-1">Rubro</label>
          <select
  class="border rounded-lg px-3 py-2 w-full"
  required
  value={form().rubroId !== undefined && form().rubroId !== null ? String(form().rubroId) : ""}
  onChange={e => handleChange('rubroId', Number(e.currentTarget.value))}
>
  <option value="">Seleccionar rubro...</option>
  <Show when={rubros() && rubros().length}>
    {rubros()!.map((rubro: Rubro) => (
      <option value={String(rubro.id)}>{rubro.nombre}</option>
    ))}
  </Show>
</select>

        </div>
        <Show when={error()}>
          <div class="text-red-600 text-sm">{error()}</div>
        </Show>

        <div class="flex justify-end gap-2 mt-6">
          <button
            type="submit"
            class="bg-green-600 text-white px-4 py-2 rounded text-sm"
            disabled={guardando()}
          >
            {guardando() ? 'Guardando...' : 'Guardar'}
          </button>
          <button type="button" class="px-4 py-2 border rounded text-sm" onClick={props.cerrar}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
