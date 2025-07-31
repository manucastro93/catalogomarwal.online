export default (sequelize, DataTypes) => {
  const Material = sequelize.define('Material', {
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rubroId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'Rubros', key: 'id' }
    }
  }, {
    tableName: 'Materiales',
    timestamps: true,
    paranoid: true,
  });

  Material.associate = (models) => {
    Material.belongsTo(models.Rubro, { foreignKey: 'rubroId', as: 'rubro' });
    Material.hasMany(models.Pieza, { foreignKey: 'material', as: 'piezas' });
  };

  return Material;
};
