import * as XLSX from 'xlsx-js-style';

interface Columna { label: string; key: string; }

export function exportarDatosAExcel(
  datos: any[],
  columnas: Columna[],
  nombreArchivo: string,
  rangoFechas?: string
) {
  if (!datos?.length || !columnas?.length) return;

  // 1) Generar array de objetos
  const hoja = datos.map((item) => {
    const fila: Record<string, any> = {};
    columnas.forEach(({ label, key }) => {
      const valor = key.split('.').reduce((acc, parte) => acc?.[parte], item);
      fila[label] = key === 'createdAt'
        ? new Date(valor).toLocaleString()
        : valor ?? '—';
    });
    return fila;
  });

  // 2) Crear worksheet base
  const ws = XLSX.utils.json_to_sheet(hoja);

  // 3) Si quiero rango de fechas, desplazo TODO dos filas abajo
  if (rangoFechas) {
    const original = { ...ws };

    // Borrar celdas actuales
    Object.keys(ws)
      .filter((k) => !k.startsWith('!'))
      .forEach((k) => delete (ws as any)[k]);

    // Decode rango del original
    const range = XLSX.utils.decode_range(original['!ref']!);

    // Copiar cada celda 2 filas hacia abajo
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const oldAddr = XLSX.utils.encode_cell({ r: R, c: C });
        const newAddr = XLSX.utils.encode_cell({ r: R + 2, c: C });
        if (original[oldAddr]) ws[newAddr] = original[oldAddr];
      }
    }

    // Actualizar !ref
    range.e.r += 2;
    ws['!ref'] = XLSX.utils.encode_range(range);

    // Insertar rango de fechas en A1 y merge
    ws['A1'] = {
      t: 's',
      v: `Rango de fechas: ${rangoFechas}`,
      s: {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: 'center', vertical: 'center' },
      },
    };
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: columnas.length - 1 } },
    ];
  }

  // 4) Aplicar estilo (bordes, headers, etc.)
  const finalRange = XLSX.utils.decode_range(ws['!ref']!);
  for (let R = finalRange.s.r; R <= finalRange.e.r; ++R) {
    for (let C = finalRange.s.c; C <= finalRange.e.c; ++C) {
      const addr = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = ws[addr];
      if (!cell) continue;
      const esEncabezadoFecha = rangoFechas && R === 0;
      const esHeader = R === (rangoFechas ? 2 : 0);
      cell.s = {
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
        font: { bold: esHeader || esEncabezadoFecha },
        alignment: { horizontal: 'center', vertical: 'center' },
        fill: esHeader
          ? { patternType: 'solid', fgColor: { rgb: 'F3F4F6' } }
          : undefined,
      };
    }
  }

  // 5) Generar y descargar workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Hoja 1');
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
}
