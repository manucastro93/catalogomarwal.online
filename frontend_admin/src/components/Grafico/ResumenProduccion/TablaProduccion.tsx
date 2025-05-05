import * as XLSX from 'xlsx';
import { ResumenProduccion } from "@/types/grafico";
import { ROLES_USUARIOS } from "@/constants/rolesUsuarios";

interface Props {
  items: ResumenProduccion[];
  rolUsuarioId: number;
  modo: string;
}

export default function TablaProduccion(props: Props) {

  function exportarExcel() {
    const tabla = document.querySelector("#tabla-produccion") as HTMLTableElement;
    if (!tabla) return;
  
    const ws = XLSX.utils.table_to_sheet(tabla);
    const range = XLSX.utils.decode_range(ws['!ref'] || '');
  
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (!cell) continue;
  
        cell.s = {
          border: {
            top:    { style: "thin", color: { rgb: "000000" } },
            bottom: { style: "thin", color: { rgb: "000000" } },
            left:   { style: "thin", color: { rgb: "000000" } },
            right:  { style: "thin", color: { rgb: "000000" } },
          },
          font: {
            bold: R === 0,
          },
          alignment: {
            horizontal: "center",
            vertical: "center",
          },
          fill: R === 0
            ? {
                patternType: "solid",
                fgColor: { rgb: "F3F4F6" }, // gris claro
              }
            : undefined,
        };
      }
    }
  
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Producción");
    XLSX.writeFile(wb, "Reporte_Produccion.xlsx");
  }
  

  return (
    <>
      <div class="flex justify-end">
        <button
          onClick={exportarExcel}
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Exportar a Excel
        </button>
      </div>

      <div class="overflow-x-auto mt-5">
        <table id="tabla-produccion" class="w-full table-auto border border-collapse text-sm">
          <thead class="bg-gray-100">
            <tr>
              <th class="border p-2">Fecha</th>
              <th class="border p-2">Planta</th>
              <th class="border p-2">Categoría</th>
              <th class="border p-2">SKU</th>
              <th class="border p-2">Producto</th>
              <th class="border p-2">Turno</th>
              <th class="border p-2">Cantidad</th>
              {props.rolUsuarioId !== ROLES_USUARIOS.OPERARIO && (
                <>
                  <th class="border p-2">Costo MP</th>
                  <th class="border p-2">Valor Total</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {props.items.map((item) => (
              <tr class="text-center hover:bg-gray-50">
                <td class="border p-2">{item.fecha}</td>
                <td class="border p-2">{item.planta}</td>
                <td class="border p-2">{item.categoria}</td>
                <td class="border p-2">{item.producto?.sku || "Sin SKU"}</td>
                <td class="border p-2">{item.producto?.nombre || "Sin Producto"}</td>
                <td class="border p-2">{item.turno}</td>
                <td class="border p-2">{item.cantidad}</td>
                {props.rolUsuarioId !== ROLES_USUARIOS.OPERARIO && (
                  <>
                    <td class="border p-2">${Number(item.totalCostoMP || 0).toLocaleString()}</td>
                    <td class="border p-2">${Number(item.totalValor || 0).toLocaleString()}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
