import { createSignal, createResource, For, Show } from 'solid-js';
import * as XLSX from 'xlsx';
import { importarProductosDesdeExcel } from '../../services/producto.service';
import { obtenerCategorias } from '../../services/categoria.service';
import ModalMensaje from '../Layout/ModalMensaje';
import type { Categoria } from '../../types/categoria';

const HEADERS = [
  'sku',
  'nombre',
  'descripcion',
  'precioUnitario',
  'precioPorBulto',
  'unidadPorBulto',
  'categoria',
];

export default function ModalImportarExcel(props: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const [preview, setPreview] = createSignal<any[][]>([]);
  const [errores, setErrores] = createSignal<Set<string>>(new Set());
  const [mensaje, setMensaje] = createSignal('');
  const [categorias] = createResource(obtenerCategorias);
  const [subiendo, setSubiendo] = createSignal(false);

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

        const precioUnitario = Number(completa[3]);
        const precioPorBulto = Number(completa[4]);
        const unidadPorBulto = Number(completa[5]);

        if (!isNaN(precioUnitario) && !isNaN(unidadPorBulto)) {
          completa[4] = (precioUnitario * unidadPorBulto).toFixed(2);
        } else if (!isNaN(precioPorBulto) && !isNaN(unidadPorBulto) && unidadPorBulto > 0) {
          completa[3] = (precioPorBulto / unidadPorBulto).toFixed(2);
        }

        return completa;
      });

      const resultado = [HEADERS, ...filas];
      setPreview(resultado.map((fila) => [...fila]));
      validar(resultado);
    };

    reader.readAsArrayBuffer(file);
  };

  const validar = (rows: any[][]) => {
    const errores = new Set<string>();
    rows.slice(1).forEach((fila, i) => {
      const filaIdx = i + 1;
      const [sku, , , precioUnitario] = fila;
      if (!sku) errores.add(`sku-${filaIdx}`);
      if (precioUnitario === '' || isNaN(Number(precioUnitario))) errores.add(`precioUnitario-${filaIdx}`);
    });
    setErrores(errores);
  };

  const celdaEsInvalida = (col: string, fila: number) => errores().has(`${col}-${fila}`);

  const editarCelda = (filaIdx: number, colIdx: number, valor: string) => {
    setPreview((prev) => {
      const copia = prev.map((fila) => [...fila]);
      copia[filaIdx + 1][colIdx] = valor;

      const fila = copia[filaIdx + 1];
      const unidadPorBulto = Number(fila[5]);
      const precioUnitario = Number(fila[3]);
      const precioPorBulto = Number(fila[4]);

      if ((colIdx === 3 || colIdx === 5) && !isNaN(precioUnitario) && !isNaN(unidadPorBulto)) {
        copia[filaIdx + 1][4] = (precioUnitario * unidadPorBulto).toFixed(2);
      }
      if ((colIdx === 4 || colIdx === 5) && !isNaN(precioPorBulto) && !isNaN(unidadPorBulto) && unidadPorBulto > 0) {
        copia[filaIdx + 1][3] = (precioPorBulto / unidadPorBulto).toFixed(2);
      }

      validar(copia);
      return copia;
    });

    setTimeout(() => {
      const input = document.querySelector(
        `input[data-row='${filaIdx}'][data-col='${colIdx}']`
      ) as HTMLInputElement;
      input?.focus();
      input?.setSelectionRange(input.value.length, input.value.length);
    }, 0);
  };

  const subirProductos = async () => {
    setSubiendo(true);
    const headerFinal = [...HEADERS];
    const datos = preview().slice(1);

    const hoja = XLSX.utils.aoa_to_sheet([headerFinal, ...datos]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, hoja, 'Productos');

    const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const archivo = new File([blob], 'productos.xlsx');
    const formData = new FormData();
    formData.append('archivo', archivo);

    try {
      const res = await importarProductosDesdeExcel(formData);
      props.onCerrar();
      setMensaje(res.mensaje);
    } catch (err) {
      console.error('❌ Error al importar productos:', err);
      setMensaje('Error al importar productos');
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <Show when={props.abierto}>
      <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg max-w-6xl w-full shadow relative">
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
                    <For each={HEADERS}>
                      {(col) => <th class="p-2 border text-left">{col}</th>}
                    </For>
                    <th class="p-2 border text-left">Eliminar</th>
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

                              if (col === 'categoria') {
                                return (
                                  <td class="p-1 border">
                                    <select
                                      value={celda}
                                      class={`w-full px-1 py-0.5 rounded outline-none ${celdaEsInvalida(col, filaN) ? 'bg-red-100 text-red-600 font-semibold' : ''}`}
                                      onInput={(e) => editarCelda(index, j, e.currentTarget.value)}
                                    >
                                      <option value={celda}>{celda || 'Seleccionar'}</option>
                                      <For each={categorias()}>
                                        {(c: Categoria) => <option value={c.nombre}>{c.nombre}</option>}
                                      </For>
                                    </select>
                                  </td>
                                );
                              }

                              return (
                                <td class="p-1 border">
                                  <input
                                    data-row={index}
                                    data-col={j}
                                    value={celda}
                                    class={`w-full px-1 py-0.5 rounded outline-none ${celdaEsInvalida(col, filaN) ? 'bg-red-100 text-red-600 font-semibold' : ''}`}
                                    onInput={(e) => editarCelda(index, j, e.currentTarget.value)}
                                  />
                                </td>
                              );
                            }}
                          </For>
                          <td class="p-1 border text-center">
                            <button
                              onClick={() => {
                                const actual = preview();
                                const nueva = [actual[0], ...actual.slice(1).filter((_, i) => i !== index)];
                                setPreview(nueva);
                                validar(nueva);
                              }}
                              class="text-red-600 hover:text-red-800"
                            >
                              🗑️
                            </button>
                          </td>
                        </tr>
                      );
                    }}
                  </For>
                </tbody>
              </table>
            </div>
          </Show>

          <Show when={errores().size > 0}>
            <p class="text-red-600 text-sm font-medium mt-4">
              ⚠️ Hay celdas obligatorias vacías o con formato incorrecto. Corregilas antes de continuar.
            </p>
          </Show>

          <div class="mt-4 text-right">
            <button onClick={props.onCerrar} class="bg-gray-400 text-white px-4 py-1 rounded">
              Cancelar
            </button>
            <button
              class="bg-blue-600 text-white px-4 py-1 rounded ml-2"
              disabled={errores().size > 0}
              onClick={subirProductos}
            >
              Subir
            </button>
          </div>

          <Show when={subiendo()}>
            <div class="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50">
              <div class="text-center text-blue-600 font-semibold text-lg animate-pulse">
                Subiendo productos...
              </div>
            </div>
          </Show>

          <ModalMensaje mensaje={mensaje()} cerrar={() => setMensaje('')} />
        </div>
      </div>
    </Show>
  );
}
