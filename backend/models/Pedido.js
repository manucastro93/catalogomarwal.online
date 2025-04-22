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
        'rechazado',
        'editando'
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
      }
    },
    estadoEdicion: {
      type: DataTypes.ENUM('pendiente', 'editando'),
      defaultValue: 'pendiente',
    },
  });

  Pedido.associate = (models) => {
    Pedido.belongsTo(models.Cliente, {
      foreignKey: 'clienteId',
      as: 'cliente',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    Pedido.belongsTo(models.Usuario, {
      as: 'usuario',
      foreignKey: 'usuarioId',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
    Pedido.hasMany(models.DetallePedido, {
      foreignKey: 'pedidoId',
      as: 'detalles',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return Pedido;
};
