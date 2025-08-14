import { nanoid } from 'nanoid';
import { ROLES_USUARIOS } from '../constants/rolesUsuarios.js';

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
      allowNull: true, // puede ser null en el primer login
    },
    rolUsuarioId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    link: {
      type: DataTypes.STRING(4),
      allowNull: true,
      unique: true,
    },
    telefono: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    personalDuxId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
    deletedAt: DataTypes.DATE,
  }, {
    tableName: 'Usuarios',
    timestamps: true,
    paranoid: true,
  });

  // 🔁 Hook para asignar link corto si es VENDEDOR
  Usuario.beforeCreate((usuario) => {
    if (usuario.rolUsuarioId === ROLES_USUARIOS.VENDEDOR) {
      usuario.link = nanoid(4).toUpperCase();
    }
  });

  Usuario.associate = (models) => {
    Usuario.hasMany(models.Pedido, { foreignKey: 'usuarioId' });
    Usuario.hasMany(models.Cliente, { foreignKey: 'vendedorId' });
    Usuario.hasMany(models.LogAuditoria, { foreignKey: 'usuarioId' });
    
    Usuario.belongsTo(models.RolUsuario, {foreignKey: 'rolUsuarioId',as: 'rolUsuario',});
    Usuario.belongsTo(models.PersonalDux, {foreignKey: 'personalDuxId',as: 'personalDux',});
  };

  return Usuario;
};
