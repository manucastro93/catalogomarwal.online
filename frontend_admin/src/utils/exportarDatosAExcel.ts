import * as XLSX from 'xlsx-js-style';

interface Columna {
  label: string;
  key: string;
}

export function exportarDatosAExcel(
  datos: any[],
  columnas: Columna[],
  nombreArchivo: string
) {
  if (!datos?.length || !columnas?.length) return;

  const hoja = datos.map((item) => {
    const fila: Record<string, any> = {};
    columnas.forEach(({ label, key }) => {
      const valor = key.split('.').reduce((acc, parte) => acc?.[parte], item);
      fila[label] =
        key === 'createdAt'
          ? new Date(valor).toLocaleString()
          : valor ?? '—';
    });
    return fila;
  });

  const ws = XLSX.utils.json_to_sheet(hoja);
  const range = XLSX.utils.decode_range(ws['!ref']!);

  for (let R = range.s.r; R <= range.e.r; ++R) {
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[cellAddress];
      if (!cell) continue;

      cell.s = {
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
        font: { bold: R === 0 },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: R === 0
          ? { patternType: 'solid', fgColor: { rgb: 'F3F4F6' } }
          : undefined,
      };
    }
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hoja 1');
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
}
