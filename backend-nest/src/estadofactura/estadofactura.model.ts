export default (sequelize, DataTypes) => {
  const EstadoFactura = sequelize.define('EstadoFactura', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
  }, {
    tableName: 'EstadosFacturas',
    timestamps: false,
  });

  EstadoFactura.associate = (models) => {
    EstadoFactura.hasMany(models.Factura, {
      foreignKey: 'estadoFacturaId',
      as: 'facturas',
    });
  };

  return EstadoFactura;
};
