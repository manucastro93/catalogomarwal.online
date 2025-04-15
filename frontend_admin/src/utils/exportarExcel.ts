import * as XLSX from 'xlsx';

export function exportarPedidosExcel(pedidos: any[]) {
  const datos = pedidos.map((p) => ({
    ID: p.id,
    Cliente: p.cliente?.nombre || '—',
    Vendedor: p.usuario?.nombre || '—',
    Estado: p.estado,
    Observaciones: p.observaciones || '',
    Total: p.total,
    Fecha: new Date(p.createdAt).toLocaleString(),
  }));

  const hoja = XLSX.utils.json_to_sheet(datos);
  const libro = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(libro, hoja, 'Pedidos');
  XLSX.writeFile(libro, 'pedidos.xlsx');
}
