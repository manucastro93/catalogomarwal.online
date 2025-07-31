export default (sequelize, DataTypes) => {
  const Maquina = sequelize.define('Maquina', {
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    rubroId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'Rubros', key: 'id' }
    },
    toneladas: {
      type: DataTypes.DECIMAL(10,2),
      allowNull: true,
    }
  }, {
    tableName: 'Maquinas',
    timestamps: true,
    paranoid: true,
  });

  Maquina.associate = (models) => {
    Maquina.belongsTo(models.Rubro, { foreignKey: 'rubroId', as: 'rubro' });
  };

  return Maquina;
};
