export default (sequelize, DataTypes) => {
  const DetallePedido = sequelize.define('DetallePedido', {
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    precioUnitario: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    precioXBulto: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    subtotal: {
      type: DataTypes.FLOAT,
      allowNull: false,
      defaultValue: 0,
    },
    descuento: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    dispositivo: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    pedidoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Pedidos',
        key: 'id',
      },
    },
    productoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Productos',
        key: 'id',
      },
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

  DetallePedido.associate = (models) => {
    DetallePedido.belongsTo(models.Pedido, { foreignKey: 'pedidoId' });
    DetallePedido.belongsTo(models.Producto, { foreignKey: 'productoId' });
    DetallePedido.belongsTo(models.Cliente, { foreignKey: 'clienteId' });
    DetallePedido.belongsTo(models.Usuario, { foreignKey: 'usuarioId' });
  };

  return DetallePedido;
};
