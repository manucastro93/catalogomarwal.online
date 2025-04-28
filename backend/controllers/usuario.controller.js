import { Usuario, RolUsuario } from '../models/index.js';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { nanoid } from 'nanoid';
import { ROLES_USUARIOS } from '../constants/rolesUsuarios.js';
import { puedeActualizarUsuario } from '../utils/puedeActualizarUsuario.js';
import { crearAuditoria } from '../utils/auditoria.js';

export const crearUsuario = async (req, res, next) => {
  try {
    const { nombre, email, telefono, rolUsuarioId } = req.body;
    
    // Validaciones extra
    if (!nombre || !email || !rolUsuarioId) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    // Verificar si el email ya existe
    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      return res.status(400).json({ message: 'El email ya está en uso.' });
    }

    // Buscar qué rol es
    if (![ROLES_USUARIOS.SUPREMO, ROLES_USUARIOS.ADMINISTRADOR, ROLES_USUARIOS.VENDEDOR, ROLES_USUARIOS.OPERARIO].includes(rolUsuarioId)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    // Para Vendedor o Administrador, el teléfono es obligatorio
    if ((rolUsuarioId === ROLES_USUARIOS.VENDEDOR || rolUsuarioId === ROLES_USUARIOS.ADMINISTRADOR) && !telefono) {
      return res.status(400).json({ message: 'El teléfono es obligatorio para este tipo de usuario.' });
    }

    // Para vendedor, generar link único
    let link = null;
    if (rolUsuarioId === ROLES_USUARIOS.VENDEDOR) {
      link = nanoid(4).toUpperCase();
    }

    // Crear el usuario
    const usuario = await Usuario.create({
      nombre,
      email,
      telefono: telefono || null,
      rolUsuarioId,
      contraseña: null,
      link,
    });

    await crearAuditoria({
      tabla: 'usuarios',
      accion: 'crea usuario',
      registroId: usuario.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se creó el usuario ${usuario.nombre}`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });
    

    res.status(201).json(usuario);
  } catch (error) {
    console.error('❌ Error en crearUsuario:', error);
    next(error);
  }
};

export const obtenerUsuariosPorRol = async (req, res, next) => {
  try {
    const rol = req.params.rol;

    const rolEncontrado = await RolUsuario.findOne({
      where: whereSequelize(fn('LOWER', col('nombre')), rol.toLowerCase())
    });

    if (!rolEncontrado) {
      return res.status(400).json({ mensaje: 'Rol no válido' });
    }

    const { page = 1, limit = 20, busqueda = '' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      rolUsuarioId: rolEncontrado.id,
      [Op.or]: [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { email: { [Op.like]: `%${busqueda}%` } }
      ]
    };

    const { rows: usuarios, count: total } = await Usuario.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['nombre', 'ASC']],
      include: [
        { model: RolUsuario, as: 'rolUsuario', attributes: ['nombre'] }
      ]
    });

    res.json({
      usuarios,
      total,
      pagina: parseInt(page),
      totalPaginas: Math.ceil(total / limit)
    });
  } catch (error) {
    next(error);
  }
};

export const obtenerUsuariosPorRolId = async (req, res, next) => {
  try {
    const rolUsuarioId = Number(req.params.id);
    const usuarios = await Usuario.findAll({
      where: { rolUsuarioId },
      order: [['nombre', 'ASC']],
    });
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

export const actualizarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    const datosAntes = usuario.toJSON();
    
    const puede = puedeActualizarUsuario({
      usuarioLogueado: req.usuario,
      usuarioObjetivo: usuario,
      bodyUpdate: req.body,
    });

    if (!puede) {
      return res.status(403).json({ message: 'No autorizado para actualizar este usuario.' });
    }

    const { contraseña, ...resto } = req.body;

    // 🚫 No se actualiza la contraseña desde acá nunca más
    await usuario.update(resto);

    const datosDespues = usuario.toJSON();
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
    await crearAuditoria({
      tabla: 'usuarios',
      accion: 'actualiza usuario',
      registroId: usuario.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Usuario ${usuario.nombre} actualizado.`,
      datosAntes,
      datosDespues,
      ip,
    });

    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

export const cambiarContrasena = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contraseña } = req.body;

    if (!contraseña) {
      return res.status(400).json({ message: 'La contraseña es obligatoria.' });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado.' });
    }

    const puede = puedeActualizarUsuario({
      usuarioLogueado: req.usuario,
      usuarioObjetivo: usuario,
      bodyUpdate: { contraseña },
    });
    if (!puede) {
      return res.status(403).json({ message: 'No autorizado para cambiar contraseña.' });
    }

    const hash = await bcrypt.hash(contraseña, 10);
    await usuario.update({ contraseña: hash });
    
    await crearAuditoria({
      tabla: 'usuarios',
      accion: 'cambia contraseña',
      registroId: usuario.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se cambió la contraseña de ${usuario.nombre}`,
      ip,
    });
    

    res.json({ message: 'Contraseña actualizada exitosamente.' });
  } catch (error) {
    next(error);
  }
};

export const eliminarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    console.log('Usuario encontrado:', usuario);
    if (!usuario) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null;
    console.log('IP del usuario:', ip);
    await usuario.destroy();

    await crearAuditoria({
      tabla: 'usuarios',
      accion: 'elimina usuario',
      registroId: usuario.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se eliminó el usuario "${usuario.nombre}"`,
      ip,
    });

    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    next(error);
  }
};