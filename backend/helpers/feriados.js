// backend/helpers/feriados.js
import axios from "axios";
import dayjs from "dayjs";

export async function obtenerFeriadosDelAnio(anio) {
  try {
    const { data } = await axios.get(`https://nolaborables.com.ar/api/v2/feriados/${anio}`);
    return data; // array de feriados
  } catch (error) {
    console.error("Error obteniendo feriados:", error);
    return [];
  }
}

export async function contarFeriadosEnRango(desde, hasta) {
  const anio = dayjs(desde).year();
  const feriados = await obtenerFeriadosDelAnio(anio);

  const desdeDate = dayjs(desde);
  const hastaDate = dayjs(hasta);

  const feriadosEnRango = feriados.filter(f => {
    const fechaFeriado = dayjs(`${f.dia}-${f.mes}-${anio}`, "D-M-YYYY");
    return fechaFeriado.isAfter(desdeDate.subtract(1, "day")) && fechaFeriado.isBefore(hastaDate.add(1, "day"));
  });

  return feriadosEnRango;
}
