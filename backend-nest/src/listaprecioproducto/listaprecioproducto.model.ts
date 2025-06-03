export default (sequelize, DataTypes) => {
  const ListaPrecioProducto = sequelize.define('ListaPrecioProducto', {
    productoId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Productos',
        key: 'id',
      },
    },
    listaPrecioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    precio: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  }, {
    tableName: 'ListaPrecioProductos',
    timestamps: true,
    paranoid: true,
  });

  ListaPrecioProducto.associate = (models) => {
    ListaPrecioProducto.belongsTo(models.Producto, {
      foreignKey: 'productoId',
    });
  };

  return ListaPrecioProducto;
};
