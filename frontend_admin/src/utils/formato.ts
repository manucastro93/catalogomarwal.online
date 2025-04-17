export function formatearPrecio(precio?: number): string {
  if (typeof precio !== 'number' || isNaN(precio)) return '$0';
  return precio.toLocaleString("es-AR", {
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
  