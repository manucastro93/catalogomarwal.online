import { createSignal, onMount } from "solid-js";
import flatpickr from "flatpickr";
import { Spanish } from "flatpickr/dist/l10n/es";
import "flatpickr/dist/flatpickr.min.css";

interface Props {
  desde: string;
  hasta: string;
  turno: string;
  plantaId: string;
  setDesde: (v: string) => void;
  setHasta: (v: string) => void;
  setTurno: (v: string) => void;
  setPlantaId: (v: string) => void;
  plantas: { id: number; nombre: string }[];
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
  let inputDesde: HTMLInputElement;
  let inputHasta: HTMLInputElement;

  onMount(() => {
    flatpickr.localize(Spanish);

    flatpickr(inputDesde, {
      dateFormat: "d/m/Y",
      defaultDate: desde ? new Date(desde) : undefined,
      onChange: ([date]) => {
        if (date) {
          const iso = date.toISOString().split("T")[0];
          inputDesde.value = date.toLocaleDateString("es-AR");
          setDesde(iso);
          setPagina(1);
        }
      },
    });

    flatpickr(inputHasta, {
      dateFormat: "d/m/Y",
      defaultDate: hasta ? new Date(hasta) : undefined,
      onChange: ([date]) => {
        if (date) {
          const iso = date.toISOString().split("T")[0];
          inputHasta.value = date.toLocaleDateString("es-AR");
          setHasta(iso);
          setPagina(1);
        }
      },
    });

    if (desde) inputDesde.value = new Date(desde).toLocaleDateString("es-AR");
    if (hasta) inputHasta.value = new Date(hasta).toLocaleDateString("es-AR");
  });

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 md:flex gap-3 mb-6 items-center text-sm md:text-base">
      <input
        ref={el => (inputDesde = el)}
        type="text"
        placeholder="Desde"
        class="border rounded px-3 py-2 h-10 w-full"
        readonly
      />
      <input
        ref={el => (inputHasta = el)}
        type="text"
        placeholder="Hasta"
        class="border rounded px-3 py-2 h-10 w-full"
        readonly
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
        {plantas.map((p) => (
          <option value={p.id.toString()}>{p.nombre}</option>
        ))}
      </select>
    </div>
  );
}
