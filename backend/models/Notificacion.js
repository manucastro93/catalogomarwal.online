export default (sequelize, DataTypes) => {
    const Notificacion = sequelize.define('Notificacion', {
      titulo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      mensaje: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      leida: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      tipo: {
        type: DataTypes.STRING,
        defaultValue: 'general',
      },
    }, {
      tableName: 'Notificaciones',
      timestamps: true,
    });
  
    Notificacion.associate = (models) => {
      Notificacion.belongsTo(models.Usuario, { as: 'usuario', foreignKey: 'usuarioId' });
    };
  
    return Notificacion;
  };
  