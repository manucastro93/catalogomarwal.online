import { createSignal, createEffect, Show, createResource } from 'solid-js';
import type { Pieza } from '@/types/pieza';
import { crearPieza, editarPieza } from '@/services/pieza.service';
import { obtenerCategoriasPiezas } from '@/services/categoriaPieza.service';
import { obtenerMateriales } from '@/services/material.service';
import { Material } from '@/types/material';
import { CategoriaPieza } from '@/types/categoriaPieza';
import Loader from '@/components/Layout/Loader';

export default function ModalNuevaPieza(props: {
    abierto: boolean;
    pieza: Pieza | null;
    onCerrar: (mensajeExito?: string) => void;
}) {
    const [form, setForm] = createSignal<Partial<Pieza>>(props.pieza || {});
    const [cargando, setCargando] = createSignal(false);
    const [error, setError] = createSignal<string | null>(null);

    // Cargá los datos para los selects
    const [categorias] = createResource(obtenerCategoriasPiezas);
    const [materiales] = createResource(obtenerMateriales);

    // ID de rubro Inyección fijo (buscalo en tu base, por defecto 1 si lo insertaste primero)
    const RUBRO_INYECCION_ID = 1;
    const RUBRO_INYECCION_NOMBRE = 'Inyección';

    createEffect(() => {
        setForm(
            props.pieza
                ? { ...props.pieza, rubroId: RUBRO_INYECCION_ID }
                : { rubroId: RUBRO_INYECCION_ID }
        );

        setError(null);
    });

    const handleChange = (e: Event) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement;
        const name = target.name;
        setForm(f => ({
            ...f,
            [name]: target.value === '' ? undefined : target.value
        }));
    };

    const handleNumberChange = (e: Event) => {
        const target = e.target as HTMLInputElement | HTMLSelectElement;
        const name = target.name;
        setForm(f => ({
            ...f,
            [name]: target.value === '' ? undefined : Number(target.value)
        }));
    };

    const handleSubmit = async (e: Event) => {
        e.preventDefault();
        setCargando(true);
        setError(null);

        try {
            if (!form().codigo || !form().categoria || !form().rubroId) {
                setError('Código, Categoría y Rubro son obligatorios.');
                setCargando(false);
                return;
            }

            if (props.pieza) {
                await editarPieza(props.pieza.id, form());
                props.onCerrar('Pieza editada correctamente');
            } else {
                await crearPieza(form());
                props.onCerrar('Pieza creada correctamente');
            }
        } catch (err: any) {
            setError(err?.message || 'Error al guardar la pieza');
        }
        setCargando(false);
    };

    if (!props.abierto) return null;

    return (
        <div class="fixed z-40 inset-0 bg-black/30 flex items-center justify-center">
            <div class="bg-white p-6 rounded-2xl shadow-xl w-full max-w-xl relative">
                <h2 class="text-xl font-bold mb-2">
                    {props.pieza ? 'Editar pieza' : 'Nueva pieza'}
                </h2>

                <Show when={cargando()}>
                    <Loader />
                </Show>

                <form class="grid grid-cols-2 gap-4 mt-2" onSubmit={handleSubmit}>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Código *</label>
                        <input
                            type="text"
                            name="codigo"
                            value={form().codigo || ''}
                            onInput={handleChange}
                            class="border rounded px-3 py-2 w-full"
                            required
                            autofocus
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Descripción</label>
                        <input
                            type="text"
                            name="descripcion"
                            value={form().descripcion || ''}
                            onInput={handleChange}
                            class="border rounded px-3 py-2 w-full"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Categoría *</label>
                        <select
                            name="categoria"
                            value={form().categoria || ''}
                            onChange={handleNumberChange}
                            class="border rounded px-3 py-2 w-full"
                            required
                        >
                            <option value="">Seleccionar...</option>
                            <Show when={categorias()}>
                            {categorias()!.map((c: CategoriaPieza) => (
                                <option value={c.id}>{c.nombre}</option>
                            ))}
                            </Show>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Material</label>
                        <select
                            name="material"
                            value={form().material || ''}
                            onChange={handleNumberChange}
                            class="border rounded px-3 py-2 w-full"
                        >
                            <option value="">Seleccionar...</option>
                           <Show when={materiales()}>
                            {materiales()!.map((m: Material) => (
                                <option value={m.id}>
                                {m.codigo}{m.descripcion ? ` - ${m.descripcion}` : ''}
                                </option>
                            ))}
                            </Show>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Rubro *</label>
                        <input
                            type="text"
                            value={RUBRO_INYECCION_NOMBRE}
                            class="border rounded px-3 py-2 w-full bg-gray-100"
                            disabled
                            readonly
                        />
                        <input
                            type="hidden"
                            name="rubroId"
                            value={RUBRO_INYECCION_ID}
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Cavidades</label>
                        <input
                            type="number"
                            name="cavidades"
                            value={form().cavidades ?? ''}
                            onInput={handleNumberChange}
                            min={0}
                            class="border rounded px-3 py-2 w-full"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Pzs/Seg</label>
                        <input
                            type="number"
                            step="0.001"
                            name="pzsXSeg"
                            value={form().pzsXSeg ?? ''}
                            onInput={handleNumberChange}
                            min={0}
                            class="border rounded px-3 py-2 w-full"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Ciclo/Seg</label>
                        <input
                            type="number"
                            step="0.001"
                            name="cicloXSeg"
                            value={form().cicloXSeg ?? ''}
                            onInput={handleNumberChange}
                            min={0}
                            class="border rounded px-3 py-2 w-full"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Ciclos/Turno</label>
                        <input
                            type="number"
                            name="ciclosXTurno"
                            value={form().ciclosXTurno ?? ''}
                            onInput={handleNumberChange}
                            min={0}
                            class="border rounded px-3 py-2 w-full"
                        />
                    </div>
                    <div>
                        <label class="block text-sm font-semibold mb-1">Peso</label>
                        <input
                            type="number"
                            name="peso"
                            value={form().peso ?? ''}
                            onInput={handleNumberChange}
                            min={0}
                            class="border rounded px-3 py-2 w-full"
                        />
                    </div>
                    <div class="col-span-2">
                        <label class="block text-sm font-semibold mb-1">Colada</label>
                        <input
                            type="text"
                            name="colada"
                            value={form().colada || ''}
                            onInput={handleChange}
                            class="border rounded px-3 py-2 w-full"
                        />
                    </div>

                    <div class="flex justify-end gap-2 mt-6">
                        <button
                            type="button"
                            class="px-4 py-2 border rounded text-sm"
                            onClick={() => props.onCerrar()}
                            disabled={cargando()}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            class="bg-green-600 text-white px-4 py-2 rounded text-sm"
                            disabled={cargando()}
                        >
                            {props.pieza ? 'Guardar cambios' : 'Guardar'}
                        </button>
                    </div>
                </form>
                <Show when={error()}>
                    <div class="text-red-600 mt-2 text-sm">{error()}</div>
                </Show>
            </div>
        </div>
    );
}
