import { createSignal, createResource, Show, createEffect } from "solid-js";
import { obtenerOrdenesTrabajo, eliminarOrdenTrabajo } from "@/services/ordenTrabajo.service";
import { obtenerPlantas } from '@/services/planta.service';
import FiltrosOrdenesTrabajo from "@/components/OrdenTrabajo/FiltrosOrdenesTrabajo";
import TablaOrdenesTrabajo from "@/components/OrdenTrabajo/TablaOrdenesTrabajo";
import ModalOrdenTrabajo from "@/components/OrdenTrabajo/ModalOrdenTrabajo";
import ModalDetalleOrdenTrabajo from "@/components/OrdenTrabajo/ModalDetalleOrdenTrabajo";
import Loader from "@/components/Layout/Loader";
import type { OrdenTrabajo, OrdenTrabajoParams } from "@/types/ordenTrabajo";
import type { Planta } from "@/types/planta";

export default function OrdenesDeTrabajoPage() {
  // Filtros
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal("fecha");
  const [direccion, setDireccion] = createSignal<"asc" | "desc">("desc");
  const [desde, setDesde] = createSignal("");
  const [hasta, setHasta] = createSignal("");
  const [turno, setTurno] = createSignal("");
  const [plantaId, setPlantaId] = createSignal("");
  
  // Plantas
  const [plantas] = createResource(obtenerPlantas);
  const [plantasCargadas, setPlantasCargadas] = createSignal<Planta[]>([]);
  createEffect(() => {
    const p = plantas();
    if (Array.isArray(p)) setPlantasCargadas(p);
  });

  // Fetch OTs
  const fetchParams = () => ({
    page: pagina(),
    limit: 10,
    orden: orden(),
    direccion: direccion(),
    desde: desde() || undefined,
    hasta: hasta() || undefined,
    turno: turno() || undefined,
    plantaId: plantaId() ? Number(plantaId()) : undefined,
  });

  const [respuesta, { refetch }] = createResource(fetchParams, obtenerOrdenesTrabajo);

  // Modal states
  const [modalNuevaOT, setModalNuevaOT] = createSignal(false);
  const [otParaDetalle, setOtParaDetalle] = createSignal<OrdenTrabajo | null>(null);


  const eliminarOT = async (ot: OrdenTrabajo) => {
    if (!window.confirm("¿Estás seguro de que querés eliminar esta Orden de Trabajo?")) return;
    try {
      await eliminarOrdenTrabajo(ot.id); // Acá usás el id del objeto
      refetch();
    } catch (err) {
      alert("Error al eliminar la OT");
    }
  };

  return (
    <div class="p-6">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-2xl font-bold">Órdenes de Trabajo</h1>
        <button
          onClick={() => setModalNuevaOT(true)}
          class="bg-green-600 text-white px-3 py-1 rounded text-sm"
        >
          + Crear Orden de Trabajo
        </button>
      </div>

      <FiltrosOrdenesTrabajo
        desde={desde()}
        hasta={hasta()}
        turno={turno()}
        plantaId={plantaId()}
        setDesde={setDesde}
        setHasta={setHasta}
        setTurno={setTurno}
        setPlantaId={setPlantaId}
        plantas={plantasCargadas()}
        setPagina={setPagina}
      />

      <Show when={!respuesta.loading} fallback={<Loader />}>
        <TablaOrdenesTrabajo
          ordenes={respuesta()?.data ?? []}
          onVerDetalle={setOtParaDetalle}
          onEliminarOT={eliminarOT}
          orden={orden()}
          direccion={direccion()}
          onOrdenar={setOrden}
        />
      </Show>

      <Show when={modalNuevaOT()}>
        <ModalOrdenTrabajo
          onCerrar={() => {
            setModalNuevaOT(false);
            refetch();
          }}
        />
      </Show>

      <Show when={otParaDetalle()}>
        <ModalDetalleOrdenTrabajo
          orden={otParaDetalle()}
          onCerrar={() => setOtParaDetalle(null)}
        />
      </Show>
    </div>
  );
}
