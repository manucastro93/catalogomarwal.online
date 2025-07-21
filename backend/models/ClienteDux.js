export default (sequelize, DataTypes) => {
  const ClienteDux = sequelize.define(
    'ClienteDux',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        primaryKey: true,
        autoIncrement: true,
      },
      fechaCreacion: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      cliente: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      categoriaFiscal: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      tipoDocumento: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      numeroDocumento: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      cuitCuil: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      cobrador: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      tipoCliente: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      personaContacto: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      noEditable: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      lugarEntregaPorDefecto: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      tipoComprobantePorDefecto: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      listaPrecioPorDefecto: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      habilitado: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      nombreFantasia: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      codigo: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      correoElectronico: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      vendedor: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      provincia: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      localidad: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      barrio: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      domicilio: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      telefono: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      celular: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      zona: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      condicionPago: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: 'ClienteDux',
      tableName: 'ClientesDux',
      timestamps: true,
      paranoid: true,
    }
  );

  ClienteDux.associate = (models) => {
    // Si más adelante se relaciona con PersonalDux, por ejemplo:
    // ClientesDux.belongsTo(models.PersonalDux, { foreignKey: 'vendedorId', as: 'Vendedor' });
  };

  return ClienteDux;
};
