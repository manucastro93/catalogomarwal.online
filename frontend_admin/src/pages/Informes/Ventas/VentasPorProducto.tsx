// src/pages/Estadisticas/VentasPorProducto.tsx
import { createSignal, createResource, createMemo, Show } from "solid-js";
import { listarVentasPorProducto, obtenerVentasPorProductoResumen } from "@/services/estadisticas.service";
import { obtenerCategorias } from "@/services/categoria.service";
import { obtenerPersonalDux } from "@/services/personalDux.service";
import FiltrosVentasProducto from "@/components/InformeVentaPorProducto/FiltrosVentasProducto";
import TablaVentasProducto from "@/components/InformeVentaPorProducto/TablaVentasProducto";
import ResumenEjecutivoVentas from "@/components/InformeVentaPorProducto/ResumenEjecutivoVentas";
import Loader from "@/components/Layout/Loader";
import Segmented from "@/components/UI/Segmented";

export default function VentasPorProducto() {
  const [q, setQ] = createSignal("");
  const [categoriaId, setCategoriaId] = createSignal<number | undefined>(undefined);
  const [vendedor, setVendedor] = createSignal<string | undefined>(undefined);
  const [modo, setModo] = createSignal<"cantidad" | "monto">("cantidad");
  const [pagina, setPagina] = createSignal(1);
  const [orden, setOrden] = createSignal("monto_12m");
  const [direccion, setDireccion] = createSignal<"ASC" | "DESC">("DESC");
  const [limit] = createSignal(20);

  const [categorias] = createResource(obtenerCategorias);
  const [vendedores] = createResource(obtenerPersonalDux);

  const fetchParams = createMemo(() => ({
    q: q(),
    categoriaId: categoriaId(),
    vendedor: vendedor(),
    page: pagina(),
    limit: limit(),
    orderBy: orden(),
    orderDir: direccion(),
  }));

  const [tabla] = createResource(fetchParams, listarVentasPorProducto);
  const [resumen] = createResource(
    () => ({ q: q(), categoriaId: categoriaId(), vendedor: vendedor() }),
    obtenerVentasPorProductoResumen
  );

  const cambiarOrden = (col: string) => {
    if (orden() === col) setDireccion(direccion() === "ASC" ? "DESC" : "ASC");
    else { setOrden(col); setDireccion("ASC"); }
  };

  const paginaActual = () => Number(tabla()?.pagina || 1);
  const totalPaginas = () => Number(tabla()?.totalPaginas || 1);

  return (
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Informes de ventas por producto</h1>
      <FiltrosVentasProducto
        q={q()}
        onQ={(v) => { setQ(v); setPagina(1); }}
        categoriaId={categoriaId()}
        onCategoria={(id) => { setCategoriaId(id); setPagina(1); }}
        vendedor={vendedor()}
        onVendedor={(v) => { setVendedor(v); setPagina(1); }}
        categorias={categorias() ?? []}
        vendedores={vendedores() ?? []}
      />

      <Show when={!resumen.loading} fallback={<Loader />}>
        <ResumenEjecutivoVentas data={resumen()} />
      </Show>

      <Show when={!tabla.loading} fallback={<Loader />}>
        <Segmented value={modo()} onChange={setModo} />
        <TablaVentasProducto
          rows={tabla()?.data ?? []}
          orden={orden()}
          direccion={direccion()}
          onOrdenar={cambiarOrden}
          modo={modo()}
        />
      </Show>

      {/* Paginación */}
      <div class="flex justify-center items-center gap-2 mt-6">
        <button
          onClick={() => setPagina((p) => Math.max(1, p - 1))}
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() === 1}
        >
          ◀
        </button>

        <span class="text-sm">
          Página {paginaActual()} de {totalPaginas()}
        </span>

        <button
          onClick={() => setPagina((p) => Math.min(totalPaginas(), p + 1))}
          class="px-3 py-1 border rounded disabled:opacity-50"
          disabled={pagina() >= totalPaginas()}
        >
          ▶
        </button>
      </div>
    </div>
  );
}
