export default (sequelize, DataTypes) => {
  const Banner = sequelize.define('Banner', {
    imagen: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    fechaInicio: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fechaFin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    paginaId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  });

  Banner.associate = (models) => {
    Banner.belongsTo(models.Pagina, {
      foreignKey: 'paginaId',
      onDelete: 'CASCADE',
    });
  };

  return Banner;
};
