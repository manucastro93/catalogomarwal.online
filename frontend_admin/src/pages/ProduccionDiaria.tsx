import { createSignal, createResource, createMemo, Show, createEffect } from 'solid-js';
import { obtenerReportesProduccion, eliminarReporteProduccionEncabezado } from '@/services/produccion.service';
import { obtenerPlantas } from '@/services/planta.service';
import ModalNuevoReporte from '@/components/Produccion/ModalNuevoReporte';
import ModalOrdenTrabajo from '@/components/Produccion/ModalOrdenTrabajo';
import ModalOrdenesPendientes from '@/components/Produccion/ModalOrdenesPendientes';
import ModalDetalleReporteProduccion from '@/components/Produccion/ModalDetalleReporteProduccion';
import ModalMensaje from '@/components/Layout/ModalMensaje';
import ModalConfirmacion from '@/components/Layout/ModalConfirmacion';
import Loader from '@/components/Layout/Loader';
import TablaProduccionDiaria from '@/components/Produccion/TablaProduccionDiaria';
import FiltrosProduccionDiaria from '@/components/Produccion/FiltrosProduccionDiaria';
import type { ReporteProduccion, ProduccionParams, ReporteProduccionEncabezado } from '@/types/produccion';
import type { Planta } from '@/types/planta';

const TURNOS_VALIDOS = ["mañana", "tarde", "noche"];

export default function ProduccionDiaria() {
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal("fecha");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("desc");
  const [mensaje, setMensaje] = createSignal("");
  const [modalAbierto, setModalAbierto] = createSignal(false);
  const [modalOrdenTrabajoAbierto, setModalOrdenTrabajoAbierto] = createSignal(false);
  const [reporteAEliminar, setReporteAEliminar] =
    createSignal<ReporteProduccion | null>(null);
  const [modalOrdenesPendientesAbierto, setModalOrdenesPendientesAbierto] = createSignal(false);
  const [reporteParaVerDetalle, setReporteParaVerDetalle] = createSignal<ReporteProduccionEncabezado | null>(null);

  // Filtros
  const [desde, setDesde] = createSignal("");
  const [hasta, setHasta] = createSignal("");
  const [turno, setTurno] = createSignal("");
  const [plantaId, setPlantaId] = createSignal("");
  const [plantas] = createResource(obtenerPlantas);
  const [plantasCargadas, setPlantasCargadas] = createSignal<Planta[]>([]);
  createEffect(() => {
    const p = plantas();
    if (Array.isArray(p)) {
      setPlantasCargadas(p);
    }
  });

  const fetchParams = createMemo<ProduccionParams>(() => {
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
      plantaId: plantaId() ? Number(plantaId()) : undefined,
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
        <h1 class="text-2xl font-bold">Producción Diaria</h1>
        <button
          onClick={() => setModalAbierto(true)}
          class="bg-blue-600 text-white px-3 py-1 rounded text-sm"
        >
          + Nuevo Reporte Diario
        </button>
      </div>

      <Show when={plantasCargadas().length > 0}>
        <FiltrosProduccionDiaria
          desde={desde()}
          hasta={hasta()}
          turno={turno()}
          plantaId={plantaId()}
          plantas={plantasCargadas()}
          setDesde={setDesde}
          setHasta={setHasta}
          setTurno={setTurno}
          setPlantaId={setPlantaId}
          setPagina={setPagina}
        />
      </Show>

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
        <ModalNuevoReporte
          onCerrar={() => {
            setModalAbierto(false);
            refetch();
          }}
        />
      </Show>

      <Show when={modalOrdenTrabajoAbierto()}>
        <ModalOrdenTrabajo
          onCerrar={() => {
            setModalOrdenTrabajoAbierto(false);
            refetch();
          }}
        />
      </Show>

      <Show when={modalOrdenesPendientesAbierto()}>
        <ModalOrdenesPendientes
          onCerrar={() => setModalOrdenesPendientesAbierto(false)}
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
