export default (sequelize, DataTypes) => {
  const Rubro = sequelize.define('Rubro', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  }, {
    tableName: 'Rubros',
    timestamps: true,
    paranoid: true,
  });

  Rubro.associate = (models) => {
    Rubro.hasMany(models.CategoriaPieza, { foreignKey: 'rubroId', as: 'categoriasPiezas' });
    Rubro.hasMany(models.Material, { foreignKey: 'rubroId', as: 'materiales' });
    Rubro.hasMany(models.Maquina, { foreignKey: 'rubroId', as: 'maquinas' });
    Rubro.hasMany(models.Operario, { foreignKey: 'rubroId', as: 'operarios' });
    Rubro.hasMany(models.Pieza, { foreignKey: 'rubroId', as: 'piezas' });
  };

  return Rubro;
};
