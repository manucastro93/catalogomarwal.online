export default (sequelize, DataTypes) => {
    const RolUsuario = sequelize.define('RolUsuario', {
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      descripcion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    }, {
      tableName: 'RolesUsuarios',
      timestamps: true,
      paranoid: true,
    });
  
    RolUsuario.associate = (models) => {
      RolUsuario.hasMany(models.Usuario, {
        foreignKey: 'rolUsuarioId',
        as: 'usuarios',
      });
      RolUsuario.hasMany(models.PermisosUsuario, {
        foreignKey: 'rolUsuarioId',
        as: 'permisos'
      });
    };
  
    return RolUsuario;
  };
  
