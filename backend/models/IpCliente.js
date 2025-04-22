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
    IpCliente.belongsToMany(models.Cliente, {
      through: 'IpClienteCliente',
      foreignKey: 'ipClienteId',
      otherKey: 'clienteId',
      as: 'clientes',
    });
  
    IpCliente.hasMany(models.LogCliente, {
      foreignKey: 'ipClienteId',
      as: 'logs',
    });
  };
  

  return IpCliente;
};
