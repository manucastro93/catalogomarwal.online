import { Bar } from "solid-chartjs";
import type { ResumenProduccionPlanta } from "../../../../types/grafico";

interface Props {
  datos: ResumenProduccionPlanta[];
  modo: "cantidad" | "valor";
}

export default function BarrasPlanta({ datos, modo }: Props) {
  if (!datos.length) return null;

  const labels = datos.map(r => r.planta);
  const valores = datos.map(r => modo === "cantidad" ? r.totalCantidad : r.totalValor);
  //const key = modo + "_" + labels.join("|");
  //console.log("producto", datos[0].producto);
  return (
    <div class="w-full h-[400px] p-4 shadow rounded bg-white flex flex-col">
      <h2 class="text-xl font-semibold mb-4 text-center">Producción por Planta</h2>
      <Bar
        key={modo}
        data={{ labels, datasets: [{ label: modo === "cantidad" ? "Cantidad" : "Valor $", data: valores }] }}
        options={{ responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } } }}
      />
    </div>
  );
}
