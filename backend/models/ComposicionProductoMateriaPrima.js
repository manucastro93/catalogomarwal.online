export default (sequelize, DataTypes) => {
  const ComposicionProductoMateriaPrima = sequelize.define('ComposicionProductoMateriaPrima', {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    productoId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: 'Productos',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    materiaPrimaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'MateriasPrimas',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    cantidad: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: false,
    },
    unidad: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
    detalle: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
  }, {
    tableName: 'ComposicionProductoMateriaPrima',
    timestamps: true,
    paranoid: true,
  });

  ComposicionProductoMateriaPrima.associate = (models) => {
    ComposicionProductoMateriaPrima.belongsTo(models.Producto, {
      foreignKey: 'productoId',
      as: 'Producto',
    });
    ComposicionProductoMateriaPrima.belongsTo(models.MateriaPrima, {
      foreignKey: 'materiaPrimaId',
      as: 'MateriaPrima',
    });
  };

  return ComposicionProductoMateriaPrima;
};
