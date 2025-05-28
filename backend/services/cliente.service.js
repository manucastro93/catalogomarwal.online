import { Cliente } from '../models/index.js';
import { Op, literal } from 'sequelize';
import dayjs from 'dayjs';

export const obtenerClientesInactivos = async () => {
  const haceTresMeses = dayjs().subtract(3, 'month').toDate();

  return Cliente.findAll({
    where: {
      id: {
        [Op.notIn]: literal(`(
          SELECT DISTINCT clienteId FROM pedidos
          WHERE createdAt >= '${haceTresMeses.toISOString().slice(0, 19).replace('T', ' ')}'
        )`)
      }
    }
  });
};
