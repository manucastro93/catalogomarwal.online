export default (sequelize, DataTypes) => {
  const Subcategoria = sequelize.define(
    'Subcategoria',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        allowNull: false,
      },
      categoriaId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'Categorias',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      nombre: {
        type: DataTypes.STRING(255),
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
      modelName: 'Subcategoria',
      tableName: 'Subcategorias',
      timestamps: true,
      paranoid: true,
    }
  );

  Subcategoria.associate = (models) => {
    Subcategoria.belongsTo(models.Categoria, {
      foreignKey: 'categoriaId',
      as: 'Categoria',
    });

    Subcategoria.hasMany(models.Producto, {
      foreignKey: 'subcategoriaId',
      as: 'Productos',
    });
  };

  return Subcategoria;
};
