export default (sequelize, DataTypes) => {
  const CategoriaPieza = sequelize.define('CategoriaPieza', {
    nombre: {
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
    tableName: 'CategoriasPiezas',
    timestamps: true,
    paranoid: true,
  });

  CategoriaPieza.associate = (models) => {
    CategoriaPieza.belongsTo(models.Rubro, { foreignKey: 'rubroId', as: 'rubro' });
    CategoriaPieza.hasMany(models.Pieza, { foreignKey: 'categoria', as: 'piezas' });
  };

  return CategoriaPieza;
};
