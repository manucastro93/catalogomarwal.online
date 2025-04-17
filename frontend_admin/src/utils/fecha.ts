import dayjs from 'dayjs';
import 'dayjs/locale/es';

dayjs.locale('es');

export const formatearFechaHora = (fecha: string) =>
  dayjs(fecha).format('D [de] MMMM [de] YYYY - HH:mm');
