import {
  BarrasVendedor,
  BarrasCliente,
  TortaCategoriaVentas,
  LineasEvolucionVentas,
} from "./Graficos";
import { deberiaMostrarGraficoVentas } from "@/helpers/graficoHelperVentas";
import type { PuntoEstadistica, RankingEstadisticas } from "@/types/estadistica";

interface Props {
  desde: string;
  hasta: string;
  cliente: string;
  producto: string;
  categoriaId: string;
  modo: "cantidad" | "valor";
  ranking?: RankingEstadisticas;
  evolucion: PuntoEstadistica[];
}

export default function GraficosVentas(props: Props) {
  const {
    ranking,
    evolucion,
    modo,
    cliente,
    producto,
    categoriaId,
  } = props;

  if (!ranking) return null;

  const filtros = { cliente, producto, categoriaId };

  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {deberiaMostrarGraficoVentas("vendedor", filtros) && (
        <div class="min-h-[320px]">
          <BarrasVendedor datos={ranking.vendedores || []} modo={modo} />
        </div>
      )}
      {deberiaMostrarGraficoVentas("cliente", filtros) && (
        <div class="min-h-[320px]">
          <BarrasCliente datos={ranking.clientes || []} modo={modo} />
        </div>
      )}
      {deberiaMostrarGraficoVentas("categoria", filtros) && (
        <div class="min-h-[320px]">
          <TortaCategoriaVentas datos={ranking.categorias || []} modo={modo} />
        </div>
      )}
      {evolucion?.length > 0 && (
        <div class="min-h-[320px] md:col-span-2">
          <LineasEvolucionVentas datos={evolucion} modo={modo} />
        </div>
      )}
    </div>
  );
}
