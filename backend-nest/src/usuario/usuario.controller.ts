import { Usuario } from '@/usuario/usuario.model';
import { RolUsuario } from '@/rolusuario/rolusuario.model';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { nanoid } from 'nanoid';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import { puedeActualizarUsuario } from '@/utils/puedeActualizarUsuario';
import { crearAuditoria } from '@/utils/auditoria';

export const crearUsuario = async (req, res, next) => {
  try {
    const { nombre, email, telefono, rolUsuarioId } = req.body;

    // 🛡️ Validaciones extra
    if (!nombre || !email || rolUsuarioId == null) {
      return res.status(400)on({ message: 'Faltan campos obligatorios' });
    }

    // 🔍 Asegurar que sea número
    const idRol = Number(rolUsuarioId);
    console.log('💬 rolUsuarioId recibido:', rolUsuarioId, 'tipo:', typeof rolUsuarioId);

    if (!Object.values(ROLES_USUARIOS).includes(idRol)) {
      return res.status(400)on({ message: 'Rol inválido' });
    }

    // 📧 Verificar si el email ya existe
    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      return res.status(400)on({ message: 'El email ya está en uso.' });
    }

    // ☎️ Para vendedor o admin, teléfono es obligatorio
    if ((idRol === ROLES_USUARIOS.VENDEDOR || idRol === ROLES_USUARIOS.ADMINISTRADOR) && !telefono) {
      return res.status(400)on({ message: 'El teléfono es obligatorio para este tipo de usuario.' });
    }

    // 🔗 Si es vendedor, generar link único
    let link = null;
    if (idRol === ROLES_USUARIOS.VENDEDOR) {
      link = nanoid(4).toUpperCase();
    }

    // ✅ Crear el usuario
    const usuario = await Usuario.create({
      nombre,
      email,
      telefono: telefono || null,
      rolUsuarioId: idRol,
      contraseña: null,
      link,
    });

    // 🧾 Auditoría
    await crearAuditoria({
      tabla: 'usuarios',
      accion: 'crea usuario',
      registroId: usuario.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se creó el usuario ${usuario.nombre}`,
      ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
    });

    res.status(201)on(usuario);
  } catch (error) {
    console.error('❌ Error en crearUsuario:', error);
    next(error);
  }
};

export const obtenerUsuariosOperarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({
      where: {
        rolUsuarioId: {
          [Op.in]: [4, 5, 6, 7] // 👈 Todos los operarios
        }
      },
      order: [['nombre', 'ASC']],
      include: [
        {
          model: RolUsuario,
          as: 'rolUsuario',
          attributes: ['nombre']
        }
      ]
    });

    reson(usuarios);
  } catch (error) {
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
      return res.status(400)on({ mensaje: 'Rol no válido' });
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

    reson({
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
    reson(usuarios);
  } catch (error) {
    next(error);
  }
};

export const actualizarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404)on({ message: 'Usuario no encontrado' });
    const datosAntes = usuario.toJSON();
    
    const puede = puedeActualizarUsuario({
      usuarioLogueado: req.usuario,
      usuarioObjetivo: usuario,
      bodyUpdate: req.body,
    });

    if (!puede) {
      return res.status(403)on({ message: 'No autorizado para actualizar este usuario.' });
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

    reson(usuario);
  } catch (error) {
    next(error);
  }
};

export const cambiarContrasena = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { contraseña } = req.body;

    if (!contraseña) {
      return res.status(400)on({ message: 'La contraseña es obligatoria.' });
    }

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404)on({ message: 'Usuario no encontrado.' });
    }

    const puede = puedeActualizarUsuario({
      usuarioLogueado: req.usuario,
      usuarioObjetivo: usuario,
      bodyUpdate: { contraseña },
    });
    if (!puede) {
      return res.status(403)on({ message: 'No autorizado para cambiar contraseña.' });
    }

    const hash = await bcrypt.hash(contraseña, 10);
    await usuario.update({ contraseña: hash });

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || '';

    await crearAuditoria({
      tabla: 'usuarios',
      accion: 'cambia contraseña',
      registroId: usuario.id,
      usuarioId: req.usuario?.id || null,
      descripcion: `Se cambió la contraseña de ${usuario.nombre}`,
      ip,
    });

    reson({ message: 'Contraseña actualizada exitosamente.' });
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
      return res.status(404)on({ message: 'Usuario no encontrado' });
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

    reson({ message: 'Usuario eliminado' });
  } catch (error) {
    console.error('❌ Error al eliminar usuario:', error);
    next(error);
  }
};
