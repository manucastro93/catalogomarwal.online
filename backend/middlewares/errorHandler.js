export default (err, req, res, next) => {
  console.error('❌ ERROR:', err);

  const status = err.status || 500;
  let message = 'Error interno del servidor';

  if (err.name === 'SequelizeValidationError') {
    message = err.errors.map((e) => e.message).join(', ');
  } else if (err.name === 'SequelizeUniqueConstraintError') {
    message = 'Ya existe un registro con esos datos únicos';
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    message = 'Relación inválida: la categoría no existe';
  } else if (err.message) {
    message = err.message;
  }

  res.status(status).json({ error: message });
};
