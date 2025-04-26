export default (sequelize, DataTypes) => {
  const Pedido = sequelize.define('Pedido', {
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
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },    
    estadoPedidoId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'EstadosPedidos',
        key: 'id',
      },
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
    Pedido.belongsTo(models.EstadoPedido, {
      foreignKey: 'estadoPedidoId',
      as: 'estadoPedido',
    });
  };

  return Pedido;
};
