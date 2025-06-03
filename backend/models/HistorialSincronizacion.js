export default (sequelize, DataTypes) => {
  const HistorialSincronizacion = sequelize.define("HistorialSincronizacion", {
    tipo: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    fechaUltima: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  }, {
    tableName: "HistorialSincronizacion",
    timestamps: false,
  });

  return HistorialSincronizacion;
};
