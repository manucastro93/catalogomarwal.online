import { Injectable } from '@nestjs/common';
import { Usuario } from './usuario.model';
import { RolUsuario } from '@/rolusuario/rolusuario.model';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import { nanoid } from 'nanoid';
import { ROLES_USUARIOS } from '@/constants/rolesUsuarios';
import { puedeActualizarUsuario } from '@/utils/puedeActualizarUsuario';
import { crearAuditoria } from '@/utils/auditoria';

@Injectable()
export class UsuarioService {
  async crearUsuario(req, res, next) {
    try {
      const { nombre, email, telefono, rolUsuarioId } = req.body;

      if (!nombre || !email || rolUsuarioId == null) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
      }

      const idRol = Number(rolUsuarioId);
      console.log('💬 rolUsuarioId recibido:', rolUsuarioId, 'tipo:', typeof rolUsuarioId);

      if (!Object.values(ROLES_USUARIOS).includes(idRol)) {
        return res.status(400).json({ message: 'Rol inválido' });
      }

      const existente = await Usuario.findOne({ where: { email } });
      if (existente) {
        return res.status(400).json({ message: 'El email ya está en uso.' });
      }

      if ((idRol === ROLES_USUARIOS.VENDEDOR || idRol === ROLES_USUARIOS.ADMINISTRADOR) && !telefono) {
        return res.status(400).json({ message: 'El teléfono es obligatorio para este tipo de usuario.' });
      }

      let link = null;
      if (idRol === ROLES_USUARIOS.VENDEDOR) {
        link = nanoid(4).toUpperCase();
      }

      const usuario = await Usuario.create({
        nombre,
        email,
        telefono: telefono || null,
        rolUsuarioId: idRol,
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
  }

  async obtenerUsuariosOperarios(req, res, next) {
    try {
      const usuarios = await Usuario.findAll({
        where: {
          rolUsuarioId: {
            [Op.in]: [4, 5, 6, 7],
          },
        },
        order: [['nombre', 'ASC']],
        include: [RolUsuario],
      });

      res.json(usuarios);
    } catch (error) {
      console.error('❌ Error al obtener usuarios operarios:', error);
      next(error);
    }
  }

  async obtenerUsuariosPorRol(req, res, next) {
    try {
      const { rolUsuarioId } = req.params;
      const usuarios = await Usuario.findAll({
        where: { rolUsuarioId },
        order: [['nombre', 'ASC']],
        include: [RolUsuario],
      });

      res.json(usuarios);
    } catch (error) {
      console.error('❌ Error al obtener usuarios por rol:', error);
      next(error);
    }
  }

  async obtenerUsuariosPorRolId(req, res, next) {
    try {
      const { rolUsuarioId } = req.params;
      const usuarios = await Usuario.findAll({
        where: { rolUsuarioId },
        order: [['nombre', 'ASC']],
        include: [RolUsuario],
      });

      res.json(usuarios);
    } catch (error) {
      console.error('❌ Error al obtener usuarios por rol id:', error);
      next(error);
    }
  }

  async actualizarUsuario(req, res, next) {
    try {
      const { id } = req.params;
      const { nombre, contraseña, telefono, rolUsuarioId } = req.body;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      if (!puedeActualizarUsuario(req.usuario, usuario)) {
        return res.status(403).json({ message: 'No tienes permisos' });
      }

      usuario.nombre = nombre ?? usuario.nombre;
      usuario.telefono = telefono ?? usuario.telefono;
      usuario.rolUsuarioId = rolUsuarioId ?? usuario.rolUsuarioId;

      if (contraseña) {
        const salt = await bcrypt.genSalt(10);
        usuario.contraseña = await bcrypt.hash(contraseña, salt);
      }

      await usuario.save();

      await crearAuditoria({
        tabla: 'usuarios',
        accion: 'actualiza usuario',
        registroId: usuario.id,
        usuarioId: req.usuario?.id || null,
        descripcion: `Se actualizó el usuario ${usuario.nombre}`,
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
      });

      res.json(usuario);
    } catch (error) {
      console.error('❌ Error al actualizar usuario:', error);
      next(error);
    }
  }

  async cambiarContrasena(req, res, next) {
    try {
      const { id } = req.params;
      const { contrasena } = req.body;

      const usuario = await Usuario.findByPk(id);
      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const salt = await bcrypt.genSalt(10);
      usuario.contraseña = await bcrypt.hash(contrasena, salt);
      await usuario.save();

      res.json({ message: 'Contraseña actualizada' });
    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      next(error);
    }
  }

  async eliminarUsuario(req, res, next) {
    try {
      const { id } = req.params;
      const usuario = await Usuario.findByPk(id);

      if (!usuario) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      await usuario.destroy();

      await crearAuditoria({
        tabla: 'usuarios',
        accion: 'elimina usuario',
        registroId: usuario.id,
        usuarioId: req.usuario?.id || null,
        descripcion: `Se eliminó el usuario ${usuario.nombre}`,
        ip: req.headers['x-forwarded-for'] || req.socket?.remoteAddress || null,
      });

      res.json({ message: 'Usuario eliminado' });
    } catch (error) {
      console.error('❌ Error al eliminar usuario:', error);
      next(error);
    }
  }
}
