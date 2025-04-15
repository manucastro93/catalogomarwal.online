import { createSignal, For, Show } from 'solid-js';
import * as XLSX from 'xlsx';

const HEADERS = [
  'sku',
  'nombre',
  'descripcion',
  'hayStock',
  'precioUnitario',
  'precioPorBulto',
  'unidadPorBulto',
  'categoriaId',
];

export default function ModalImportarExcel(props: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const [preview, setPreview] = createSignal<any[][]>([]);
  const [errores, setErrores] = createSignal<Set<string>>(new Set());

  const manejarArchivo = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (!input.files?.length) return;

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const hoja = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(hoja, { header: 1 }) as any[][];

      const filas = json.slice(1).map((fila: any[]) => {
        const completa = [...fila];
        while (completa.length < HEADERS.length) completa.push('');
        return completa;
      });

      const resultado = [HEADERS, ...filas];
      setPreview(resultado);
      validar(resultado);
    };

    reader.readAsArrayBuffer(file);
  };

  const validar = (rows: any[][]) => {
    const errores = new Set<string>();
    rows.slice(1).forEach((fila, i) => {
      const filaIdx = i + 1;
      const [sku, , , hayStock, precioUnitario, , , categoriaId] = fila;

      if (!sku) errores.add(`sku-${filaIdx}`);
      if (hayStock !== 'Sí' && hayStock !== 'No') errores.add(`hayStock-${filaIdx}`);
      if (!precioUnitario || isNaN(Number(precioUnitario))) errores.add(`precioUnitario-${filaIdx}`);
      if (categoriaId && isNaN(Number(categoriaId))) errores.add(`categoriaId-${filaIdx}`);
    });
    setErrores(errores);
  };

  const celdaEsInvalida = (col: string, fila: number) => errores().has(`${col}-${fila}`);

  const editarCelda = (filaIdx: number, colIdx: number, valor: string) => {
    setPreview((prev) => {
      const copia = prev.map((fila) => [...fila]);
      copia[filaIdx][colIdx] = valor;
      validar(copia);
      return copia;
    });
  };

  return (
    <Show when={props.abierto}>
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg max-w-6xl w-full shadow">
          <h2 class="text-lg font-semibold mb-4">Importar productos desde Excel</h2>

          <label class="block w-max cursor-pointer bg-blue-600 text-white px-4 py-2 rounded mb-4">
            Seleccionar archivo
            <input type="file" accept=".xlsx" onChange={manejarArchivo} class="hidden" />
          </label>

          <Show when={preview().length > 0}>
            <div class="overflow-auto max-h-[60vh] border rounded">
              <table class="w-full text-sm border border-collapse">
                <thead class="bg-gray-100 sticky top-0">
                  <tr>
                    <For each={HEADERS}>{(col) => <th class="p-2 border text-left">{col}</th>}</For>
                  </tr>
                </thead>
                <tbody>
                  <For each={preview().slice(1)}>
                    {(fila, indexAccessor) => {
                      const index = indexAccessor();
                      const filaN = index + 1;
                      return (
                        <tr>
                          <For each={fila}>
                            {(celda, jAccessor) => {
                              const j = jAccessor();
                              const col = HEADERS[j];
                              return (
                                <td class="p-1 border">
                                  <input
                                    value={celda}
                                    class={`w-full px-1 py-0.5 rounded outline-none ${
                                      celdaEsInvalida(col, filaN)
                                        ? 'bg-red-100 text-red-600 font-semibold'
                                        : ''
                                    }`}
                                    onInput={(e) =>
                                      editarCelda(index, j, e.currentTarget.value)
                                    }
                                  />
                                </td>
                              );
                            }}
                          </For>

                        </tr>
                      );
                    }}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>

          <div class="mt-4 text-right">
            <button
              onClick={props.onCerrar}
              class="bg-gray-400 text-white px-4 py-1 rounded"
            >
              Cancelar
            </button>
            <button
              class="bg-blue-600 text-white px-4 py-1 rounded ml-2"
              disabled={errores().size > 0}
            >
              Subir
            </button>
          </div>
        </div>
      </div>
    </Show>
  );
}
