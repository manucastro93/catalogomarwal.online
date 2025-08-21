export default (sequelize, DataTypes) => {
  const ReportesProduccionesInyeccion = sequelize.define(
    'ReportesProduccionesInyeccion',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      reporteProduccionInyeccionEncabezadoId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      operarioId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      maquinaId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      piezaId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      horaDesde: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      horaHasta: {
        type: DataTypes.TIME,
        allowNull: false,
      },
      cantidad: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      fallados: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ReportesProduccionesInyeccion',
      tableName: 'ReportesProduccionesInyeccion',
      timestamps: true,
      paranoid: true,
    }
  );

  ReportesProduccionesInyeccion.associate = (models) => {
    ReportesProduccionesInyeccion.belongsTo(models.ReporteProduccionInyeccionEncabezado, {
      foreignKey: 'ReporteProduccionInyeccionEncabezadoId',
      as: 'Encabezado',
    });
    ReportesProduccionesInyeccion.belongsTo(models.Operario, { foreignKey: 'operarioId', as: 'Operario' });
    ReportesProduccionesInyeccion.belongsTo(models.Maquina, { foreignKey: 'maquinaId', as: 'Maquina' });
    ReportesProduccionesInyeccion.belongsTo(models.Pieza, { foreignKey: 'piezaId', as: 'Pieza' });
  };

  return ReportesProduccionesInyeccion;
};
