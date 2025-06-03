export default (sequelize, DataTypes) => {
    const Modulo = sequelize.define('Modulo', {
      nombre: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      descripcion: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: DataTypes.DATE,
      updatedAt: DataTypes.DATE,
      deletedAt: DataTypes.DATE
    }, {
      tableName: 'Modulos',
      timestamps: true,
      paranoid: true
    });
  
    Modulo.associate = (models) => {
      Modulo.hasMany(models.PermisosUsuario, {
        foreignKey: 'moduloId'
      });
    };
  
    return Modulo;
  };
  
