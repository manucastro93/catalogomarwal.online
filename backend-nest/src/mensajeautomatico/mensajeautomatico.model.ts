export default (sequelize, DataTypes) => {
  const MensajeAutomatico = sequelize.define('MensajeAutomatico', {
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    tipo: {
      type: DataTypes.ENUM('inactivo_inicial', 'inactivo_recordatorio'),
      allowNull: false,
    },
    fechaEnvio: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    respuestaCliente: {
    type: DataTypes.TEXT,
    allowNull: true,
    },
    estado: {
    type: DataTypes.ENUM('pendiente', 'respondido', 'interesado', 'cancelado'),
    defaultValue: 'pendiente',
    }

  }, {
    tableName: 'MensajesAutomaticos',
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ['clienteId', 'tipo'],
      },
    ],
  });

  MensajeAutomatico.associate = (models) => {
    MensajeAutomatico.belongsTo(models.Cliente, {
      foreignKey: 'clienteId',
      as: 'cliente',
    });
  };

  return MensajeAutomatico;
};
