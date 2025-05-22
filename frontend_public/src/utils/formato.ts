export function formatearPrecio(precio?: number | string): string {
  const num = typeof precio === "string" ? parseFloat(precio) : precio;
  if (!num && num !== 0) return ""; // undefined o null
  if (isNaN(num)) return "";
  return num.toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}
export const capitalizarTexto = (texto: string) =>
    texto
      .toLowerCase()
      .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
  
export function formatearCUIT(valor: string): string {
  const soloNumeros = valor.replace(/\D/g, "").slice(0, 11);
  const parte1 = soloNumeros.slice(0, 2);
  const parte2 = soloNumeros.slice(2, 10);
  const parte3 = soloNumeros.slice(10, 11);
  return [parte1, parte2, parte3].filter(Boolean).join("-");
}      