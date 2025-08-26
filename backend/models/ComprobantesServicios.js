export default (sequelize, DataTypes) => {
  const ComprobantesServicios = sequelize.define(
    "ComprobantesServicios",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      tipoComprobante: DataTypes.STRING,
      comprobante: DataTypes.STRING,
      fecha: DataTypes.DATE,
      fechaImputacion: DataTypes.DATE,
      detalles: DataTypes.STRING,
      total: DataTypes.DECIMAL(15,2),
      montoPagado: DataTypes.DECIMAL(15,2),
      saldo: DataTypes.DECIMAL(15,2),
      estadoFacturacion: DataTypes.STRING,
      personal: DataTypes.STRING,
      fechaVencimiento: DataTypes.DATE,
      fechaRegistro: DataTypes.DATE,
      observaciones: DataTypes.TEXT,
      personalAnula: DataTypes.STRING,
      fechaAnula: DataTypes.DATE,
    },
    { paranoid: true }
  );

  ComprobantesServicios.associate = (models) => {
    ComprobantesServicios.belongsTo(models.ProveedoresServicios, {
      foreignKey: "proveedorId",
      as: "proveedor",
    });
    ComprobantesServicios.belongsTo(models.CategoriasServicios, {
      foreignKey: "categoriaId",
      as: "categoria",
    });
  };

  return ComprobantesServicios;
};
