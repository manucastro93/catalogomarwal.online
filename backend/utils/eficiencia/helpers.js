import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';

dayjs.extend(utc);
dayjs.extend(customParseFormat);

export const formatFecha = (date) => {
  if (!date) return 'Sin Fecha';
  return dayjs(date).utc().format("DD-MM-YYYY");
};

export const toFloat = (value) => parseFloat(value || 0);

export const toFixed = (value, decimals = 2) => +value.toFixed(decimals);

