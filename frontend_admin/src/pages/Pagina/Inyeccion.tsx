import { createSignal, createResource, For, Show } from 'solid-js';
import ModalInyeccion from '@/components/Pagina/Inyeccion/ModalInyeccion';
import ModalConfirmacion from '@/components/Layout/ModalConfirmacion';
import ModalMensaje from '@/components/Layout/ModalMensaje';
import {
  obtenerCategoriasPiezas,
  crearCategoriaPieza,
  editarCategoriaPieza,
  eliminarCategoriaPieza
} from '@/services/categoriaPieza.service';
import {
  obtenerMateriales,
  crearMaterial,
  editarMaterial,
  eliminarMaterial
} from '@/services/material.service';
import {
  obtenerMaquinas,
  crearMaquina,
  editarMaquina,
  eliminarMaquina
} from '@/services/maquina.service';

export default function Inyeccion() {
  const [reload, setReload] = createSignal(0);

  // Resources
  const [categorias] = createResource(reload, obtenerCategoriasPiezas);
  const [materiales] = createResource(reload, obtenerMateriales);
  const [maquinas] = createResource(reload, obtenerMaquinas);

  // Modal edición/alta
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [tipoModal, setTipoModal] = createSignal<'categoria' | 'material' | 'maquina' | null>(null);
  const [itemEditar, setItemEditar] = createSignal<any>(null);

  // Modal confirmación eliminar
  const [modalConfirm, setModalConfirm] = createSignal<{tipo: string, id: number} | null>(null);

  // Modal mensaje resultado
  const [modalMsg, setModalMsg] = createSignal('');
  
  // Rubro fijo para Inyección
  const RUBRO_INYECCION_ID = 1;

  // Abrir modales
  const abrirNuevo = (tipo: 'categoria' | 'material' | 'maquina') => {
    setTipoModal(tipo);
    setItemEditar(null);
    setModalAbierto(true);
  };
  const abrirEditar = (tipo: 'categoria' | 'material' | 'maquina', item: any) => {
    setTipoModal(tipo);
    setItemEditar(item);
    setModalAbierto(true);
  };

  // Guardar/Editar
  const handleGuardar = async (data: any) => {
    let fueEdicion = !!itemEditar();
    try {
      if (tipoModal() === "maquina") {
        if (itemEditar()) await editarMaquina(itemEditar().id, data);
        else await crearMaquina(data);
      } else if (tipoModal() === "material") {
        if (itemEditar()) await editarMaterial(itemEditar().id, data);
        else await crearMaterial(data);
      } else if (tipoModal() === "categoria") {
        if (itemEditar()) await editarCategoriaPieza(itemEditar().id, data);
        else await crearCategoriaPieza(data);
      }
      setModalAbierto(false);
      setReload(r => r + 1);
      setModalMsg(fueEdicion ? "¡Editado correctamente!" : "¡Guardado correctamente!");
    } catch (e) {
      setModalMsg("Error al guardar");
    }
  };

  // Confirmar eliminar
  const pedirConfirm = (tipo: string, id: number) => setModalConfirm({ tipo, id });
  const confirmarEliminar = async () => {
    if (!modalConfirm()) return;
    const { tipo, id } = modalConfirm()!;
    try {
      if (tipo === "maquina") await eliminarMaquina(id);
      if (tipo === "material") await eliminarMaterial(id);
      if (tipo === "categoria") await eliminarCategoriaPieza(id);
      setModalMsg("¡Eliminado correctamente!");
      setReload(r => r + 1);
    } catch (e) {
      setModalMsg("Error al eliminar");
    }
    setModalConfirm(null);
  };

  // Helpers visuales
  const Card = (props: any) => (
    <div class="bg-white shadow-lg p-6 mb-8 transition">{props.children}</div>
  );
  const SectionHeader = (props: any) => (
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-xl font-bold tracking-tight text-gray-800">{props.children}</h2>
      <button
        class="bg-green-600 hover:bg-green-700 transition text-white px-5 py-2 rounded-xl text-sm font-semibold shadow"
        onClick={props.onNuevo}
      >+ Agregar</button>
    </div>
  );

  return (
    <>
      <div class="p-6 max-w-5xl mx-auto min-h-screen">
        <h1 class="text-3xl font-extrabold text-gray-900 mb-10">Gestión de Inyección</h1>

        {/* CATEGORÍAS */}
        <Card>
          <SectionHeader onNuevo={() => abrirNuevo('categoria')}>
            Categorías
          </SectionHeader>
          <Show when={categorias()} fallback={<div>Cargando...</div>}>
            <table class="w-full text-sm border-collapse">
              <thead class="bg-gray-100">
                <tr>
                  <th class="text-left p-3 border-b">ID</th>
                  <th class="text-left p-3 border-b">Nombre</th>
                  <th class="text-left p-3 border-b">Descripción</th>
                  <th class="p-3 border-b text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <For each={categorias()}>
                  {(cat) => (
                    <tr class="hover:bg-gray-50 border-b">
                      <td class="p-3 font-mono">{cat.id}</td>
                      <td class="p-3">{cat.nombre}</td>
                      <td class="p-3">{cat.descripcion}</td>
                      <td class="p-3 text-right space-x-2">
                        <button class="text-blue-600 hover:underline font-semibold"
                          onClick={() => abrirEditar('categoria', cat)}
                        >Editar</button>
                        <button class="text-red-600 hover:underline font-semibold"
                          onClick={() => pedirConfirm('categoria', cat.id)}
                        >Eliminar</button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        </Card>

        {/* MATERIALES */}
        <Card>
          <SectionHeader onNuevo={() => abrirNuevo('material')}>
            Materiales
          </SectionHeader>
          <Show when={materiales()} fallback={<div>Cargando...</div>}>
            <table class="w-full text-sm border-collapse">
              <thead class="bg-gray-100">
                <tr>
                  <th class="text-left p-3 border-b">ID</th>
                  <th class="text-left p-3 border-b">Código</th>
                  <th class="text-left p-3 border-b">Descripción</th>
                  <th class="p-3 border-b text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <For each={materiales()}>
                  {(mat) => (
                    <tr class="hover:bg-gray-50 border-b">
                      <td class="p-3 font-mono">{mat.id}</td>
                      <td class="p-3">{mat.codigo}</td>
                      <td class="p-3">{mat.descripcion}</td>
                      <td class="p-3 text-right space-x-2">
                        <button class="text-blue-600 hover:underline font-semibold"
                          onClick={() => abrirEditar('material', mat)}
                        >Editar</button>
                        <button class="text-red-600 hover:underline font-semibold"
                          onClick={() => pedirConfirm('material', mat.id)}
                        >Eliminar</button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        </Card>

        {/* MAQUINAS */}
        <Card>
          <SectionHeader onNuevo={() => abrirNuevo('maquina')}>
            Máquinas
          </SectionHeader>
          <Show when={maquinas()} fallback={<div>Cargando...</div>}>
            <table class="w-full text-sm border-collapse">
              <thead class="bg-gray-100">
                <tr>
                  <th class="text-left p-3 border-b">ID</th>
                  <th class="text-left p-3 border-b">Código</th>
                  <th class="text-left p-3 border-b">Nombre</th>
                  <th class="text-left p-3 border-b">Descripción</th>
                  <th class="text-left p-3 border-b">Toneladas</th>
                  <th class="p-3 border-b text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <For each={maquinas()}>
                  {(maq) => (
                    <tr class="hover:bg-gray-50 border-b">
                      <td class="p-3 font-mono">{maq.id}</td>
                      <td class="p-3">{maq.codigo}</td>
                      <td class="p-3">{maq.nombre}</td>
                      <td class="p-3">{maq.descripcion}</td>
                      <td class="p-3">{maq.toneladas}</td>
                      <td class="p-3 text-right space-x-2">
                        <button class="text-blue-600 hover:underline font-semibold"
                          onClick={() => abrirEditar('maquina', maq)}
                        >Editar</button>
                        <button class="text-red-600 hover:underline font-semibold"
                          onClick={() => pedirConfirm('maquina', maq.id)}
                        >Eliminar</button>
                      </td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        </Card>
      </div>
      {/* MODAL ALTA/EDICIÓN */}
      <Show when={modalAbierto()}>
        <ModalInyeccion
          abierto={true}
          tipo={tipoModal() || 'maquina'}
          item={itemEditar()}
          onCerrar={() => setModalAbierto(false)}
          onGuardar={handleGuardar}
          rubroId={RUBRO_INYECCION_ID}
        />
      </Show>
      {/* MODAL CONFIRMAR ELIMINAR */}
      <ModalConfirmacion
        abierto={!!modalConfirm()}
        mensaje="¿Seguro que querés eliminar este registro?"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setModalConfirm(null)}
      />
      {/* MODAL MENSAJE */}
      <ModalMensaje
        mensaje={modalMsg()}
        cerrar={() => setModalMsg('')}
      />
    </>
  );
}
