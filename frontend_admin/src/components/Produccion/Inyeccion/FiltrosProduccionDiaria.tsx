import { For } from "solid-js";
import InputFecha from "@/components/Layout/InputFecha";

interface Props {
  desde: string;
  hasta: string;
  turno: string;
  setDesde: (v: string) => void;
  setHasta: (v: string) => void;
  setTurno: (v: string) => void;
  setPagina: (v: number) => void;
}

export default function FiltrosProduccionDiaria({
  desde,
  hasta,
  turno,
  setDesde,
  setHasta,
  setTurno,
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
    </div>
  );
}