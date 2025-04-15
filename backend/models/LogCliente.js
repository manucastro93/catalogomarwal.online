export default (sequelize, DataTypes) => {
  const LogCliente = sequelize.define('LogCliente', {
    categoriaId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    busqueda: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    tiempoEnPantalla: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ubicacion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    sesion: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    referer: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    fuente: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    ipClienteId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    paranoid: true,
    timestamps: true,
    tableName: 'LogClientes',
  });

  LogCliente.associate = (models) => {
    LogCliente.belongsTo(models.IpCliente, {
      foreignKey: 'ipClienteId',
      as: 'ipCliente',
    });
  };

  return LogCliente;
};
