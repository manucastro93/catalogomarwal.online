import { createSignal, For, onMount } from "solid-js";
import flatpickr from "flatpickr";
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
  let inputDesde: HTMLInputElement | undefined;
  let inputHasta: HTMLInputElement | undefined;

  onMount(() => {
    flatpickr(inputDesde!, {
      dateFormat: "d/m/Y",
      defaultDate: desde ? new Date(desde) : undefined,
      onChange: ([date]) => {
        if (date) {
          const iso = date.toISOString().split("T")[0];
          inputDesde!.value = date.toLocaleDateString("es-AR");
          setDesde(iso);
          setPagina(1);
        }
      },
    });

    flatpickr(inputHasta!, {
      dateFormat: "d/m/Y",
      defaultDate: hasta ? new Date(hasta) : undefined,
      onChange: ([date]) => {
        if (date) {
          const iso = date.toISOString().split("T")[0];
          inputHasta!.value = date.toLocaleDateString("es-AR");
          setHasta(iso);
          setPagina(1);
        }
      },
    });

    // Inicializar visiblemente en el input
    if (desde) inputDesde!.value = new Date(desde).toLocaleDateString("es-AR");
    if (hasta) inputHasta!.value = new Date(hasta).toLocaleDateString("es-AR");
  });

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6 text-base">
      <label class="relative w-full">
        <input
          ref={inputDesde}
          type="text"
          placeholder="Desde"
          class="w-full border rounded px-3 py-2 h-10 appearance-none"
          readonly
        />
      </label>

      <label class="relative w-full">
        <input
          ref={inputHasta}
          type="text"
          placeholder="Hasta"
          class="w-full border rounded px-3 py-2 h-10 appearance-none"
          readonly
        />
      </label>

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
          {(p) => <option value={p.id.toString()}>{p.nombre}</option>}
        </For>
      </select>
    </div>
  );
}
