export default (sequelize, DataTypes) => {
    const HistorialCliente = sequelize.define('HistorialCliente', {
      campo: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      valorAnterior: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      valorNuevo: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      clienteId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      usuarioId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    }, {
      tableName: 'historial_clientes',
      timestamps: true,
      paranoid: true,
    });
  
    HistorialCliente.associate = (models) => {
      HistorialCliente.belongsTo(models.Cliente, { foreignKey: 'clienteId', as: 'cliente' });
      HistorialCliente.belongsTo(models.Usuario, { foreignKey: 'usuarioId', as: 'usuario' });
    };
  
    return HistorialCliente;
  };
  