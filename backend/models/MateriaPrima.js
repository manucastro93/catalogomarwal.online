export default (sequelize, DataTypes) => {
  const MateriaPrima = sequelize.define('MateriaPrima', {
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
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
    costoDux: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true,
      defaultValue: 0,
    },
    activo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    unidadMedida: {
      type: DataTypes.ENUM('KG', 'MT', 'UN'),
      allowNull: true,
    },
    largo: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true,
    },
    ancho: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true,
    },
    alto: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true,
    },
    peso: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true,
    },
    stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    stockMinimo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    stockMaximo: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    observaciones: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    subcategoriaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'Subcategorias',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    }
  }, {
    tableName: 'MateriasPrimas',
    timestamps: true,
    paranoid: true,
  });

  MateriaPrima.associate = (models) => {
    MateriaPrima.belongsTo(models.Subcategoria, {
      foreignKey: 'subcategoriaId',
      as: 'Subcategoria',
    });

    MateriaPrima.hasMany(models.ComposicionProductoMateriaPrima, {
      foreignKey: 'materiaPrimaId',
      as: 'ProductosAsociados',
    });

  };

  return MateriaPrima;
};
