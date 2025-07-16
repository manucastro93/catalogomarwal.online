export default (sequelize, DataTypes) => {
  const ConfiguracionSistema = sequelize.define(
    'ConfiguracionSistema',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      clave: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      valor: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      descripcion: {
        type: DataTypes.STRING(255),
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
      modelName: 'ConfiguracionSistema',
      tableName: 'ConfiguracionesSistema',
      timestamps: true,
      paranoid: true,
    }
  );

  ConfiguracionSistema.associate = () => {
    // No tiene relaciones por ahora
  };

  return ConfiguracionSistema;
};
