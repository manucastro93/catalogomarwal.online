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
      // No PrimaryKey aquí si 'id' auto-incremental es la PK real de la tabla
      // Si prefieres que 'id_personal' sea la PK, descomenta la siguiente línea:
      // primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: true, // Asumiendo que puede ser nulo, aunque el ejemplo lo muestra
    },
    apellido_razon_social: {
      type: DataTypes.STRING,
      allowNull: true, // Asumiendo que puede ser nulo
    },
    sincronizadoEl: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'PersonalDux', // Nombre de la tabla en la base de datos
    timestamps: true, // Habilita createdAt y updatedAt
    paranoid: true, // Habilita deletedAt para soft-deletes
  });

  PersonalDux.associate = (models) => {
    PersonalDux.hasMany(models.Usuario, {foreignKey: 'personalDuxId',as: 'usuarios',});
  };

  return PersonalDux;
};