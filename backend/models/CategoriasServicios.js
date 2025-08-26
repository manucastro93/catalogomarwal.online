export default (sequelize, DataTypes) => {
  const CategoriasServicios = sequelize.define(
    "CategoriasServicios",
    {
      id: { type: DataTypes.BIGINT.UNSIGNED, autoIncrement: true, primaryKey: true },
      nombre: DataTypes.STRING,
      descripcion: DataTypes.STRING,
    },
    { paranoid: true }
  );

  CategoriasServicios.associate = (models) => {
    CategoriasServicios.hasMany(models.ComprobantesServicios, {
      foreignKey: "categoriaId",
      as: "comprobantes",
    });
  };

  return CategoriasServicios;
};
