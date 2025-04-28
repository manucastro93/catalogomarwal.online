import { Show } from "solid-js";
import {
  BarrasPlanta,
  TortaCategoria,
  BarrasTurno,
  LineasEvolucionProduccion
} from "./Graficos";
import { deberiaMostrarGrafico } from "../../../helpers/graficoHelper";
import type {
  ResumenProduccionPlanta,
  ResumenProduccionCategoria,
  ResumenProduccionTurno,
  EvolucionProduccion
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
      <Show when={deberiaMostrarGrafico("planta", props.filtros)}>
        <BarrasPlanta datos={props.resumenPlanta} modo={props.modo} />
      </Show>

      <Show when={deberiaMostrarGrafico("categoria", props.filtros)}>
        <TortaCategoria datos={props.resumenCategoria} modo={props.modo} />
      </Show>

      <Show when={deberiaMostrarGrafico("turno", props.filtros)}>
        <BarrasTurno datos={props.resumenTurno} modo={props.modo} />
      </Show>

      <Show when={props.resumenEvolucion?.length > 0}>
        <LineasEvolucionProduccion
          datos={props.resumenEvolucion}
          modo={props.modo}
        />
      </Show>
    </div>
  );
}
