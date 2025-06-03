export default (sequelize, DataTypes) => {
  const Categoria = sequelize.define(
    'Categoria',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      nombre: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      nombreWeb: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      orden: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      estado: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
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
    Categoria.hasMany(models.Producto, {
      foreignKey: 'categoriaId',
      as: 'Productos',
    });
  };

  return Categoria;
};
