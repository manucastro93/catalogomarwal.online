
export const formatearPrecio = (precio: number) =>
    precio.toLocaleString("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  
export const capitalizarTexto = (texto: string) =>
    texto
      .toLowerCase()
      .replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
  