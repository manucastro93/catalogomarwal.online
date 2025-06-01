import {
  PedidoFillRate,
  PedidoLeadTime,
  CategoriaFillRate,
  CategoriaLeadTime,
  ProductoFillRate,
  ProductoLeadTime,
  ClienteFillRate,
  ClienteLeadTime,
} from "./Graficos";
import type {
  EficienciaPedido,
  EficienciaCategoria,
  EficienciaProducto,
  EficienciaCliente,
} from "@/types/eficiencia";

type ModoEficiencia = "pedido" | "categoria" | "producto" | "cliente";

interface Props {
  datosPedidos: EficienciaPedido[];
  datosCategorias: EficienciaCategoria[];
  datosProductos: EficienciaProducto[];
  datosClientes: EficienciaCliente[];
  filtros: {
    categoriaId: string;
    producto: string;
    nroPedido: string;
    cliente: string;
  };
  evolucionEficiencia: { fecha: string; leadTime: number }[];
  evolucionFillRate: { fecha: string; fillRate: number }[];
  modo: ModoEficiencia;
}

export default function GraficosEficiencia(props: Props) {
  return (
    <div class="w-full grid grid-cols-1 gap-6">
      {/* Pedido */}
      {props.modo === "pedido" && props.datosPedidos?.length > 0 && (
        <>
          <div class="min-h-[320px]">
            <PedidoFillRate datos={props.datosPedidos} />
          </div>
          <div class="min-h-[320px]">
            <PedidoLeadTime datos={props.datosPedidos} />
          </div>
        </>
      )}

      {/* Categoría */}
      {props.modo === "categoria" && props.datosCategorias?.length > 0 && (
        <>
          <div class="min-h-[320px]">
            <CategoriaFillRate datos={props.datosCategorias} />
          </div>
          <div class="min-h-[320px]">
            <CategoriaLeadTime datos={props.datosCategorias} />
          </div>
        </>
      )}

      {/* Producto */}
      {props.modo === "producto" && props.datosProductos?.length > 0 && (
        <>
          <div class="min-h-[320px]">
            <ProductoFillRate datos={props.datosProductos} />
          </div>
          <div class="min-h-[320px]">
            <ProductoLeadTime datos={props.datosProductos} />
          </div>
        </>
      )}

      {/* Cliente */}
      {props.modo === "cliente" && props.datosClientes?.length > 0 && (
        <>
          <div class="min-h-[320px]">
            <ClienteFillRate datos={props.datosClientes} />
          </div>
          <div class="min-h-[320px]">
            <ClienteLeadTime datos={props.datosClientes} />
          </div>
        </>
      )}
    </div>
  );
}
