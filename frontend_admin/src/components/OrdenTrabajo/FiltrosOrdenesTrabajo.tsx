import { For, Show } from "solid-js";
import InputFecha from "@/components/Layout/InputFecha";
import type { Planta } from "@/types/planta";

interface Props {
  desde: string;
  hasta: string;
  turno: string;
  plantaId: string;
  setDesde: (v: string) => void;
  setHasta: (v: string) => void;
  setTurno: (v: string) => void;
  setPlantaId: (v: string) => void;
  plantas: () => Planta[] | undefined;
  setPagina: (v: number) => void;
}

export default function FiltrosOrdenesTrabajo({
  desde,
  hasta,
  turno,
  plantaId,
  setDesde,
  setHasta,
  setTurno,
  setPlantaId,
  plantas,
  setPagina,
}: Props) {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6 items-center text-base w-full">
      <InputFecha
        valor={desde}
        onChange={(v) => {
          setDesde(v);
          setPagina(1);
        }}
        placeholder="Desde"
      />

      <InputFecha
        valor={hasta}
        onChange={(v) => {
          setHasta(v);
          setPagina(1);
        }}
        placeholder="Hasta"
      />

      <select
        value={turno}
        onChange={(e) => {
          setTurno(e.currentTarget.value);
          setPagina(1);
        }}
        class="border rounded px-3 py-2 h-10 w-full"
      >
        <option value="">Turno</option>
        <option value="mañana">Mañana</option>
        <option value="tarde">Tarde</option>
        <option value="noche">Noche</option>
      </select>

      <select
        value={plantaId}
        onChange={(e) => {
          setPlantaId(e.currentTarget.value);
          setPagina(1);
        }}
        class="border rounded px-3 py-2 h-10 w-full"
      >
        <option value="">Planta</option>
        <Show when={plantas()}>
      <For each={plantas()}>
        {(p) => <option value={p.id}>{p.nombre}</option>}
      </For>
    </Show>
      </select>
    </div>
  );
}
