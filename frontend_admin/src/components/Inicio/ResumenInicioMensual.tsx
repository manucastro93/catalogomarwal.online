import { For, Show, createSignal, createMemo, splitProps } from "solid-js";
import { formatearPrecio, formatearMiles } from "@/utils/formato";
import type { ResumenEstadisticas } from "@/types/estadistica";
import { ROLES_USUARIOS } from "@/constants/rolesUsuarios";
import { useAuth } from "@/store/auth";

// --------------------------
// Pequeños UI helpers (sin libs externas)
// --------------------------
function Card(props: { class?: string; children: any }) {
  return (
    <div class={`bg-white rounded-2xl shadow-sm border border-gray-100 ${props.class ?? ""}`}>
      {props.children}
    </div>
  );
}

function CardHeader(props: { title: string; subtitle?: string; right?: any; onToggle?: () => void; open?: boolean }) {
  return (
    <button type="button" onClick={props.onToggle} class="w-full text-left cursor-pointer">
      <div class="flex items-start justify-between gap-3 p-4 border-b border-gray-100">
        <div class="min-w-0 flex items-center gap-2">
          <svg class={`h-4 w-4 shrink-0 transition-transform ${props.open ? "rotate-90" : "rotate-0"}`} viewBox="0 0 20 20" fill="currentColor"><path d="M7 5l6 5-6 5V5z"/></svg>
          <div class="min-w-0">
            <h3 class="text-sm font-semibold text-gray-800 tracking-wide">{props.title}</h3>
            <Show when={props.subtitle}>
              <p class="text-xs text-gray-500 mt-0.5 line-clamp-1">{props.subtitle}</p>
            </Show>
          </div>
        </div>
        <Show when={props.right}>
          <div class="shrink-0" onClick={(e) => e.stopPropagation()}>{props.right}</div>
        </Show>
      </div>
    </button>
  );
}

function Stat(props: { label: string; value: string | number; helper?: string }) {
  return (
    <div class="p-4">
      <p class="text-[11px] uppercase tracking-wider text-gray-500 font-medium">{props.label}</p>
      <div class="mt-1 flex items-baseline gap-2">
        <span class="text-3xl font-bold text-gray-900 tabular-nums">{props.value}</span>
        <Show when={props.helper}>
          <span class="text-xs text-gray-500">{props.helper}</span>
        </Show>
      </div>
    </div>
  );
}

function Segmented<T extends string>(allProps: {
  value: T;
  onChange: (v: T) => void;
  options: { label: string; value: T }[];
  class?: string;
}) {
  const [props] = splitProps(allProps, ["value", "onChange", "options", "class"]);
  return (
    <div class={`inline-flex rounded-full bg-gray-100 p-1 text-xs ${props.class ?? ""}`} role="tablist">
      <For each={props.options}>
        {(opt) => (
          <button
            role="tab"
            class={`px-2.5 py-1 rounded-full transition-all whitespace-nowrap
              ${props.value === opt.value ? "bg-white shadow-sm text-gray-900" : "text-gray-600 hover:text-gray-900"}`}
            onClick={() => props.onChange(opt.value)}
          >
            {opt.label}
          </button>
        )}
      </For>
    </div>
  );
}

function Tooltip(props: { text: string; children: any }) {
  return (
    <div class="relative group">
      {props.children}
      <div class="pointer-events-none absolute z-20 left-1/2 -translate-x-1/2 -top-2 -translate-y-full px-2 py-1 rounded bg-gray-900 text-white text-[11px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow">
        {props.text}
      </div>
    </div>
  );
}

function RankRow(props: {
  name: string;
  right: string;
  pct: number; // 0..1 respecto al TOTAL
  sub?: string;
  tooltip: string;
}) {
  const widthPct = () => Math.max(6, Math.min(100, Math.round((props.pct || 0) * 100)));
  return (
    <li class="py-2 first:pt-0 last:pb-0">
      <Tooltip text={props.tooltip}>
        <div class="flex items-center gap-3">
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm text-gray-800 truncate">{props.name}</p>
              <span class="text-sm font-semibold text-gray-900 tabular-nums">{props.right}</span>
            </div>
            <Show when={props.sub}>
              <p class="text-[11px] text-gray-500 mt-0.5 truncate">{props.sub}</p>
            </Show>
            <div class="mt-2 h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-indigo-500 to-blue-500" style={{ width: `${widthPct()}%` }} />
            </div>
          </div>
        </div>
      </Tooltip>
    </li>
  );
}

