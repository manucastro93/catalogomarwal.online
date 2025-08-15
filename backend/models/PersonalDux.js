export default (sequelize, DataTypes) => {
  const PersonalDux = sequelize.define('PersonalDux', {
    id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
    },
    id_personal: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    apellido_razon_social: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sincronizadoEl: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'PersonalDux',
    timestamps: true,
    paranoid: true,
  });

  PersonalDux.associate = (models) => {
    PersonalDux.hasMany(models.ClienteDux, {
      foreignKey: 'vendedorId',
      sourceKey: 'id_personal',
      as: 'Clientes',
    });
  };

  return PersonalDux;
};