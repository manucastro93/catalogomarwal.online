export default (sequelize, DataTypes) => {
  const ReporteProduccionInyeccionEncabezado = sequelize.define(
    'ReporteProduccionInyeccionEncabezado',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      fecha: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      turno: {
        type: DataTypes.ENUM('mañana', 'tarde', 'noche'),
        allowNull: false,
        defaultValue: 'mañana',
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      nota: {
        type: DataTypes.STRING(300),
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
      modelName: 'ReporteProduccionInyeccionEncabezado',
      tableName: 'ReporteProduccionInyeccionEncabezado',
      timestamps: true,
      paranoid: true,
    }
  );

  ReporteProduccionInyeccionEncabezado.associate = (models) => {
    ReporteProduccionInyeccionEncabezado.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'Usuario' });
    ReporteProduccionInyeccionEncabezado.hasMany(models.ReportesProduccionesInyeccion, {
      foreignKey: 'ReporteProduccionInyeccionEncabezadoId',
      as: 'Detalles',
    });
  };

  return ReporteProduccionInyeccionEncabezado;
};
