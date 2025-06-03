export default (sequelize, DataTypes) => {
  const ListaPrecio = sequelize.define('ListaPrecio', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    activa: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  }, {
    tableName: 'ListasPrecio',
    timestamps: true,
    paranoid: true,
  });

  ListaPrecio.associate = (models) => {
    ListaPrecio.hasMany(models.ListaPrecioProducto, {
      foreignKey: 'listaPrecioId',
      as: 'productos',
    });
  };

  return ListaPrecio;
};
