export default (sequelize, DataTypes) => {
  const Cliente = sequelize.define('Cliente', {
    nombre: DataTypes.STRING,
    email: DataTypes.STRING,
    telefono: DataTypes.STRING,
    direccion: DataTypes.STRING,
    razonSocial: DataTypes.STRING,
    nro_doc: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    transporte: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    provinciaId: {
      type: DataTypes.INTEGER,
      references: { model: 'Provincias', key: 'id' },
    },
    localidadId: {
      type: DataTypes.INTEGER,
      references: { model: 'Localidades', key: 'id' },
    },
    vendedorId: DataTypes.INTEGER,
    latitud: DataTypes.DOUBLE,
    longitud: DataTypes.DOUBLE,
  }, {
    tableName: 'Clientes',
    timestamps: true,
    paranoid: true,
  });

  Cliente.associate = (models) => {
    Cliente.belongsTo(models.Provincia, {
      foreignKey: 'provinciaId',
      as: 'provincia',
    });
    Cliente.belongsTo(models.Localidad, {
      foreignKey: 'localidadId',
      as: 'localidad',
    });
    Cliente.belongsTo(models.Usuario, {
      foreignKey: 'vendedorId',
      as: 'vendedor',
    });
    Cliente.hasMany(models.Pedido, {
      foreignKey: 'clienteId',
      as: 'pedidos',
    });
    Cliente.belongsToMany(models.IpCliente, {
      through: models.IpClienteCliente,
      foreignKey: 'clienteId',
      otherKey: 'ipClienteId',
      as: 'ips',
    });
  };

  return Cliente;
};
