export default (sequelize, DataTypes) => {
  const CategoriasServicios = sequelize.define(
    "CategoriasServicios",
    {
      id: {
        type: DataTypes.BIGINT.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      // timestamps/soft delete (según tu schema)
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "CategoriasServicios",
      timestamps: true,  // usa createdAt/updatedAt
      paranoid: true,    // usa deletedAt
    }
  );

  CategoriasServicios.associate = (models) => {
    // Relación inversa al belongsTo que ya definiste en ComprobantesServicios
    CategoriasServicios.hasMany(models.ComprobantesServicios, {
      foreignKey: "categoriaId",
      as: "comprobantes",
    });
  };

  return CategoriasServicios;
};
