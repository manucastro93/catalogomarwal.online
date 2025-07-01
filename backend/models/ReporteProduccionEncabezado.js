export default (sequelize, DataTypes) => {
  const ReporteProduccionEncabezado = sequelize.define(
    "ReporteProduccionEncabezado",
    {
      id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
      fecha: { type: DataTypes.DATEONLY, allowNull: false },
      turno: { type: DataTypes.ENUM("mañana", "tarde", "noche"), allowNull: false, defaultValue: "mañana" },
      usuarioId: { type: DataTypes.INTEGER, allowNull: false },
      plantaId: { type: DataTypes.INTEGER, allowNull: false },
      nota: { type: DataTypes.STRING(300), allowNull: true },
      ordenTrabajoId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        references: {
          model: "OrdenTrabajo",
          key: "id"
        }
      },
    },
    {
      tableName: "ReporteProduccionEncabezados",
      timestamps: true,
      paranoid: true,
    }
  );
  ReporteProduccionEncabezado.associate = (models) => {
    ReporteProduccionEncabezado.belongsTo(models.Usuario, { foreignKey: "usuarioId", as: "usuario" });
    ReporteProduccionEncabezado.belongsTo(models.Planta, { foreignKey: "plantaId", as: "planta" });
    ReporteProduccionEncabezado.hasMany(models.ReporteProduccion, {
      foreignKey: "reporteProduccionEncabezadoId",
      as: "productos",
      onDelete: "CASCADE",
    });
    ReporteProduccionEncabezado.belongsTo(models.OrdenTrabajo, {
      foreignKey: "ordenTrabajoId",
      as: "ordenTrabajo"
    });
  };
  return ReporteProduccionEncabezado;
};
