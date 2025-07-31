export default (sequelize, DataTypes) => {
  const Pieza = sequelize.define('Pieza', {
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    categoria: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'CategoriasPiezas', key: 'id' }
    },
    pzsXSeg: {
      type: DataTypes.DECIMAL(10,3),
      allowNull: true,
    },
    cicloXSeg: {
      type: DataTypes.DECIMAL(10,3),
      allowNull: true,
    },
    ciclosXTurno: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    cavidades: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    peso: {
      type: DataTypes.DECIMAL(10,3),
      allowNull: true,
    },
    material: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
      references: { model: 'Materiales', key: 'id' }
    },
    colada: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rubroId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'Rubros', key: 'id' }
    }
  }, {
    tableName: 'Piezas',
    timestamps: true,
    paranoid: true,
  });

  Pieza.associate = (models) => {
    Pieza.belongsTo(models.CategoriaPieza, { foreignKey: 'categoria', as: 'categoriaPieza' });
    Pieza.belongsTo(models.Material, { foreignKey: 'material', as: 'materialObj' });
    Pieza.belongsTo(models.Rubro, { foreignKey: 'rubroId', as: 'rubro' });
  };

  return Pieza;
};
