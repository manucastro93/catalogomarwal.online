export default (sequelize, DataTypes) => {
  const Pagina = sequelize.define(
    'Pagina',
    {
      logo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    },
    {
      freezeTableName: true, // 👈 esto evita la pluralización
    }
  );

  Pagina.associate = (models) => {
    Pagina.hasMany(models.Banner, { foreignKey: 'paginaId', as: 'Banners' });
  };

  return Pagina;
};
