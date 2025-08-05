export default (sequelize, DataTypes) => {
  const PedidoDux = sequelize.define('PedidoDux', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nro_pedido: {
      type: DataTypes.INTEGER,
      unique: true,
      allowNull: false,
    },
    cliente: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    personal: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    total: {
      type: DataTypes.DECIMAL(12, 3),
      allowNull: false,
    },
    estado_facturacion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    observaciones: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    detalles: {
      type: DataTypes.JSON,
      allowNull: true,
    }
  }, {
    tableName: 'PedidosDux',
    timestamps: true,
    paranoid: true
  });

  PedidoDux.associate = (models) => {
    PedidoDux.hasMany(models.DetallePedidoDux, {
      foreignKey: 'pedidoDuxId',
      as: 'items',
    });
  };

  return PedidoDux;
};