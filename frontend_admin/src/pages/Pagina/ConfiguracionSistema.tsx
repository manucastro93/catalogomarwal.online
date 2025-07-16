import { createSignal, createResource, For, Show } from 'solid-js';
import {
  obtenerConfiguraciones,
  editarConfiguracion,
  crearConfiguracion,
} from '@/services/configuracionSistema.service';
import type { ConfiguracionSistema } from '@/types/configuracionSistema';
import ModalMensaje from '@/components/Layout/ModalMensaje';

export default function ConfiguracionSistemaPage() {
  const [configuraciones, { refetch }] = createResource(obtenerConfiguraciones);
  const [mensaje, setMensaje] = createSignal('');
  const [mostrarMensaje, setMostrarMensaje] = createSignal(false);
  const [editando, setEditando] = createSignal<{ [clave: string]: string }>({});

  const [nuevaClave, setNuevaClave] = createSignal('');
  const [nuevoValor, setNuevoValor] = createSignal('');
  const [nuevaDescripcion, setNuevaDescripcion] = createSignal('');

  const handleEditar = async (config: ConfiguracionSistema) => {
    try {
      const nuevo = editando()[config.clave];
      await editarConfiguracion(config.id, {
        valor: nuevo,
        descripcion: config.descripcion,
      });
      setMensaje(`Configuración "${config.clave}" actualizada correctamente ✅`);
      setMostrarMensaje(true);
      setEditando((prev) => ({ ...prev, [config.clave]: nuevo }));
      await refetch();
    } catch (err) {
      setMensaje(`Error al guardar configuración "${config.clave}" ❌`);
      setMostrarMensaje(true);
    }
  };

  const handleAgregar = async () => {
    if (!nuevaClave() || !nuevoValor()) {
      setMensaje('Debe completar la clave y el valor');
      setMostrarMensaje(true);
      return;
    }
    try {
      await crearConfiguracion({
        clave: nuevaClave(),
        valor: nuevoValor(),
        descripcion: nuevaDescripcion(),
      });
      setMensaje('Configuración agregada correctamente ✅');
      setMostrarMensaje(true);
      setNuevaClave('');
      setNuevoValor('');
      setNuevaDescripcion('');
      await refetch();
    } catch (err) {
      setMensaje('Error al agregar configuración ❌');
      setMostrarMensaje(true);
    }
  };

  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Configuración del sistema</h1>

      <Show when={mostrarMensaje()}>
        <ModalMensaje
          mensaje={mensaje()}
          cerrar={() => setMostrarMensaje(false)}
        />
      </Show>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6">
        <input
          type="text"
          placeholder="Clave"
          class="border p-2 rounded text-sm"
          value={nuevaClave()}
          onInput={(e) => setNuevaClave(e.currentTarget.value)}
        />
        <input
          type="text"
          placeholder="Valor"
          class="border p-2 rounded text-sm"
          value={nuevoValor()}
          onInput={(e) => setNuevoValor(e.currentTarget.value)}
        />
        <input
          type="text"
          placeholder="Descripción (opcional)"
          class="border p-2 rounded text-sm"
          value={nuevaDescripcion()}
          onInput={(e) => setNuevaDescripcion(e.currentTarget.value)}
        />
      </div>
      <button
        class="bg-green-600 text-white px-4 py-2 rounded text-sm mb-8"
        onClick={handleAgregar}
      >
        Agregar configuración
      </button>

      <div class="overflow-x-auto">
        <table class="w-full border border-gray-200 rounded text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="px-3 py-2 text-left">Clave</th>
              <th class="px-3 py-2 text-left">Valor</th>
              <th class="px-3 py-2 text-left">Descripción</th>
              <th class="px-3 py-2 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            <For each={configuraciones()}>
              {(config) => (
                <tr class="border-t border-gray-100">
                  <td class="px-3 py-2 font-mono">{config.clave}</td>
                  <td class="px-3 py-2">
                    <input
                      type="text"
                      class="border p-1 rounded w-full text-sm"
                      value={editando()[config.clave] ?? config.valor}
                      onInput={(e) =>
                        setEditando((prev) => ({ ...prev, [config.clave]: e.currentTarget.value }))
                      }
                    />
                  </td>
                  <td class="px-3 py-2 text-sm text-gray-600">
                    {config.descripcion || '-'}
                  </td>
                  <td class="px-3 py-2 text-center">
                    <button
                      class="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                      onClick={() => handleEditar(config)}
                    >
                      Guardar
                    </button>
                  </td>
                </tr>
              )}
            </For>
          </tbody>
        </table>
      </div>
    </div>
  );
}
