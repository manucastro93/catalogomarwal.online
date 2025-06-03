export default (sequelize, DataTypes) => {
  const Marca = sequelize.define('Marca', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'Marcas',
    timestamps: true,
    paranoid: true,
  });

  Marca.associate = (models) => {
    Marca.hasMany(models.Producto, {
      foreignKey: 'marcaId',
      as: 'Productos',
    });
  };

  return Marca;
};
