import { createSignal, createResource, createMemo, Show } from 'solid-js';
import { obtenerOperarios, eliminarOperario } from '@/services/operario.service';
import TablaOperarios from '@/components/Operario/TablaOperarios';
import FiltrosOperarios from '@/components/Operario/FiltrosOperarios';
import ModalNuevoOperario from '@/components/Operario/ModalNuevoOperario';
import VerOperarioModal from '@/components/Operario/VerOperarioModal';
import ModalConfirmacion from '@/components/Layout/ModalConfirmacion';
import ModalMensaje from '@/components/Layout/ModalMensaje';

export default function Operarios() {
  const [busqueda, setBusqueda] = createSignal("");
  const [orden, setOrden] = createSignal("nombre");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("asc");

  const [operarioSeleccionado, setOperarioSeleccionado] = createSignal<any>(null);
  const [modalVerAbierto, setModalVerAbierto] = createSignal(false);
  const [modalNuevoAbierto, setModalNuevoAbierto] = createSignal(false);
  const [modalConfirmarAbierto, setModalConfirmarAbierto] = createSignal(false);
  const [idEliminar, setIdEliminar] = createSignal<number | null>(null);
  const [mensajeExito, setMensajeExito] = createSignal("");

  const cerrarModalMensaje = () => setMensajeExito("");

  const [operarios, { refetch }] = createResource(() => obtenerOperarios());

  const operariosFiltrados = createMemo(() => {
    const texto = busqueda().toLowerCase().trim();
    return (operarios() || []).filter(
      (v: any) =>
        v.nombre?.toLowerCase().includes(texto) ||
        v.email?.toLowerCase().includes(texto)
    );
  });

  const cambiarOrden = (col: string) => {
    if (orden() === col) {
      setDireccion(direccion() === "asc" ? "desc" : "asc");
    } else {
      setOrden(col);
      setDireccion("asc");
    }
  };

  const confirmarEliminar = (id: number) => {
    setIdEliminar(id);
    setModalConfirmarAbierto(true);
  };

  const eliminar = async () => {
    if (!idEliminar()) return;
    try {
      await eliminarOperario(idEliminar()!);
      setMensajeExito("Operario eliminado correctamente");
      setModalConfirmarAbierto(false);
      setIdEliminar(null);
      await refetch();
    } catch (error) {
      console.error(error);
      setMensajeExito("Error al eliminar operario");
    }
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Operarios</h1>
      </div>

      <FiltrosOperarios
        busqueda={busqueda()}
        onBuscar={setBusqueda}
        onNuevo={() => {
          setOperarioSeleccionado(null);
          setModalNuevoAbierto(true);
        }}
      />

      <Show when={!operarios.loading}>
        <TablaOperarios
          operarios={operariosFiltrados()}
          orden={orden()}
          direccion={direccion()}
          onOrdenar={cambiarOrden}
          onVer={(v) => {
            setOperarioSeleccionado(() => v);
            setModalVerAbierto(true);
          }}
          onEditar={(v) => {
            setOperarioSeleccionado(() => v);
            setModalNuevoAbierto(true);
          }}
          onEliminar={confirmarEliminar}
        />
      </Show>

      <Show when={modalVerAbierto()} keyed>
        <VerOperarioModal
          abierto={modalVerAbierto()}
          operario={operarioSeleccionado()}
          onCerrar={() => setModalVerAbierto(false)}
        />
      </Show>

      <Show when={modalNuevoAbierto()} keyed>
        <ModalNuevoOperario
          abierto={modalNuevoAbierto()}
          operario={operarioSeleccionado()}
          cerrar={() => {
            setModalNuevoAbierto(false);
            refetch();
          }}
          onExito={setMensajeExito}
        />
      </Show>

      <ModalMensaje mensaje={mensajeExito()} cerrar={cerrarModalMensaje} />

      <ModalConfirmacion
        abierto={modalConfirmarAbierto()}
        mensaje="¿Seguro que querés eliminar este operario?"
        onConfirmar={eliminar}
        onCancelar={() => setModalConfirmarAbierto(false)}
      />
    </div>
  );
}
