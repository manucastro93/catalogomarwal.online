export default (sequelize, DataTypes) => {
  const ImagenProducto = sequelize.define('ImagenProducto', {
    url: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    productoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  ImagenProducto.associate = (models) => {
    ImagenProducto.belongsTo(models.Producto, {
      foreignKey: 'productoId',
    });
  };

  return ImagenProducto;
};
