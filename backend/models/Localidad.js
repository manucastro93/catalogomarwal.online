export default (sequelize, DataTypes) => {
  const Localidad = sequelize.define('Localidad', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    provinciaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Provincia',
        key: 'id',
      },
    },
    codigoPostal: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  }, {
    sequelize,
    modelName: 'Localidad',
    tableName: 'Localidades',
    timestamps: false,
    paranoid: false,
  });

  Localidad.associate = (models) => {
    Localidad.belongsTo(models.Provincia, {
      foreignKey: 'provinciaId',
      as: 'provincia'
    });
    Localidad.hasMany(models.Cliente, {
      foreignKey: 'localidadId'
    });
  };

  return Localidad;
};
