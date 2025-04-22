import { Usuario, Pedido, DetallePedido,Producto, Cliente, Provincia, Localidad, IpCliente, LogCliente } from '../models/index.js';
import { Op, fn, col, literal } from 'sequelize';
import bcrypt from 'bcryptjs';

// ================== USUARIOS GENERALES ==================

export const obtenerUsuarios = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({ order: [['createdAt', 'DESC']] });
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

export const crearUsuario = async (req, res, next) => {
  try {
    const { nombre, email, contraseña, rol, telefono } = req.body;

    const existente = await Usuario.findOne({ where: { email } });
    if (existente) return res.status(400).json({ message: 'El email ya está en uso.' });

    let hash = null;
    if (contraseña) {
      hash = await bcrypt.hash(contraseña, 10);
    }

    if ((rol === 'vendedor' || rol === 'administrador') && !telefono) {
      return res.status(400).json({ message: 'El teléfono es obligatorio para este tipo de usuario.' });
    }

    const usuario = await Usuario.create({
      nombre,
      email,
      rol,
      telefono,
      contraseña: hash,
    });

    res.status(201).json(usuario);
  } catch (error) {
    next(error);
  }
};

export const actualizarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    const { contraseña, ...resto } = req.body;
    if (contraseña) {
      resto.contraseña = await bcrypt.hash(contraseña, 10);
    }

    await usuario.update(resto);
    res.json(usuario);
  } catch (error) {
    next(error);
  }
};

export const eliminarUsuario = async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });

    await usuario.destroy();
    res.json({ message: 'Usuario eliminado' });
  } catch (error) {
    next(error);
  }
};

// ================== VENDEDORES ==================

export const obtenerVendedores = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({
      where: { rol: 'vendedor' },
      order: [['createdAt', 'DESC']],
    });
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

export const crearVendedor = async (req, res, next) => {
  try {
    const { nombre, email, telefono } = req.body;

    const existente = await Usuario.findOne({ where: { email } });
    if (existente) return res.status(400).json({ message: 'El email ya está en uso.' });
    if (!telefono) return res.status(400).json({ message: 'El teléfono es obligatorio.' });

    const vendedor = await Usuario.create({
      nombre,
      email,
      telefono,
      rol: 'vendedor',
      contraseña: null,
    });

    res.status(201).json(vendedor);
  } catch (error) {
    next(error);
  }
};

export const actualizarVendedor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendedor = await Usuario.findByPk(id);
    if (!vendedor) return res.status(404).json({ message: 'Vendedor no encontrado' });

    const { contraseña, ...resto } = req.body;
    if (contraseña) {
      resto.contraseña = await bcrypt.hash(contraseña, 10);
    }

    await vendedor.update(resto);
    res.json(vendedor);
  } catch (error) {
    next(error);
  }
};

export const eliminarVendedor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const vendedor = await Usuario.findByPk(id);
    if (!vendedor) return res.status(404).json({ message: 'Vendedor no encontrado' });

    await vendedor.destroy();
    res.json({ message: 'Vendedor eliminado' });
  } catch (error) {
    next(error);
  }
};

export const buscarVendedorPorLink = async (req, res, next) => {
  try {
    const { link } = req.params;

    const vendedor = await Usuario.findOne({
      where: { link, rol: 'vendedor' },
      attributes: ['id', 'nombre', 'email', 'telefono', 'link'],
    });

    if (!vendedor) {
      return res.status(404).json({ error: 'Vendedor no encontrado' });
    }

    res.json(vendedor);
  } catch (error) {
    next(error);
  }
};

export const obtenerEstadisticasVendedor = async (req, res) => {
  try {
    const { id } = req.params;

    // Ventas totales
    const pedidos = await Pedido.findAll({
      where: { usuarioId: id },
      attributes: ['id', 'total', 'createdAt'],
    });

    // Producto más vendido
    const productoTop = await DetallePedido.findOne({
      where: { usuarioId: id },
      attributes: [
        'productoId',
        [fn('SUM', col('cantidad')), 'totalVendidas'],
      ],
      include: [{ model: Producto, as: 'producto', attributes: ['nombre'] }],
      group: ['productoId'],
      order: [[literal('totalVendidas'), 'DESC']],
    });

    // Clientes
    const clientes = await Cliente.findAll({
      where: { vendedorId: id },
      include: [
        { model: Provincia, as: 'provincia', attributes: ['nombre'] },
        { model: Localidad, as: 'localidad', attributes: ['nombre'] },
      ],
    });

    const clienteIds = clientes.map(c => c.id);

    // Logs de visitas al catálogo
    const ipClientes = await IpCliente.findAll({ where: { clienteId: { [Op.in]: clienteIds } } });
    const ipIds = ipClientes.map(i => i.id);

    const visitasCatalogo = await LogCliente.count({
      where: {
        ipClienteId: { [Op.in]: ipIds },
      },
    });

    res.json({
      totalPedidos: pedidos.length,
      totalFacturado: pedidos.reduce((acc, p) => acc + p.total, 0),
      productoTop,
      cantidadClientes: clientes.length,
      clientes,
      visitasCatalogo,
    });
  } catch (error) {
    console.error("❌ Error en estadísticas del vendedor:", error);
    res.status(500).json({ message: 'Error al obtener estadísticas del vendedor' });
  }
};

// ================== ADMINISTRADORES ==================

export const obtenerAdministradores = async (req, res, next) => {
  try {
    const usuarios = await Usuario.findAll({
      where: { rol: 'administrador' },
      order: [['createdAt', 'DESC']],
    });
    res.json(usuarios);
  } catch (error) {
    next(error);
  }
};

export const crearAdministrador = async (req, res, next) => {
  try {
    const { nombre, email, telefono } = req.body;

    const existente = await Usuario.findOne({ where: { email } });
    if (existente) return res.status(400).json({ message: 'El email ya está en uso.' });
    if (!telefono) return res.status(400).json({ message: 'El teléfono es obligatorio.' });

    const administrador = await Usuario.create({
      nombre,
      email,
      telefono,
      rol: 'administrador',
      contraseña: null,
    });

    res.status(201).json(administrador);
  } catch (error) {
    next(error);
  }
};

export const actualizarAdministrador = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await Usuario.findByPk(id);
    if (!admin) return res.status(404).json({ message: 'Administrador no encontrado' });

    const { contraseña, ...resto } = req.body;
    if (contraseña) {
      resto.contraseña = await bcrypt.hash(contraseña, 10);
    }

    await admin.update(resto);
    res.json(admin);
  } catch (error) {
    next(error);
  }
};

export const eliminarAdministrador = async (req, res, next) => {
  try {
    const { id } = req.params;
    const admin = await Usuario.findByPk(id);
    if (!admin) return res.status(404).json({ message: 'Administrador no encontrado' });

    await admin.destroy();
    res.json({ message: 'Administrador eliminado' });
  } catch (error) {
    next(error);
  }
};
