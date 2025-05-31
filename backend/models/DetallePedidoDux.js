export default (sequelize, DataTypes) => {
  const DetallePedidoDux = sequelize.define(
    'DetallePedidoDux',
    {
      cantidad: {
        type: DataTypes.FLOAT,
        allowNull: false,
      },
      precioUnitario: {
        type: DataTypes.FLOAT,
        allowNull: false,
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
      codItem: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      pedidoDuxId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'PedidosDux',
          key: 'id',
        },
      },
    },
    {
      tableName: 'DetallePedidosDux',
      timestamps: false,
      paranoid: false
    }
  );

  DetallePedidoDux.associate = (models) => {
    DetallePedidoDux.belongsTo(models.PedidoDux, {
      foreignKey: 'pedidoDuxId',
      as: 'pedidoDux',
    });
  };

  return DetallePedidoDux;
};
