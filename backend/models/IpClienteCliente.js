export default (sequelize, DataTypes) => {
    const IpClienteCliente = sequelize.define('IpClienteCliente', {
      ipClienteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      clienteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    }, {
      tableName: 'IpClienteCliente',
      timestamps: false,
    });
  
    return IpClienteCliente;
  };
  