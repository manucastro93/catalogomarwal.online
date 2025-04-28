import { Show } from "solid-js";
import {
  BarrasPlanta,
  TortaCategoria,
  BarrasTurno,
  LineasEvolucionProduccion,
} from "./Graficos";
import { deberiaMostrarGrafico } from "../../../helpers/graficoHelper";
import type {
  ResumenProduccionPlanta,
  ResumenProduccionCategoria,
  ResumenProduccionTurno,
  EvolucionProduccion,
} from "../../../types/grafico";

interface Props {
  resumenPlanta: ResumenProduccionPlanta[];
  resumenCategoria: ResumenProduccionCategoria[];
  resumenTurno: ResumenProduccionTurno[];
  resumenEvolucion: EvolucionProduccion[];
  filtros: {
    plantaId: string;
    categoriaId: string;
    turno: string;
    producto: string;
  };
  rolUsuarioId: number;
  modo: "cantidad" | "valor";
}

export default function GraficosProduccion(props: Props) {
  return (
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      {deberiaMostrarGrafico("planta", props.filtros) && (
        <div class="min-h-[320px]">
          <BarrasPlanta datos={props.resumenPlanta} modo={props.modo} />
        </div>
      )}
      {deberiaMostrarGrafico("categoria", props.filtros) && (
        <div class="min-h-[320px]">
          <TortaCategoria datos={props.resumenCategoria} modo={props.modo} />
        </div>
      )}
      {deberiaMostrarGrafico("turno", props.filtros) && (
        <div class="min-h-[320px]">
          <BarrasTurno datos={props.resumenTurno} modo={props.modo} />
        </div>
      )}
      {props.resumenEvolucion?.length > 0 && (
        <div class="min-h-[320px] md:col-span-2">
          <LineasEvolucionProduccion
            datos={props.resumenEvolucion}
            modo={props.modo}
          />
        </div>
      )}
    </div>
  );
}
