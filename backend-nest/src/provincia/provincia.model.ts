export default (sequelize, DataTypes) => {
  const Provincia = sequelize.define('Provincia', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    sequelize,
    modelName: 'Provincia',
    tableName: 'Provincias',
    timestamps: false,
    paranoid: false,
  });

  Provincia.associate = (models) => {
    Provincia.hasMany(models.Localidad, { foreignKey: 'provinciaId' });
    Provincia.hasMany(models.Cliente, { foreignKey: 'provinciaId' });
  };

  return Provincia;
};
