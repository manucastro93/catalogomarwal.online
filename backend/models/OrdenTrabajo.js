export default (sequelize, DataTypes) => {
  const OrdenTrabajo = sequelize.define(
    "OrdenTrabajo",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      fecha: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      turno: {
        type: DataTypes.ENUM("mañana", "tarde", "noche"),
        allowNull: false,
        defaultValue: "mañana",
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      plantaId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      nota: {
        type: DataTypes.STRING(300),
        allowNull: true,
      },
    },
    {
      tableName: "OrdenesTrabajo",
      timestamps: true,
      paranoid: true,
    }
  );

  OrdenTrabajo.associate = (models) => {
    OrdenTrabajo.belongsTo(models.Usuario, {
      foreignKey: "usuarioId",
      as: "usuario",
    });
    OrdenTrabajo.belongsTo(models.Planta, {
      foreignKey: "plantaId",
      as: "planta",
    });

    OrdenTrabajo.hasMany(models.DetalleOrdenTrabajo, {
  foreignKey: "ordenTrabajoId",
  as: "productos",
  onDelete: "CASCADE",
});
OrdenTrabajo.hasMany(models.ReporteProduccionEncabezado, {
  foreignKey: "ordenTrabajoId",
  as: "reportesProduccion",
});

  };

  return OrdenTrabajo;
};
