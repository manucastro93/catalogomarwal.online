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
    categoriaPiezaId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'CategoriasPiezas', key: 'id' }
    },
    pzsXSeg: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true,
    },
    cicloXSeg: {
      type: DataTypes.DECIMAL(10,2),
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
      type: DataTypes.DECIMAL(10,2),
      allowNull: true,
    },
    materialId: {
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
    Pieza.belongsTo(models.CategoriaPieza, { foreignKey: 'categoriaPiezaId', as: 'categoriaPieza' });
    Pieza.belongsTo(models.Material, { foreignKey: 'materialId', as: 'materialObj' });
    Pieza.belongsTo(models.Rubro, { foreignKey: 'rubroId', as: 'rubro' });
  };

  return Pieza;
};
