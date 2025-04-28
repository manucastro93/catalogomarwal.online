import { createSignal, createResource, onMount, Show, For } from "solid-js";
import {
  fetchResumenProduccion,
  fetchResumenProduccionPorPlanta,
  fetchResumenProduccionPorCategoria,
  fetchResumenProduccionPorTurno,
  fetchResumenProduccionGeneral,
  fetchResumenProduccionEvolucion,
} from "../../services/graficos.service";
import { obtenerPlantas } from "../../services/planta.service";
import { obtenerCategorias } from "../../services/categoria.service";
import { useAuth } from "../../store/auth";
import { ROLES_USUARIOS } from "../../constants/rolesUsuarios";
import FiltrosProduccion from "../../components/Grafico/ResumenProduccion/FiltrosProduccion";
import TablaProduccion from "../../components/Grafico/ResumenProduccion/TablaProduccion";
import GraficosProduccion from "../../components/Grafico/ResumenProduccion/GraficosProduccion";

export default function ResumenProduccion() {
  const { usuario } = useAuth();
  const rolUsuarioId = usuario()?.rolUsuarioId || ROLES_USUARIOS.OPERARIO;

  const today = new Date();
  const primerDiaMes = new Date(today.getFullYear(), today.getMonth(), 1);

  const [desde, setDesde] = createSignal(primerDiaMes.toISOString().slice(0, 10));
  const [hasta, setHasta] = createSignal(today.toISOString().slice(0, 10));
  const [turno, setTurno] = createSignal("");
  const [plantaId, setPlantaId] = createSignal("");
  const [categoriaId, setCategoriaId] = createSignal("");
  const [producto, setProducto] = createSignal("");
  const [modo, setModo] = createSignal<"cantidad" | "valor">("valor");

  const [page, setPage] = createSignal(1);
  const limit = 10;

  const [plantas] = createResource(obtenerPlantas);
  const [categorias] = createResource(obtenerCategorias);

  const filtros = () => ({
    desde: desde(),
    hasta: hasta(),
    turno: turno(),
    plantaId: plantaId(),
    categoriaId: categoriaId(),
    producto: producto(),
    modo: modo(),
  });

  const [resumen] = createResource(
    () => ({ ...filtros(), page: page(), limit }),
    fetchResumenProduccion
  );
  const [resumenPlanta] = createResource(filtros, fetchResumenProduccionPorPlanta);
  const [resumenCategoria] = createResource(filtros, fetchResumenProduccionPorCategoria);
  const [resumenTurno] = createResource(filtros, fetchResumenProduccionPorTurno);
  const [resumenGeneral] = createResource(filtros, fetchResumenProduccionGeneral);
  const [resumenEvolucion] = createResource(filtros, fetchResumenProduccionEvolucion);

  
  function actualizarFiltros() {
    setPage(1);
  }

  function limpiarFiltros() {
    setDesde(primerDiaMes.toISOString().slice(0, 10));
    setHasta(today.toISOString().slice(0, 10));
    setTurno("");
    setPlantaId("");
    setCategoriaId("");
    setProducto("");
    setModo("valor");
    setPage(1);
  }

  onMount(actualizarFiltros);

  return (
    <div class="p-6 space-y-8">
      <h1 class="text-2xl font-bold mb-4">Resumen de Producción Diaria 📈</h1>

      <FiltrosProduccion
        desde={desde()|| new Date().toISOString().slice(0, 10)}
        hasta={hasta()|| new Date().toISOString().slice(0, 10)}
        turno={turno()}
        plantaId={plantaId()}
        categoriaId={categoriaId()}
        producto={producto()}
        plantas={plantas() || []}
        categorias={categorias() || []}
        setDesde={v => { setDesde(v); actualizarFiltros(); }}
        setHasta={v => { setHasta(v); actualizarFiltros(); }}
        setTurno={v => { setTurno(v); actualizarFiltros(); }}
        setPlantaId={v => { setPlantaId(v); actualizarFiltros(); }}
        setCategoriaId={v => { setCategoriaId(v); actualizarFiltros(); }}
        setProducto={v => { setProducto(v); actualizarFiltros() }}
        modo={modo()}
        setModo={v => { setModo(v as "cantidad" | "valor"); actualizarFiltros(); }}
        limpiarFiltros={limpiarFiltros}
      />

      <div class="bg-gray-100 p-4 rounded shadow-md">
        <p><b>Total Cantidad:</b> {Number(resumenGeneral()?.totalCantidad || 0).toLocaleString()}</p>
        <p><b>Total Costo MP:</b> ${Number(resumenGeneral()?.totalCostoMP || 0).toLocaleString()}</p>
        <p><b>Total Precio de Venta:</b> ${Number(resumenGeneral()?.totalValor || 0).toLocaleString()}</p>
      </div>

      <Show when={!resumenPlanta.loading && !resumenCategoria.loading && !resumenTurno.loading}>
      <For each={[modo()]}>
          {m => (
            <GraficosProduccion
              resumenPlanta={resumenPlanta()!}
              resumenCategoria={resumenCategoria()!}
              resumenTurno={resumenTurno()!}
              resumenEvolucion={resumenEvolucion()!}
              filtros={{
                plantaId: plantaId(),
                categoriaId: categoriaId(),
                turno: turno(),
                producto: producto(),
              }}
              rolUsuarioId={rolUsuarioId}
              modo={m}
            />
          )}
        </For>
      </Show>

      <Show when={resumen()}>
        <TablaProduccion
          items={resumen()!.items}
          rolUsuarioId={rolUsuarioId}
          modo={modo()}
        />
        <div class="flex justify-center items-center gap-4 mt-4">
          <button
            disabled={page() <= 1}
            onClick={() => setPage(page() - 1)}
            class="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Anterior
          </button>
          <span>Página {page()} de {resumen()!.totalPages}</span>
          <button
            disabled={page() >= resumen()!.totalPages}
            onClick={() => setPage(page() + 1)}
            class="px-4 py-2 bg-gray-300 rounded disabled:opacity-50"
          >
            Siguiente
          </button>
        </div>
      </Show>
    </div>
  );
}
