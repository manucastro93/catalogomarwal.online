export function formatearPrecio(precio?: number | string): string {
  const num = typeof precio === 'string' ? parseFloat(precio) : precio;
  if (!num && num !== 0) return ''; // undefined o null
  if (isNaN(num)) return '';
  return num.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}


  
  export function capitalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
  }
  