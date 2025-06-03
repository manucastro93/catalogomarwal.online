export default (sequelize, DataTypes) => {
    const EstadoPedido = sequelize.define('EstadoPedido', {
      nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
      },
      descripcion: {
        type: DataTypes.STRING,
        allowNull: true,
      },
    }, {
      tableName: 'EstadosPedidos',
      timestamps: true,
      paranoid: true,
    });
  
    EstadoPedido.associate = (models) => {
      EstadoPedido.hasMany(models.Pedido, {
        foreignKey: 'estadoPedidoId',
        as: 'pedidos',
      });
    };
  
    return EstadoPedido;
  };
  
