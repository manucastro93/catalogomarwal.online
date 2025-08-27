export default (sequelize, DataTypes) => {
  const ProveedoresServicios = sequelize.define(
    "ProveedoresServicios",
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
      razonSocial: {
        type: DataTypes.STRING(255),
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
      tableName: "ProveedoresServicios",
      timestamps: true,
      paranoid: true,
    }
  );

  ProveedoresServicios.associate = (models) => {
    // Relación inversa al belongsTo que ya definiste en ComprobantesServicios
    ProveedoresServicios.hasMany(models.ComprobantesServicios, {
      foreignKey: "proveedorId",
      as: "comprobantes",
    });
  };

  return ProveedoresServicios;
};
