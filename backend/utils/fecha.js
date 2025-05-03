import { format } from "date-fns";
import { es } from "date-fns/locale";

// Ej: "lunes 29/04"
export const formatearFechaCorta = (fecha) => {
  try {
    return format(fecha, "EEEE dd/MM", { locale: es });
  } catch (e) {
    return "fecha inválida";
  }
};

// Ej: "lunes 29 de abril"
export const formatearFechaLarga = (fecha) => {
    try {
      return format(fecha, "EEEE d 'de' MMMM", { locale: es });
    } catch (e) {
      return "fecha inválida";
    }
  };