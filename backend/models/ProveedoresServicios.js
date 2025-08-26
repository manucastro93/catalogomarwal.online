export default (sequelize, DataTypes) => {
  const ProveedoresServicios = sequelize.define(
    "ProveedoresServicios",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      nombre: DataTypes.STRING,
      razonSocial: DataTypes.STRING,
    },
    { paranoid: true }
  );

  ProveedoresServicios.associate = (models) => {
    ProveedoresServicios.hasMany(models.ComprobantesServicios, {
      foreignKey: "proveedorId",
      as: "comprobantes",
    });
  };

  return ProveedoresServicios;
};
