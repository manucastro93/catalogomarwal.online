import { For } from "solid-js";
import type { Planta } from "../../types/planta";

interface Props {
  desde: string;
  hasta: string;
  turno: string;
  plantaId: string;
  setDesde: (v: string) => void;
  setHasta: (v: string) => void;
  setTurno: (v: string) => void;
  setPlantaId: (v: string) => void;
  plantas: Planta[];
  setPagina: (v: number) => void;
}

export default function FiltrosProduccionDiaria({
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
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6 text-base">
      <input
        type="date"
        value={desde}
        onInput={(e) => {
          setDesde(e.currentTarget.value);
          setPagina(1);
        }}
        class="border rounded px-3 py-2 h-10 w-full"
      />
      <input
        type="date"
        value={hasta}
        onInput={(e) => {
          setHasta(e.currentTarget.value);
          setPagina(1);
        }}
        class="border rounded px-3 py-2 h-10 w-full"
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
        value={plantaId.toString()}
        onChange={(e) => {
          setPlantaId(e.currentTarget.value);
          setPagina(1);
        }}
        class="border rounded px-3 py-2 h-10 w-full"
      >
        <option value="">Planta</option>
        <For each={plantas}>
          {(p) => (
            <option value={p.id.toString()}>{p.nombre}</option>
          )}
        </For>
      </select>
    </div>
  );
}
