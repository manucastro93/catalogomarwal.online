export default (sequelize, DataTypes) => {
  const Pedido = sequelize.define('Pedido', {
    estado: {
      type: DataTypes.ENUM(
        'pendiente',
        'confirmado',
        'preparando',
        'enviado',
        'entregado',
        'cancelado',
        'rechazado'
      ),
      defaultValue: 'pendiente',
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    total: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Clientes',
        key: 'id',
      },
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Usuarios',
        key: 'id',
      },
    },
  });

  Pedido.associate = (models) => {
    Pedido.belongsTo(models.Cliente, { foreignKey: 'clienteId', as: 'cliente' });
    Pedido.belongsTo(models.Usuario, { as: 'usuario', foreignKey: 'usuarioId' });
    Pedido.hasMany(models.DetallePedido, { foreignKey: 'pedidoId', as: 'detalles' });
  };

  return Pedido;
};