// --------------------------
// Componente principal
// --------------------------

type Modo = "cantidad" | "monto";

export default function ResumenInicioMensual(props: { resumen?: ResumenEstadisticas }) {
  const { usuario } = useAuth();
  // ⚠️ NO desestructurar: mantener reactividad
  const resumen = () => props.resumen;

  // selects por tarjeta
  const [modoProductos, setModoProductos] = createSignal<Modo>("cantidad");
  const [modoCategorias, setModoCategorias] = createSignal<Modo>("cantidad");
  const [modoVendedores, setModoVendedores] = createSignal<Modo>("monto");
  const [modoClientes, setModoClientes] = createSignal<Modo>("monto");

  // estado de colapso por card (inician colapsadas)
  const [openKPI, setOpenKPI] = createSignal(false);
  const [openProd, setOpenProd] = createSignal(false);
  const [openCat, setOpenCat] = createSignal(false);
  const [openVend, setOpenVend] = createSignal(false);
  const [openCli, setOpenCli] = createSignal(false);

  // helpers de listas según modo
  const topProductos = createMemo(() =>
    modoProductos() === "cantidad"
      ? resumen()?.rankings?.productos?.dux?.porCantidad ?? []
      : resumen()?.rankings?.productos?.dux?.porMonto ?? []
  );

  const topCategorias = createMemo(() =>
    modoCategorias() === "cantidad"
      ? resumen()?.rankings?.categorias?.dux?.porCantidad ?? []
      : resumen()?.rankings?.categorias?.dux?.porMonto ?? []
  );

  const topVendedores = createMemo(() =>
    modoVendedores() === "cantidad"
      ? resumen()?.rankings?.vendedores?.dux?.porCantidad ?? []
      : resumen()?.rankings?.vendedores?.dux?.porMonto ?? []
  );

  const topClientes = createMemo(() =>
    modoClientes() === "cantidad"
      ? resumen()?.rankings?.clientes?.dux?.porCantidad ?? []
      : resumen()?.rankings?.clientes?.dux?.porMonto ?? []
  );

  // --------- TOTALES GLOBALES ----------
  const totalPedidosMes = createMemo(() => resumen()!.totalPedidos ?? 0);
  const totalFacturadoMes = createMemo(() => resumen()!.totalFacturado ?? 0);

  // total global de unidades (si existe en tu resumen)
  const totalUnidadesMes = createMemo(() => {
    const r: any = resumen();
    const posibles = [
      r?.totalUnidades,
      r?.totalUnidadesVendidas,
      r?.totalItemsVendidos,
      r?.totales?.unidades,
      r?.totales?.totalUnidades,
    ].map((v: any) => (typeof v === "number" && isFinite(v) ? v : 0));
    const max = Math.max(...posibles, 0);
    if (max > 0) return max;
    // Fallback: suma del TOP visible
    const list = topProductos();
    return list?.reduce((acc: number, p: any) => acc + (p.cantidadVendida ?? 0), 0) ?? 0;
  });

  // Totales por card según modo (evitar /0)
  const totalProd = createMemo(() =>
    modoProductos() === "cantidad" ? (totalUnidadesMes() || 1) : (totalFacturadoMes() || 1)
  );
  const totalCat = createMemo(() =>
    modoCategorias() === "cantidad" ? (totalUnidadesMes() || 1) : (totalFacturadoMes() || 1)
  );
  const totalVend = createMemo(() =>
    modoVendedores() === "cantidad" ? (totalPedidosMes() || 1) : (totalFacturadoMes() || 1)
  );
  const totalCli = createMemo(() =>
    modoClientes() === "cantidad" ? (totalPedidosMes() || 1) : (totalFacturadoMes() || 1)
  );

  // helpers tooltip
  const pctText = (p: number) => `${(p * 100).toFixed(1)}%`;
  const fmtBase = (modo: Modo, base: number) => (modo === "monto" ? formatearPrecio(base) : formatearMiles(base));

  // --------- UI ----------
  return (
    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* KPI principal */}
      <Card class="lg:col-span-4 relative overflow-hidden">
        {/* No bloquear clicks en el adorno */}
        <div class="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-r from-indigo-400/10 to-blue-400/10 blur-2xl z-0" />
        <div class="relative z-10">
          <CardHeader
            title="Pedidos del mes"
            subtitle="Resumen"
            onToggle={() => setOpenKPI(!openKPI())}
            open={openKPI()}
          />
          <Show when={openKPI()}>
            <Stat
              label="Total pedidos"
              value={resumen()!.totalPedidos ?? "..."}
              helper={`${formatearPrecio(resumen()!.totalFacturado ?? 0)} facturado`}
            />
          </Show>
        </div>
      </Card>

      {/* Productos */}
      <Card class="lg:col-span-4">
        <CardHeader
          title={`Top 5 Productos`}
          subtitle={modoProductos() === "cantidad" ? "Ordenado por unidades" : "Ordenado por monto"}
          onToggle={() => setOpenProd(!openProd())}
          open={openProd()}
          right={
            <Segmented
              value={modoProductos()}
              onChange={(v) => setModoProductos(v)}
              options={[
                { label: "Cantidad", value: "cantidad" },
                { label: "Monto", value: "monto" },
              ]}
            />
          }
        />
        <Show when={openProd()}>
          <div class="p-4">
            <ul>
              <For each={topProductos()}>
                {(prod: any) => {
                  const qty = prod.cantidadVendida ?? 0;
                  const monto = prod.totalFacturado ?? 0;
                  const base = totalProd();
                  const val = modoProductos() === "cantidad" ? qty : monto;
                  const pct = base ? val / base : 0;
                  const tooltip =
                    modoProductos() === "cantidad"
                      ? `${pctText(pct)} del total (${formatearMiles(qty)} un de ${fmtBase("cantidad", base)} un)`
                      : `${pctText(pct)} del total (${formatearPrecio(monto)} de ${fmtBase("monto", base)})`;
                  return (
                    <RankRow
                      name={prod.Producto?.nombre ?? "—"}
                      right={modoProductos() === "cantidad" ? `${formatearMiles(qty)} un` : formatearPrecio(monto)}
                      sub={modoProductos() === "cantidad" ? formatearPrecio(monto) : `${formatearMiles(qty)} unidades`}
                      pct={pct}
                      tooltip={tooltip}
                    />
                  );
                }}
              </For>
            </ul>
          </div>
        </Show>
      </Card>

      {/* Categorías */}
      <Card class="lg:col-span-4">
        <CardHeader
          title="Top 5 Categorías"
          subtitle={modoCategorias() === "cantidad" ? "Ordenado por unidades" : "Ordenado por monto"}
          onToggle={() => setOpenCat(!openCat())}
          open={openCat()}
          right={
            <Segmented
              value={modoCategorias()}
              onChange={(v) => setModoCategorias(v)}
              options={[
                { label: "Cantidad", value: "cantidad" },
                { label: "Monto", value: "monto" },
              ]}
            />
          }
        />
        <Show when={openCat()}>
          <div class="p-4">
            <ul>
              <For each={topCategorias()}>
                {(cat: any) => {
                  const qty = cat.totalVendidas ?? 0;
                  const monto = cat.totalFacturado ?? 0;
                  const base = totalCat();
                  const val = modoCategorias() === "cantidad" ? qty : monto;
                  const pct = base ? val / base : 0;
                  const tooltip =
                    modoCategorias() === "cantidad"
                      ? `${pctText(pct)} del total (${formatearMiles(qty)} un de ${fmtBase("cantidad", base)} un)`
                      : `${pctText(pct)} del total (${formatearPrecio(monto)} de ${fmtBase("monto", base)})`;
                  return (
                    <RankRow
                      name={cat.nombre ?? "—"}
                      right={modoCategorias() === "cantidad" ? `${formatearMiles(qty)} un` : formatearPrecio(monto)}
                      sub={modoCategorias() === "cantidad" ? formatearPrecio(monto) : `${formatearMiles(qty)} unidades`}
                      pct={pct}
                      tooltip={tooltip}
                    />
                  );
                }}
              </For>
            </ul>
          </div>
        </Show>
      </Card>

      {/* Vendedores (solo SUPREMO) */}
      <Show when={usuario()?.rolUsuarioId === ROLES_USUARIOS.SUPREMO}>
        <Card class="lg:col-span-6">
          <CardHeader
            title="Top 5 Vendedores"
            subtitle={modoVendedores() === "cantidad" ? "Ordenado por pedidos" : "Ordenado por facturado"}
            onToggle={() => setOpenVend(!openVend())}
            open={openVend()}
            right={
              <Segmented
                value={modoVendedores()}
                onChange={(v) => setModoVendedores(v)}
                options={[
                  { label: "Cantidad", value: "cantidad" },
                  { label: "Monto", value: "monto" },
                ]}
              />
            }
          />
          <Show when={openVend()}>
            <div class="p-4">
              <ul>
                <For each={topVendedores()}>
                  {(vend: any) => {
                    const pedidos = vend.totalPedidos ?? 0;
                    const monto = vend.totalFacturado ?? 0;
                    const base = totalVend();
                    const val = modoVendedores() === "cantidad" ? pedidos : monto;
                    const pct = base ? val / base : 0;
                    const tooltip =
                      modoVendedores() === "cantidad"
                        ? `${pctText(pct)} del total (${pedidos} ped de ${fmtBase("cantidad", base)} ped)`
                        : `${pctText(pct)} del total (${formatearPrecio(monto)} de ${fmtBase("monto", base)})`;
                    return (
                      <RankRow
                        name={vend.usuario?.nombre ?? "—"}
                        right={modoVendedores() === "cantidad" ? `${pedidos} ped` : formatearPrecio(monto)}
                        sub={modoVendedores() === "cantidad" ? formatearPrecio(monto) : `${pedidos} pedidos`}
                        pct={pct}
                        tooltip={tooltip}
                      />
                    );
                  }}
                </For>
              </ul>
            </div>
          </Show>
        </Card>
      </Show>

      {/* Clientes */}
      <Card class="lg:col-span-6">
        <CardHeader
          title="Top 5 Clientes del mes"
          subtitle={modoClientes() === "cantidad" ? "Ordenado por pedidos" : "Ordenado por gasto"}
          onToggle={() => setOpenCli(!openCli())}
          open={openCli()}
          right={
            <Segmented
              value={modoClientes()}
              onChange={(v) => setModoClientes(v)}
              options={[
                { label: "Cantidad", value: "cantidad" },
                { label: "Monto", value: "monto" },
              ]}
            />
          }
        />
        <Show when={openCli()}>
          <div class="p-4">
            <ul>
              <For each={topClientes()}>
                {(cli: any) => {
                  const pedidos = cli.cantidadPedidos ?? 0;
                  const monto = cli.totalGastado ?? 0;
                  const base = totalCli();
                  const val = modoClientes() === "cantidad" ? pedidos : monto;
                  const pct = base ? val / base : 0;
                  const tooltip =
                    modoClientes() === "cantidad"
                      ? `${pctText(pct)} del total (${pedidos} ped de ${fmtBase("cantidad", base)} ped)`
                      : `${pctText(pct)} del total (${formatearPrecio(monto)} de ${fmtBase("monto", base)})`;
                  return (
                    <RankRow
                      name={cli.cliente?.nombre ?? "—"}
                      right={modoClientes() === "cantidad" ? `${pedidos} ped` : formatearPrecio(monto)}
                      sub={modoClientes() === "cantidad" ? formatearPrecio(monto) : `${pedidos} pedidos`}
                      pct={pct}
                      tooltip={tooltip}
                    />
                  );
                }}
              </For>
            </ul>
          </div>
        </Show>
      </Card>
    </div>
  );
}
