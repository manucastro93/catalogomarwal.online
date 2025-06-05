import {
  CategoriaFillRate,
  CategoriaLeadTime,
  ProductoFillRate,
  ProductoLeadTime,
  ClienteFillRate,
  ClienteLeadTime,
} from "./Graficos";
import type {
  EficienciaCategoria,
  EficienciaProducto,
  EficienciaCliente,
  EficienciaMensual,
} from "@/types/eficiencia";

type ModoEficiencia = "categoria" | "producto" | "cliente";

interface Props {
  datosCategorias: EficienciaCategoria[];
  datosProductos: EficienciaProducto[];
  datosClientes: EficienciaCliente[];
  datosMensual: EficienciaMensual[];
  filtros: {
    categoriaId: string;
    producto: string;
    cliente: string;
  };
  evolucionEficiencia: { fecha: string; leadTime: number }[];
  evolucionFillRate: { fecha: string; fillRate: number }[];
  modo: ModoEficiencia;
}

export default function GraficosEficiencia(props: Props) {
  return (
    <div class="w-full grid grid-cols-1 gap-6">

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
      {props.modo === "cliente" && props.datosMensual?.length > 0 && (
        <>
          <div class="min-h-[320px]">
            <ClienteFillRate datos={props.datosMensual} />
          </div>
          <div class="min-h-[320px]">
            <ClienteLeadTime datos={props.datosMensual} />
          </div>
        </>
      )}
    </div>
  );
}
