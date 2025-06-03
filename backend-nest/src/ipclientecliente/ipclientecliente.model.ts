export default (sequelize, DataTypes) => {
  const IpClienteCliente = sequelize.define('IpClienteCliente', {
    ipClienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'IpClientes',
        key: 'id',
      },
    },
    clienteId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Clientes',
        key: 'id',
      },
    },
  }, {
    tableName: 'IpClienteCliente',
    timestamps: false,
  });

  return IpClienteCliente;
};
