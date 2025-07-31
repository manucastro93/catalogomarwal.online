export default (sequelize, DataTypes) => {
  const Operario = sequelize.define('Operario', {
    codigo: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    apellido: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    rubroId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'Rubros', key: 'id' }
    }
  }, {
    tableName: 'Operarios',
    timestamps: true,
    paranoid: true,
  });

  Operario.associate = (models) => {
    Operario.belongsTo(models.Rubro, { foreignKey: 'rubroId', as: 'rubro' });
  };

  return Operario;
};
