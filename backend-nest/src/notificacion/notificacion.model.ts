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
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    pedidoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    }
  }, {
    tableName: 'Notificaciones',
    timestamps: true,
  });

  Notificacion.associate = (models) => {
    Notificacion.belongsTo(models.Usuario, {
      as: 'usuario',
      foreignKey: 'usuarioId',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    Notificacion.belongsTo(models.Pedido, {
      as: 'pedido',
      foreignKey: 'pedidoId',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    });
  };

  return Notificacion;
};
