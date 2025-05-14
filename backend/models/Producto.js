export default (sequelize, DataTypes) => {
  const Producto = sequelize.define('Producto', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    precioUnitario: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    precioPorBulto: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    unidadPorBulto: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    marcaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Marcas',
        key: 'id',
      },
    },
    categoriaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Categorias',
        key: 'id',
      },
    },
    costoMP: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
    costoDux: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0,
    },
  }, {
    tableName: 'Productos',
    timestamps: true,
    paranoid: true,
  });

  Producto.associate = (models) => {
    Producto.belongsTo(models.Categoria, {
      foreignKey: 'categoriaId',
      as: 'Categoria',
    });

    Producto.belongsTo(models.Marca, {
      foreignKey: 'marcaId',
      as: 'Marca',
    });

    Producto.hasMany(models.ImagenProducto, {
      foreignKey: 'productoId',
      as: 'Imagenes',
    });
  };

  return Producto;
};
