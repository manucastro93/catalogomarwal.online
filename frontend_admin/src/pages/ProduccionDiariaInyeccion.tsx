import { createSignal, createResource, createMemo, Show } from 'solid-js';
import { obtenerReportesProduccion, eliminarReporteProduccionEncabezado } from '@/services/produccionInyeccion.service';
import ModalNuevoReporteInyeccion from '@/components/Produccion/Inyeccion/ModalNuevoReporte';
import ModalDetalleReporteProduccion from '@/components/Produccion/Inyeccion/ModalDetalleReporteProduccion';
import ModalMensaje from '@/components/Layout/ModalMensaje';
import ModalConfirmacion from '@/components/Layout/ModalConfirmacion';
import Loader from '@/components/Layout/Loader';
import TablaProduccionDiaria from '@/components/Produccion/Inyeccion/TablaProduccionDiaria';
import FiltrosProduccionDiaria from '@/components/Produccion/Inyeccion/FiltrosProduccionDiaria';
import type { ProduccionInyeccionParams, ReporteProduccionInyeccionEncabezado } from '@/types/produccionInyeccion';

const TURNOS_VALIDOS = ["mañana", "tarde", "noche"];

export default function ProduccionDiariaInyeccion() {
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal("fecha");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("desc");
  const [mensaje, setMensaje] = createSignal("");
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [reporteAEliminar, setReporteAEliminar] = createSignal<ReporteProduccionInyeccionEncabezado | null>(null);
  const [reporteParaVerDetalle, setReporteParaVerDetalle] = createSignal<ReporteProduccionInyeccionEncabezado | null>(null);

  // Filtros
  const [desde, setDesde] = createSignal("");
  const [hasta, setHasta] = createSignal("");
  const [turno, setTurno] = createSignal("");

  const fetchParams = createMemo<ProduccionInyeccionParams>(() => {
    const turnoVal = turno();
    return {
      page: pagina(),
      limit: 10,
      orden: orden(),
      direccion: direccion(),
      desde: desde() || undefined,
      hasta: hasta() || undefined,
      turno: TURNOS_VALIDOS.includes(turnoVal)
        ? (turnoVal as "mañana" | "tarde" | "noche")
        : undefined,
    };
  });

  const [respuesta, { refetch }] = createResource(
    fetchParams,
    obtenerReportesProduccion
  );

  const cambiarOrden = (col: string) => {
    if (orden() === col) {
      setDireccion(direccion() === "asc" ? "desc" : "asc");
    } else {
      setOrden(col);
      setDireccion("asc");
    }
  };

  const confirmarEliminacion = async () => {
    if (!reporteAEliminar()) return;
    await eliminarReporteProduccionEncabezado(reporteAEliminar()!.id);
    setReporteAEliminar(null);
    setMensaje("Reporte eliminado correctamente ✅");
    refetch();
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Producción Diaria Inyección</h1>
        <button
          onClick={() => setModalAbierto(true)}
          class="bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          + Nuevo Reporte Diario
        </button>
      </div>

      <FiltrosProduccionDiaria
        desde={desde()}
        hasta={hasta()}
        turno={turno()}
        setDesde={setDesde}
        setHasta={setHasta}
        setTurno={setTurno}
        setPagina={setPagina}
      />

      <Show when={!respuesta.loading} fallback={<Loader />}>
        <TablaProduccionDiaria
          reportes={respuesta()?.data ?? []}
          onEliminarReporte={setReporteAEliminar}
          onOrdenar={cambiarOrden}
          orden={orden()}
          direccion={direccion()}
          onVerDetalle={setReporteParaVerDetalle}
        />
      </Show>

      <div class="flex justify-center items-center gap-2 mt-4">
        <button
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() === 1}
        >
          ◀
        </button>
        <span class="text-sm">
          Página {respuesta()?.pagina ?? "-"} de{" "}
          {respuesta()?.totalPaginas ?? "-"}
        </span>
        <button
          onClick={() =>
            setPagina((p) => Math.min(respuesta()?.totalPaginas || p, p + 1))
          }
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() === (respuesta()?.totalPaginas ?? 1)}
        >
          ▶
        </button>
      </div>

      <Show when={modalAbierto()}>
        <ModalNuevoReporteInyeccion
          onCerrar={() => {
            setModalAbierto(false);
            refetch();
          }}
        />
      </Show>

      <Show when={!!reporteParaVerDetalle()}>
        <ModalDetalleReporteProduccion
          reporte={reporteParaVerDetalle()!}
          onCerrar={() => setReporteParaVerDetalle(null)}
        />
      </Show>

      <ModalConfirmacion
        mensaje="¿Estás seguro que querés eliminar este reporte?"
        abierto={!!reporteAEliminar()}
        onCancelar={() => setReporteAEliminar(null)}
        onConfirmar={confirmarEliminacion}
      />

      <Show when={mensaje()}>
        <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje("")} />
      </Show>
    </div>
  );
}
