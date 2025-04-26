export default (sequelize, DataTypes) => {
    const PermisosUsuario = sequelize.define('PermisosUsuario', {
      rolUsuarioId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      moduloId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false
      },
      accion: {
        type: DataTypes.STRING(50),
        allowNull: false
      },
      permitido: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE
    }, {
      tableName: 'PermisosUsuarios',
      timestamps: true,
      paranoid: true,
      indexes: [
        {
          unique: true,
          fields: ['rolUsuarioId', 'moduloId', 'accion']
        }
      ]
    });
  
    PermisosUsuario.associate = (models) => {
      PermisosUsuario.belongsTo(models.RolUsuario, {
        foreignKey: 'rolUsuarioId',
        as: 'rolUsuario'
      });
  
      PermisosUsuario.belongsTo(models.Modulo, {
        foreignKey: 'moduloId',
        as: 'modulo'
      });
    };
  
    return PermisosUsuario;
  };
  