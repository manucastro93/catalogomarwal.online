export default (sequelize, DataTypes) => {
  const IpCliente = sequelize.define('IpCliente', {
    ip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // 💡 SUGERENCIA: Podés declarar también el campo `clienteId` explícitamente
    clienteId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: true,
    },
  }, {
    tableName: 'IpClientes',
    timestamps: true,
    paranoid: true,
  });

  IpCliente.associate = (models) => {
    IpCliente.belongsTo(models.Cliente, {
      foreignKey: 'clienteId',
      as: 'cliente', // 🔍 opcional: te permite acceder como `ipCliente.cliente`
    });

    IpCliente.hasMany(models.LogCliente, {
      foreignKey: 'ipClienteId',
      as: 'logs', // 🔍 opcional: más claro cuando hacés includes
    });
  };

  return IpCliente;
};
