export default (sequelize, DataTypes) => {
  const Factura = sequelize.define('Factura', {
    id: { type: DataTypes.INTEGER, primaryKey: true },
    id_cliente: DataTypes.INTEGER,
    id_empresa: DataTypes.INTEGER,
    nro_pto_vta: DataTypes.STRING,
    id_personal: DataTypes.INTEGER,
    nro_doc: DataTypes.STRING,
    tipo_comp: DataTypes.STRING,
    letra_comp: DataTypes.STRING,
    nro_comp: DataTypes.INTEGER,
    fecha_comp: DataTypes.DATE,
    nro_pedido: DataTypes.STRING,
    total: DataTypes.FLOAT,
    monto_gravado: DataTypes.FLOAT,
    monto_iva: DataTypes.FLOAT,
    apellido_razon_soc: DataTypes.STRING,
    nombre: DataTypes.STRING,
    nro_cae_cai: DataTypes.STRING,
    fecha_vencimiento_cae_cai: DataTypes.DATE,
    anulada_boolean: DataTypes.BOOLEAN,
    fecha_registro: DataTypes.DATE,
    detalles_json: DataTypes.JSON,
    detalles_cobro_json: DataTypes.JSON,
    sincronizadoEl: DataTypes.DATE,
    estadoFacturaId: DataTypes.INTEGER,
  });

  Factura.associate = (models) => {
    Factura.belongsTo(models.EstadoFactura, {
      foreignKey: 'estadoFacturaId',
      as: 'estado'
    });
    Factura.belongsTo(models.PedidoDux, {
      as: "pedidoDux",
      foreignKey: "nro_pedido",
      targetKey: "nro_pedido",
    });
    Factura.hasMany(models.DetalleFactura, {
      foreignKey: 'facturaId',
      as: 'detalles'
    });
  };

  return Factura;
};
