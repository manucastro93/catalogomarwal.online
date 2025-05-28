export default (sequelize, DataTypes) => {
  const ConversacionBot = sequelize.define('ConversacionBot', {
    telefono: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    mensajeCliente: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    respuestaBot: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    derivar: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    clienteId: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  }, {
    tableName: 'ConversacionesBot',
    timestamps: true,
    paranoid: true,
  });

  ConversacionBot.associate = (models) => {
    ConversacionBot.belongsTo(models.Cliente, { foreignKey: 'clienteId', as: 'cliente' });
  };

  return ConversacionBot;
};
