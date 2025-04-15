export default (sequelize, DataTypes) => {
  const IpCliente = sequelize.define('IpCliente', {
    ip: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  }, {
    tableName: 'IpClientes',
    timestamps: true,
    paranoid: true,
  });

  IpCliente.associate = (models) => {
    IpCliente.belongsTo(models.Cliente, { foreignKey: 'clienteId' });
    IpCliente.hasMany(models.LogCliente, { foreignKey: 'ipClienteId' }); // era IpClienteId con mayúscula
  };

  return IpCliente;
};
