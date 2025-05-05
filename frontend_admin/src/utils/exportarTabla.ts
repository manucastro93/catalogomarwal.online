import * as XLSX from 'xlsx-js-style';

interface Columna {
  label: string; // Nombre que aparece en el Excel
  key: string;   // Clave del objeto
}

export function exportarTablaAExcel(
  datos: any[],
  columnas: Columna[],
  nombreArchivo: string
) {
  if (!datos?.length || !columnas?.length) return;

  const hojaDatos = datos.map((item) => {
    const fila: Record<string, any> = {};
    columnas.forEach((col) => {
      fila[col.label] = item[col.key] ?? '';
    });
    return fila;
  });

  const ws = XLSX.utils.json_to_sheet(hojaDatos, { header: columnas.map(c => c.label) });
  const range = XLSX.utils.decode_range(ws['!ref']!);

  // Estilos por celda
  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (!cell) continue;

      const isHeader = R === 0;

      cell.s = {
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
        font: {
          bold: isHeader,
        },
        alignment: {
          horizontal: 'center',
          vertical: 'center',
        },
        fill: isHeader
          ? {
              patternType: 'solid',
              fgColor: { rgb: 'F3F4F6' },
            }
          : undefined,
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hoja 1');
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
}
