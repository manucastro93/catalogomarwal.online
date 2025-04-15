export default (sequelize, DataTypes) => {
  const Categoria = sequelize.define(
    'Categoria',
    {
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      orden: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      estado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      sequelize,
      modelName: 'Categoria',
      tableName: 'Categorias',
      timestamps: true,
      paranoid: true,
    }
  );

  Categoria.associate = (models) => {
    Categoria.hasMany(models.Producto, { foreignKey: 'categoriaId' });
  };

  return Categoria;
};
