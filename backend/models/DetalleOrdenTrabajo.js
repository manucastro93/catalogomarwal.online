export default (sequelize, DataTypes) => {
  const DetalleOrdenTrabajo = sequelize.define(
    "DetalleOrdenTrabajo",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      ordenTrabajoId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      productoId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
      cantidad: { type: DataTypes.INTEGER, allowNull: false },
    },
    {
      tableName: "DetalleOrdenesTrabajo",
      timestamps: true,
      paranoid: true,
    }
  );

  DetalleOrdenTrabajo.associate = (models) => {
    DetalleOrdenTrabajo.belongsTo(models.OrdenTrabajo, { foreignKey: "ordenTrabajoId" });
    DetalleOrdenTrabajo.belongsTo(models.Producto, { foreignKey: "productoId", as: "producto" });
  };

  return DetalleOrdenTrabajo;
};
