import { Usuario } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res, next) => {
  try {
    const { email, contraseña } = req.body;
    const usuario = await Usuario.findOne({ where: { email } });

    // Si no existe el usuario
    if (!usuario) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    // Si tiene contraseña definida, comparar
    if (usuario.contraseña) {
      const coincide = await bcrypt.compare(contraseña, usuario.contraseña);
      if (!coincide) {
        return res.status(401).json({ message: 'Credenciales inválidas' });
      }
    }

    const token = jwt.sign(
      { id: usuario.id, rol: usuario.rol },
      process.env.JWT_SECRET,
      { expiresIn: '2000000h' }
    );

    // Limpiar el objeto antes de enviar al frontend
    const usuarioLimpio = { ...usuario.toJSON() };
    delete usuarioLimpio.contraseña;

    res.json({
      token,
      usuario: usuarioLimpio,
      requiereContraseña: !usuario.contraseña,
    });
  } catch (error) {
    next(error);
  }
};

export const verificarToken = (req, res) => {
  res.json({ message: 'Token válido', usuario: req.usuario });
};
