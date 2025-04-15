import * as XLSX from 'xlsx';
import fs from 'fs';

export const leerExcelProductos = (ruta) => {
  const buffer = fs.readFileSync(ruta);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const hoja = workbook.Sheets[workbook.SheetNames[0]];
  const json = XLSX.utils.sheet_to_json(hoja, { header: 1 });

  const headers = json[0];
  const filas = json.slice(1).map((fila) => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = fila[i];
    });
    return obj;
  });

  return filas;
};
