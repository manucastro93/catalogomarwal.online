export default (sequelize, DataTypes) => {
  const ReporteProduccion = sequelize.define(
    "ReporteProduccion",
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      fecha: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      productoId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      turno: {
        type: DataTypes.ENUM("mañana", "tarde", "noche"),
        allowNull: false,
        defaultValue: "mañana",
      },
      plantaId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: "ReporteProducciones",
      timestamps: true,
      paranoid: true,
    }
  );

  ReporteProduccion.associate = (models) => {
    ReporteProduccion.belongsTo(models.Producto, {
      foreignKey: "productoId",
      as: "producto",
    });

    ReporteProduccion.belongsTo(models.Usuario, {
      foreignKey: "usuarioId",
      as: "usuario",
    });

    ReporteProduccion.belongsTo(models.Planta, {
      foreignKey: "plantaId",
      as: "planta",
    });
  };

  return ReporteProduccion;
};
