import jwt from 'jsonwebtoken';

export const verificarToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: 'Token no proporcionado' });

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.error('Token vencido:', error.expiredAt);
      return res.status(401).json({ message: 'Token vencido' });
    }
    console.error('Error al verificar token:', error);
    return res.status(401).json({ message: 'Token inválido' });
  }
};
