import { nanoid } from 'nanoid';

export default (sequelize, DataTypes) => {
  const Usuario = sequelize.define('Usuario', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    contraseña: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rol: {
      type: DataTypes.ENUM('supremo', 'administrador', 'vendedor'),
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING(4),
      allowNull: true,
      unique: true,
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  });

  Usuario.beforeCreate(usuario => {
    if (usuario.rol === 'vendedor') {
      usuario.link = nanoid(4).toUpperCase();
    }
  });

  Usuario.associate = models => {
    Usuario.hasMany(models.Pedido, { foreignKey: 'usuarioId' });
    Usuario.hasMany(models.Cliente, { foreignKey: 'vendedorId' });
    Usuario.hasMany(models.LogAuditoria, { foreignKey: 'usuarioId' });
  };

  return Usuario;
};
