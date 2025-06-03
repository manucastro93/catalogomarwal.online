export default (sequelize, DataTypes) => {
  const DetalleFactura = sequelize.define(
    'DetalleFactura',
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
      costo: {
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
      facturaId: {
        type: DataTypes.BIGINT,
        allowNull: false,
        references: {
          model: 'Facturas',
          key: 'id',
        },
      },
    },
    {
      tableName: 'DetalleFacturas',
      timestamps: false,
      paranoid: false
    }
  );

  DetalleFactura.associate = (models) => {
    DetalleFactura.belongsTo(models.Factura, {
      foreignKey: 'facturaId',
      as: 'factura',
    });
  };

  return DetalleFactura;
};
