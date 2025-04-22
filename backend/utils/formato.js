export const formatearPrecio = (precio) => {
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

export function formatearNumeroWhatsapp(numero) {
  if (!numero) return "";

  const limpio = numero.replace(/\D/g, "");

  if (limpio.startsWith("549")) return `+${limpio}`;
  if (limpio.startsWith("54")) return `+${limpio}`;
  if (limpio.startsWith("0")) return `+54${limpio.slice(1)}`;
  if (limpio.length >= 10 && limpio.length <= 11) return `+549${limpio}`;

  return numero;
}
